-- Calendar preparation is a planner write boundary too: it inserts sessions for
-- missing milestone ordinals on free dates, so a newly generated milestone:82
-- can land before milestone:22. Wrap it with the same chronological ordinal
-- normalizer used by set/clear schedule writes.

alter function public.prepare_planner_schedule(jsonb, jsonb, text, jsonb)
set schema private;

alter function private.prepare_planner_schedule(jsonb, jsonb, text, jsonb)
rename to prepare_planner_schedule_unnormalized;

revoke all
on function private.prepare_planner_schedule_unnormalized(jsonb, jsonb, text, jsonb)
from public, anon, authenticated;

create function public.prepare_planner_schedule(
  p_windows jsonb,
  p_items jsonb,
  p_expected_digest text,
  p_unplaceable jsonb default '[]'::jsonb
)
returns table (
  schedule_digest text,
  upserted_count integer,
  deleted_count integer,
  replayed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
  v_result record;
  v_milestone_goal_ids uuid[] := '{}'::uuid[];
begin
  if v_owner is null then
    raise exception using errcode = '28000', message = 'authentication_required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    private.planner_owner_lock_key(v_owner)
  );

  -- Snapshot goals whose in-window rows may be replaced before the writer runs;
  -- the payload alone cannot name a goal whose last in-window row is removed.
  if p_windows is not null and pg_catalog.jsonb_typeof(p_windows) = 'array' then
    select coalesce(
      pg_catalog.array_agg(distinct item.goal_id),
      '{}'::uuid[]
    )
    into v_milestone_goal_ids
    from public.planner_items item
    join public.goals goal on goal.id = item.goal_id
    where item.owner_id = v_owner
      and not goal.is_deleted
      and goal.frequency_type = 'fixed_milestones'::public.goal_frequency_type
      and exists (
        select 1
        from pg_catalog.jsonb_array_elements(p_windows) window_row(payload)
        where item.scheduled_date >= (window_row.payload ->> 'start_date')::date
          and item.scheduled_date <= (window_row.payload ->> 'end_date')::date
      );
  end if;

  select *
  into v_result
  from private.prepare_planner_schedule_unnormalized(
    p_windows,
    p_items,
    p_expected_digest,
    p_unplaceable
  );

  select coalesce(pg_catalog.array_agg(distinct affected.goal_id), '{}'::uuid[])
  into v_milestone_goal_ids
  from (
    select existing.goal_id
    from pg_catalog.unnest(v_milestone_goal_ids) existing(goal_id)

    union

    select item.goal_id
    from pg_catalog.jsonb_to_recordset(p_items) as item(goal_id uuid)
    join public.goals goal on goal.id = item.goal_id
    where goal.owner_id = v_owner
      and not goal.is_deleted
      and goal.frequency_type = 'fixed_milestones'::public.goal_frequency_type
  ) affected;

  perform private.normalize_milestone_planner_ordinals(
    v_owner,
    v_milestone_goal_ids
  );

  return query
  select
    public.get_planner_schedule_digest(v_owner),
    v_result.upserted_count,
    v_result.deleted_count,
    v_result.replayed;
end;
$$;

revoke all
on function public.prepare_planner_schedule(jsonb, jsonb, text, jsonb)
from public, anon;

grant execute
on function public.prepare_planner_schedule(jsonb, jsonb, text, jsonb)
to authenticated, service_role;

-- Repair the reported goal, whose calendar preparation inserted unordered
-- sessions after 20260929010000 ran and whose later linked-cascade completions
-- were never bound to a session. Bind those completions the way reconciliation
-- credits them (same-date session first, then earliest unallocated ordinal),
-- move credited sessions onto their completion dates as atomic completion
-- does, then renumber chronologically.
do $$
declare
  v_goal_id constant uuid := '6a1f2266-4030-4e92-9e91-b2f02b54a51e';
  v_owner_id uuid;
begin
  select goal.owner_id
  into v_owner_id
  from public.goals goal
  join auth.users user_row on user_row.id = goal.owner_id
  where goal.id = v_goal_id
    and pg_catalog.lower(user_row.email) = '3jerryliu@gmail.com'
    and not goal.is_deleted
    and goal.frequency_type = 'fixed_milestones'::public.goal_frequency_type;

  if v_owner_id is null then
    return;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    private.planner_owner_lock_key(v_owner_id)
  );

  with exact_matches as (
    select completion.id as completion_id, item.unit_key
    from public.completions completion
    join public.planner_items item
      on item.owner_id = completion.user_id
     and item.goal_id = completion.goal_id
     and item.scheduled_date = completion.completed_on
    where completion.goal_id = v_goal_id
      and completion.user_id = v_owner_id
      and completion.planner_unit_key is null
      and not exists (
        select 1
        from public.completions allocated
        where allocated.goal_id = v_goal_id
          and allocated.user_id = v_owner_id
          and allocated.planner_unit_key = item.unit_key
      )
  )
  update public.completions completion
  set planner_unit_key = exact_matches.unit_key
  from exact_matches
  where completion.id = exact_matches.completion_id;

  with available_units as (
    select
      'milestone:' || ordinal::text as unit_key,
      pg_catalog.row_number() over (order by ordinal) as allocation_rank
    from public.goals goal
    cross join lateral pg_catalog.generate_series(
      1,
      greatest(coalesce(goal.target_count, 1), 1)
    ) ordinal
    where goal.id = v_goal_id
      and not exists (
        select 1
        from public.completions allocated
        where allocated.goal_id = v_goal_id
          and allocated.user_id = v_owner_id
          and allocated.planner_unit_key = 'milestone:' || ordinal::text
      )
  ),
  unallocated_completions as (
    select
      completion.id,
      pg_catalog.row_number() over (
        order by completion.completed_on, completion.created_at, completion.id
      ) as allocation_rank
    from public.completions completion
    where completion.goal_id = v_goal_id
      and completion.user_id = v_owner_id
      and completion.planner_unit_key is null
  )
  update public.completions completion
  set planner_unit_key = unit.unit_key
  from unallocated_completions unallocated
  join available_units unit
    on unit.allocation_rank = unallocated.allocation_rank
  where completion.id = unallocated.id;

  update public.planner_items item
  set
    scheduled_date = completion.completed_on,
    original_scheduled_date = coalesce(
      item.original_scheduled_date,
      item.scheduled_date
    ),
    updated_at = pg_catalog.now()
  from public.completions completion
  where item.goal_id = v_goal_id
    and item.owner_id = v_owner_id
    and completion.goal_id = v_goal_id
    and completion.user_id = v_owner_id
    and completion.planner_unit_key = item.unit_key
    and item.scheduled_date is distinct from completion.completed_on
    and not item.locked
    and not exists (
      select 1
      from public.planner_items destination_item
      where destination_item.goal_id = v_goal_id
        and destination_item.scheduled_date = completion.completed_on
        and destination_item.id <> item.id
    );

  perform private.normalize_milestone_planner_ordinals(
    v_owner_id,
    array[v_goal_id]
  );
end;
$$;
