-- Keep chronological milestone renumbering and move durable completion
-- allocations through the same permutation in the same transaction.
create or replace function private.normalize_milestone_planner_ordinals(
  p_owner_id uuid,
  p_goal_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_allocations jsonb;
begin
  if p_owner_id is null
     or coalesce(pg_catalog.cardinality(p_goal_ids), 0) = 0 then
    return;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    private.planner_owner_lock_key(p_owner_id)
  );

  if exists (
    select 1
    from pg_catalog.unnest(p_goal_ids) requested(goal_id)
    left join public.goals goal on goal.id = requested.goal_id
    where goal.id is null
      or goal.owner_id <> p_owner_id
      or goal.is_deleted
      or goal.frequency_type <> 'fixed_milestones'::public.goal_frequency_type
  ) then
    raise exception using
      errcode = '42501',
      message = 'milestone_ordinal_normalization_not_allowed';
  end if;

  if not exists (
    with ranked as (
      select
        item.unit_key,
        pg_catalog.row_number() over (
          partition by item.goal_id
          order by item.scheduled_date, item.id
        ) as ordinal
      from public.planner_items item
      where item.owner_id = p_owner_id
        and item.goal_id = any(p_goal_ids)
    )
    select 1
    from ranked
    where ranked.unit_key <> 'milestone:' || ranked.ordinal::text
  ) then
    return;
  end if;

  -- Preserve the allocation while positional keys are permuted. Include empty
  -- ordinals after the scheduled rows so window removal cannot collide with a
  -- completion whose planner row was removed.
  with slots as (
    select goal.id as goal_id, 'milestone:' || ordinal::text as old_key,
      item.scheduled_date, ordinal
    from public.goals goal
    cross join lateral pg_catalog.generate_series(1, goal.target_count) ordinal
    left join public.planner_items item
      on item.goal_id = goal.id
     and item.unit_key = 'milestone:' || ordinal::text
     and item.owner_id = p_owner_id
    where goal.id = any(p_goal_ids) and goal.owner_id = p_owner_id
  ), mapped as (
    select goal_id, old_key,
      'milestone:' || pg_catalog.row_number() over (
        partition by goal_id order by scheduled_date nulls last, ordinal
      )::text as new_key
    from slots
  )
  select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'id', completion.id, 'unit_key', mapped.new_key
  )), '[]'::jsonb)
  into v_allocations
  from public.completions completion
  join mapped on mapped.goal_id = completion.goal_id
    and mapped.old_key = completion.planner_unit_key
  where completion.user_id = p_owner_id;

  update public.completions completion
  set planner_unit_key = '__milestone_reorder__:' || completion.id::text
  where completion.id in (
    select row.id from pg_catalog.jsonb_to_recordset(v_allocations) as row(id uuid)
  );

  -- Move every affected key out of the canonical namespace first so swaps do
  -- not trip the unique (goal_id, unit_key) constraint mid-update.
  update public.planner_items item
  set unit_key = '__milestone_reorder__:' || item.id::text
  where item.owner_id = p_owner_id
    and item.goal_id = any(p_goal_ids);

  with ranked as (
    select
      item.id,
      pg_catalog.row_number() over (
        partition by item.goal_id
        order by item.scheduled_date, item.id
      ) as ordinal
    from public.planner_items item
    where item.owner_id = p_owner_id
      and item.goal_id = any(p_goal_ids)
  )
  update public.planner_items item
  set unit_key = 'milestone:' || ranked.ordinal::text
  from ranked
  where item.id = ranked.id;
  update public.completions completion
  set planner_unit_key = row.unit_key
  from pg_catalog.jsonb_to_recordset(v_allocations) as row(id uuid, unit_key text)
  where completion.id = row.id and completion.user_id = p_owner_id;
end;
$$;

revoke all on function private.normalize_milestone_planner_ordinals(uuid, uuid[])
from public, anon, authenticated;

-- Atomic completion and undo are moves too; keep the same ordering invariant.
create or replace function public.complete_planner_item_on_date_service(
  p_goal_id uuid,
  p_unit_key text,
  p_date date,
  p_expected_digest text
)
returns table (
  schedule_digest text,
  moved_from date,
  moved_to date
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
  v_item public.planner_items%rowtype;
  v_current_digest text;
begin
  if v_owner is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  if not public.can_complete_goal(p_goal_id, v_owner) then
    raise exception using errcode = '42501', message = 'completion_not_allowed';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    private.planner_owner_lock_key(v_owner)
  );

  v_current_digest := public.get_planner_schedule_digest(v_owner);
  if coalesce(p_expected_digest, '') <> coalesce(v_current_digest, '') then
    raise exception using errcode = 'P0001', message = 'stale_schedule';
  end if;

  select item.*
  into v_item
  from public.planner_items item
  where item.owner_id = v_owner
    and item.goal_id = p_goal_id
    and item.unit_key = pg_catalog.btrim(p_unit_key)
  for update;

  if v_item.id is null then
    raise exception using errcode = 'P0002', message = 'planner_item_not_found';
  end if;

  if v_item.locked and v_item.scheduled_date is distinct from p_date then
    raise exception using errcode = '55000', message = 'planner_item_locked';
  end if;

  if exists (
    select 1
    from public.planner_items other_item
    where other_item.goal_id = p_goal_id
      and other_item.scheduled_date = p_date
      and other_item.id <> v_item.id
  ) then
    raise exception using errcode = '23505', message = 'planner_destination_conflict';
  end if;

  update public.planner_items item
  set
    scheduled_date = p_date,
    original_scheduled_date = coalesce(
      item.original_scheduled_date,
      item.scheduled_date
    ),
    updated_at = pg_catalog.now()
  where item.id = v_item.id;

  perform public.mark_goal_complete(p_goal_id, p_date);

  update public.completions completion
  set planner_unit_key = pg_catalog.btrim(p_unit_key)
  where completion.goal_id = p_goal_id
    and completion.user_id = v_owner
    and completion.completed_on = p_date;

  if exists (
    select 1 from public.goals goal
    where goal.id = p_goal_id and goal.owner_id = v_owner
      and goal.frequency_type = 'fixed_milestones'
  ) then
    perform private.normalize_milestone_planner_ordinals(v_owner, array[p_goal_id]);
  end if;

  return query
  select
    public.get_planner_schedule_digest(v_owner),
    v_item.scheduled_date,
    p_date;
end;
$$;

revoke all on function public.complete_planner_item_on_date_service(
  uuid,
  text,
  date,
  text
) from public, anon;

grant execute on function public.complete_planner_item_on_date_service(
  uuid,
  text,
  date,
  text
) to authenticated;

-- Undo the canonical completion fact and restore an automatically moved
-- planner item when its original slot is still available.

create or replace function public.uncomplete_planner_item_on_date_service(
  p_goal_id uuid,
  p_date date,
  p_expected_digest text
)
returns table (
  schedule_digest text,
  unit_key text,
  restored_from date,
  restored_to date
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
  v_current_digest text;
  v_unit_key text;
  v_item public.planner_items%rowtype;
  v_restore_date date;
begin
  if v_owner is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  if not public.can_complete_goal(p_goal_id, v_owner) then
    raise exception using errcode = '42501', message = 'completion_not_allowed';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    private.planner_owner_lock_key(v_owner)
  );

  v_current_digest := public.get_planner_schedule_digest(v_owner);
  if coalesce(p_expected_digest, '') <> coalesce(v_current_digest, '') then
    raise exception using errcode = 'P0001', message = 'stale_schedule';
  end if;

  select completion.planner_unit_key
  into v_unit_key
  from public.completions completion
  where completion.goal_id = p_goal_id
    and completion.user_id = v_owner
    and completion.completed_on = p_date
  for update;

  if v_unit_key is not null then
    select item.*
    into v_item
    from public.planner_items item
    where item.owner_id = v_owner
      and item.goal_id = p_goal_id
      and item.unit_key = v_unit_key
    for update;
  end if;

  perform public.unmark_goal_complete(p_goal_id, p_date);

  v_restore_date := v_item.original_scheduled_date;
  if v_item.id is not null
    and v_restore_date is not null
    and v_restore_date is distinct from v_item.scheduled_date
    and exists (
      select 1
      from public.goals goal
      where goal.id = p_goal_id
        and goal.owner_id = v_owner
        and v_restore_date >= goal.start_date
        and (goal.end_date is null or v_restore_date <= goal.end_date)
    )
    and not exists (
      select 1
      from public.planner_items other_item
      where other_item.goal_id = p_goal_id
        and other_item.scheduled_date = v_restore_date
        and other_item.id <> v_item.id
    )
  then
    update public.planner_items item
    set
      scheduled_date = v_restore_date,
      original_scheduled_date = null,
      updated_at = pg_catalog.now()
    where item.id = v_item.id;
  else
    v_restore_date := null;
  end if;

  if exists (
    select 1 from public.goals goal
    where goal.id = p_goal_id and goal.owner_id = v_owner
      and goal.frequency_type = 'fixed_milestones'
  ) then
    perform private.normalize_milestone_planner_ordinals(v_owner, array[p_goal_id]);
  end if;

  if v_item.id is not null then
    select item.unit_key into v_unit_key
    from public.planner_items item where item.id = v_item.id;
  end if;

  return query
  select
    public.get_planner_schedule_digest(v_owner),
    v_unit_key,
    case when v_restore_date is null then null else v_item.scheduled_date end,
    v_restore_date;
end;
$$;

revoke all on function public.uncomplete_planner_item_on_date_service(
  uuid,
  date,
  text
) from public, anon;

grant execute on function public.uncomplete_planner_item_on_date_service(
  uuid,
  date,
  text
) to authenticated;
