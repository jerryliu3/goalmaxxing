-- Persist optional per-item display titles on planner_items.
-- Custom labels are session-scoped (goal_id + unit_key), not goal-wide.

alter table public.planner_items
add column if not exists label text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'planner_items_label_length'
      and conrelid = 'public.planner_items'::regclass
  ) then
    alter table public.planner_items
    add constraint planner_items_label_length
    check (
      label is null
      or char_length(label) between 1 and 200
    );
  end if;
end;
$$;

create or replace function public.get_planner_schedule_digest(
  p_owner uuid default auth.uid()
)
returns text
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
begin
  if v_owner is null then
    raise exception using errcode = '28000', message = 'authentication_required';
  end if;
  if p_owner is not null and p_owner <> v_owner then
    raise exception using errcode = '42501', message = 'owner_mismatch';
  end if;

  return (
    select private.sha256_hex_digest(
      coalesce(
        string_agg(
          format(
            '%s|%s|%s|%s|%s|%s|%s',
            item.goal_id::text,
            item.unit_key,
            item.scheduled_date::text,
            coalesce(item.original_scheduled_date::text, ''),
            coalesce(item.scheduled_time, ''),
            case when item.locked then '1' else '0' end,
            coalesce(item.label, '')
          ),
          ',' order by item.goal_id, item.unit_key
        ),
        'empty'
      )
    )
    from public.planner_items item
    where item.owner_id = v_owner
  );
end;
$$;

grant execute on function public.get_planner_schedule_digest(uuid) to authenticated;

create or replace function private.planner_window_is_replay(
  p_owner_id uuid,
  p_start date,
  p_end date,
  p_items jsonb
)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with schedule_input as (
    select
      row.goal_id,
      btrim(row.unit_key) as unit_key,
      row.scheduled_date,
      coalesce(row.original_scheduled_date, row.scheduled_date) as original_scheduled_date,
      nullif(btrim(row.scheduled_time), '') as scheduled_time,
      coalesce(row.locked, false) as locked,
      nullif(btrim(row.label), '') as label
    from jsonb_to_recordset(p_items) as row(
      goal_id uuid,
      unit_key text,
      scheduled_date date,
      original_scheduled_date date,
      scheduled_time text,
      locked boolean,
      label text
    )
  ),
  existing_window as (
    select
      item.goal_id,
      item.unit_key,
      item.scheduled_date,
      coalesce(item.original_scheduled_date, item.scheduled_date) as original_scheduled_date,
      item.scheduled_time,
      item.locked,
      item.label
    from public.planner_items item
    where item.owner_id = p_owner_id
      and item.scheduled_date >= p_start
      and item.scheduled_date <= p_end
  )
  select not exists (
    (table schedule_input except table existing_window)
    union all
    (table existing_window except table schedule_input)
  );
$$;

create or replace function public.set_planner_schedule(
  p_start date,
  p_end date,
  p_items jsonb,
  p_expected_digest text
)
returns table (
  schedule_digest text,
  upserted_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
  v_current_digest text;
  v_is_replay boolean := false;
  v_upserted_count integer := 0;
  v_has_invalid_unit_key boolean := false;
  v_has_invalid_scheduled_time boolean := false;
  v_has_invalid_item_label boolean := false;
  v_has_window_mismatch boolean := false;
  v_has_duplicate_goal_unit boolean := false;
  v_has_duplicate_goal_date boolean := false;
  v_has_unknown_goal boolean := false;
  v_has_lifetime_violation boolean := false;
  v_has_target_cap_violation boolean := false;
begin
  if v_owner is null then
    raise exception using errcode = '28000', message = 'authentication_required';
  end if;
  perform private.assert_planner_schedule_window(p_start, p_end);
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception using errcode = '22023', message = 'invalid_schedule_payload';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    private.planner_owner_lock_key(v_owner)
  );

  select public.get_planner_schedule_digest(v_owner)
  into v_current_digest;

  with schedule_input as (
    select
      row.goal_id,
      btrim(row.unit_key) as unit_key,
      row.scheduled_date,
      coalesce(row.original_scheduled_date, row.scheduled_date) as original_scheduled_date,
      nullif(btrim(row.scheduled_time), '') as scheduled_time,
      coalesce(row.locked, false) as locked,
      nullif(btrim(row.label), '') as label
    from jsonb_to_recordset(p_items) as row(
      goal_id uuid,
      unit_key text,
      scheduled_date date,
      original_scheduled_date date,
      scheduled_time text,
      locked boolean,
      label text
    )
  ),
  validation_flags as (
    select
      exists (
        select 1
        from schedule_input
        where char_length(unit_key) < 1 or char_length(unit_key) > 120
      ) as has_invalid_unit_key,
      exists (
        select 1
        from schedule_input
        where scheduled_time is not null
          and scheduled_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      ) as has_invalid_scheduled_time,
      exists (
        select 1
        from schedule_input
        where label is not null
          and char_length(label) > 200
      ) as has_invalid_item_label,
      exists (
        select 1
        from schedule_input
        where scheduled_date < p_start
          or scheduled_date > p_end
      ) as has_window_mismatch,
      exists (
        select 1
        from schedule_input
        group by goal_id, unit_key
        having count(*) > 1
      ) as has_duplicate_goal_unit,
      exists (
        select 1
        from schedule_input
        group by goal_id, scheduled_date
        having count(*) > 1
      ) as has_duplicate_goal_date,
      exists (
        select 1
        from schedule_input item
        left join public.goals goal on goal.id = item.goal_id
        where goal.id is null
          or goal.owner_id <> v_owner
          or goal.is_deleted
      ) as has_unknown_goal,
      exists (
        select 1
        from schedule_input item
        join public.goals goal on goal.id = item.goal_id
        where item.scheduled_date < goal.start_date
           or (goal.end_date is not null and item.scheduled_date > goal.end_date)
      ) as has_lifetime_violation,
      exists (
        with incoming as (
          select goal_id, count(*)::int as incoming_count
          from schedule_input
          group by goal_id
        ),
        existing_not_superseded as (
          select item.goal_id, count(*)::int as existing_count
          from public.planner_items item
          where item.owner_id = v_owner
            and not exists (
              select 1
              from schedule_input incoming_item
              where incoming_item.goal_id = item.goal_id
                and incoming_item.unit_key = item.unit_key
            )
          group by item.goal_id
        )
        select 1
        from public.goals goal
        join incoming on incoming.goal_id = goal.id
        left join existing_not_superseded existing on existing.goal_id = goal.id
        where goal.owner_id = v_owner
          and goal.target_basis = 'lifetime'::public.goal_target_basis
          and goal.target_count is not null
          and goal.target_count > 0
          and incoming.incoming_count + coalesce(existing.existing_count, 0) > goal.target_count
      ) as has_target_cap_violation
  )
  select
    has_invalid_unit_key,
    has_invalid_scheduled_time,
    has_invalid_item_label,
    has_window_mismatch,
    has_duplicate_goal_unit,
    has_duplicate_goal_date,
    has_unknown_goal,
    has_lifetime_violation,
    has_target_cap_violation
  into
    v_has_invalid_unit_key,
    v_has_invalid_scheduled_time,
    v_has_invalid_item_label,
    v_has_window_mismatch,
    v_has_duplicate_goal_unit,
    v_has_duplicate_goal_date,
    v_has_unknown_goal,
    v_has_lifetime_violation,
    v_has_target_cap_violation
  from validation_flags;

  if v_has_invalid_unit_key then
    raise exception using errcode = '22023', message = 'invalid_unit_key';
  end if;
  if v_has_invalid_scheduled_time then
    raise exception using errcode = '22023', message = 'invalid_scheduled_time';
  end if;
  if v_has_invalid_item_label then
    raise exception using errcode = '22023', message = 'invalid_item_label';
  end if;
  if v_has_window_mismatch then
    raise exception using errcode = '22023', message = 'scheduled_date_outside_window';
  end if;
  if v_has_duplicate_goal_unit then
    raise exception using errcode = '22023', message = 'duplicate_goal_unit';
  end if;
  if v_has_duplicate_goal_date then
    raise exception using errcode = '22023', message = 'duplicate_goal_date';
  end if;
  if v_has_unknown_goal then
    raise exception using errcode = '22023', message = 'unknown_goal';
  end if;
  if v_has_lifetime_violation then
    raise exception using errcode = 'P0001', message = 'scheduled_outside_goal_lifetime';
  end if;
  if v_has_target_cap_violation then
    raise exception using errcode = 'P0001', message = 'exceeds_target_count';
  end if;

  select private.planner_window_is_replay(v_owner, p_start, p_end, p_items)
  into v_is_replay;

  if v_is_replay then
    return query
    select v_current_digest, 0;
    return;
  end if;

  if coalesce(p_expected_digest, '') <> coalesce(v_current_digest, '') then
    raise exception using errcode = 'P0001', message = 'stale_schedule';
  end if;

  delete from public.planner_items item
  where item.owner_id = v_owner
    and item.scheduled_date >= p_start
    and item.scheduled_date <= p_end;

  begin
    with schedule_input as (
      select
        row.goal_id,
        btrim(row.unit_key) as unit_key,
        row.scheduled_date,
        coalesce(row.original_scheduled_date, row.scheduled_date) as original_scheduled_date,
        nullif(btrim(row.scheduled_time), '') as scheduled_time,
        coalesce(row.locked, false) as locked,
        nullif(btrim(row.label), '') as label
      from jsonb_to_recordset(p_items) as row(
        goal_id uuid,
        unit_key text,
        scheduled_date date,
        original_scheduled_date date,
        scheduled_time text,
        locked boolean,
        label text
      )
    )
    insert into public.planner_items (
      owner_id,
      goal_id,
      unit_key,
      scheduled_date,
      original_scheduled_date,
      scheduled_time,
      locked,
      label
    )
    select
      v_owner,
      item.goal_id,
      item.unit_key,
      item.scheduled_date,
      item.original_scheduled_date,
      item.scheduled_time,
      item.locked,
      item.label
    from schedule_input item
    on conflict (goal_id, unit_key)
    do update
    set
      owner_id = excluded.owner_id,
      scheduled_date = excluded.scheduled_date,
      original_scheduled_date = excluded.original_scheduled_date,
      scheduled_time = excluded.scheduled_time,
      locked = excluded.locked,
      label = excluded.label;

    get diagnostics v_upserted_count = row_count;
  exception
    when unique_violation then
      raise exception using errcode = 'P0001', message = 'schedule_conflict';
  end;

  return query
  select
    public.get_planner_schedule_digest(v_owner),
    v_upserted_count;
end;
$$;

-- Keep prepare's delete/insert snapshot aligned with custom labels so regeneration
-- does not strip titles that save already persisted.
do $migration$
declare
  v_definition text;
  v_recordset_count integer;
  v_select_count integer;
  v_existing_count integer;
  v_insert_count integer;
begin
  select pg_catalog.pg_get_functiondef(
    'public.prepare_planner_schedule_core(jsonb,jsonb,text)'::regprocedure
  )
  into v_definition;

  v_recordset_count := (
    pg_catalog.length(v_definition)
    - pg_catalog.length(
      pg_catalog.replace(
        v_definition,
        'scheduled_time text,
        locked boolean
      )',
        ''
      )
    )
  ) / pg_catalog.length(
    'scheduled_time text,
        locked boolean
      )'
  );

  if v_recordset_count < 1 then
    raise exception using
      errcode = '55000',
      message = 'unexpected_prepare_item_recordset_count: ' || v_recordset_count;
  end if;

  v_definition := pg_catalog.replace(
    v_definition,
    'scheduled_time text,
        locked boolean
      )',
    'scheduled_time text,
        locked boolean,
        label text
      )'
  );

  v_select_count := (
    pg_catalog.length(v_definition)
    - pg_catalog.length(
      pg_catalog.replace(
        v_definition,
        'nullif(pg_catalog.btrim(row.scheduled_time), '''') as scheduled_time,
      coalesce(row.locked, false) as locked',
        ''
      )
    )
  ) / pg_catalog.length(
    'nullif(pg_catalog.btrim(row.scheduled_time), '''') as scheduled_time,
      coalesce(row.locked, false) as locked'
  );

  if v_select_count < 1 then
    raise exception using
      errcode = '55000',
      message = 'unexpected_prepare_item_select_count: ' || v_select_count;
  end if;

  v_definition := pg_catalog.replace(
    v_definition,
    'nullif(pg_catalog.btrim(row.scheduled_time), '''') as scheduled_time,
      coalesce(row.locked, false) as locked',
    'nullif(pg_catalog.btrim(row.scheduled_time), '''') as scheduled_time,
      coalesce(row.locked, false) as locked,
      nullif(pg_catalog.btrim(row.label), '''') as label'
  );

  v_existing_count := (
    pg_catalog.length(v_definition)
    - pg_catalog.length(
      pg_catalog.replace(
        v_definition,
        'item.scheduled_time,
      item.locked
    from public.planner_items item',
        ''
      )
    )
  ) / pg_catalog.length(
    'item.scheduled_time,
      item.locked
    from public.planner_items item'
  );

  if v_existing_count <> 1 then
    raise exception using
      errcode = '55000',
      message = 'unexpected_prepare_existing_window_count: ' || v_existing_count;
  end if;

  v_definition := pg_catalog.replace(
    v_definition,
    'item.scheduled_time,
      item.locked
    from public.planner_items item',
    'item.scheduled_time,
      item.locked,
      item.label
    from public.planner_items item'
  );

  v_insert_count := (
    pg_catalog.length(v_definition)
    - pg_catalog.length(
      pg_catalog.replace(
        v_definition,
        'scheduled_time,
      locked
    )
    select
      v_owner,
      item.goal_id,
      item.unit_key,
      item.scheduled_date,
      item.original_scheduled_date,
      item.scheduled_time,
      item.locked',
        ''
      )
    )
  ) / pg_catalog.length(
    'scheduled_time,
      locked
    )
    select
      v_owner,
      item.goal_id,
      item.unit_key,
      item.scheduled_date,
      item.original_scheduled_date,
      item.scheduled_time,
      item.locked'
  );

  if v_insert_count <> 1 then
    raise exception using
      errcode = '55000',
      message = 'unexpected_prepare_insert_count: ' || v_insert_count;
  end if;

  v_definition := pg_catalog.replace(
    v_definition,
    'scheduled_time,
      locked
    )
    select
      v_owner,
      item.goal_id,
      item.unit_key,
      item.scheduled_date,
      item.original_scheduled_date,
      item.scheduled_time,
      item.locked',
    'scheduled_time,
      locked,
      label
    )
    select
      v_owner,
      item.goal_id,
      item.unit_key,
      item.scheduled_date,
      item.original_scheduled_date,
      item.scheduled_time,
      item.locked,
      item.label'
  );

  v_definition := pg_catalog.replace(
    v_definition,
    'scheduled_time = excluded.scheduled_time,
      locked = excluded.locked;',
    'scheduled_time = excluded.scheduled_time,
      locked = excluded.locked,
      label = excluded.label;'
  );

  execute v_definition;
end;
$migration$;

revoke all
on function public.prepare_planner_schedule_core(jsonb, jsonb, text)
from public, anon;

grant execute
on function public.prepare_planner_schedule_core(jsonb, jsonb, text)
to service_role;
