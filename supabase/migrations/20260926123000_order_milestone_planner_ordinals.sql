-- Milestone planner identities are positional: milestone:1 is the earliest
-- scheduled milestone, milestone:2 the next, and so on. Keep that invariant at
-- the canonical schedule write boundary so drag-and-drop order and completion
-- order cannot diverge.

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
      case
        when goal.frequency_type = 'fixed_milestones'::public.goal_frequency_type
          then null
        else pg_catalog.btrim(row.unit_key)
      end as comparison_unit_key,
      row.scheduled_date,
      coalesce(
        row.original_scheduled_date,
        row.scheduled_date
      ) as original_scheduled_date,
      nullif(pg_catalog.btrim(row.scheduled_time), '') as scheduled_time,
      coalesce(row.locked, false) as locked
    from pg_catalog.jsonb_to_recordset(p_items) as row(
      goal_id uuid,
      unit_key text,
      scheduled_date date,
      original_scheduled_date date,
      scheduled_time text,
      locked boolean
    )
    left join public.goals goal
      on goal.id = row.goal_id
     and goal.owner_id = p_owner_id
  ),
  existing_window as (
    select
      item.goal_id,
      case
        when goal.frequency_type = 'fixed_milestones'::public.goal_frequency_type
          then null
        else item.unit_key
      end as comparison_unit_key,
      item.scheduled_date,
      coalesce(
        item.original_scheduled_date,
        item.scheduled_date
      ) as original_scheduled_date,
      item.scheduled_time,
      item.locked
    from public.planner_items item
    join public.goals goal on goal.id = item.goal_id
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

create or replace function private.normalize_milestone_planner_ordinals(
  p_owner_id uuid,
  p_goal_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
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
end;
$$;

revoke all on function private.normalize_milestone_planner_ordinals(uuid, uuid[])
from public, anon, authenticated;

-- Preserve the existing validated writer as a private implementation, then
-- wrap it with the milestone ordering invariant. This keeps validation,
-- stale-write protection, and replay behavior in one existing code path.
alter function public.set_planner_schedule(date, date, jsonb, text)
set schema private;

alter function private.set_planner_schedule(date, date, jsonb, text)
rename to set_planner_schedule_core;

revoke all on function private.set_planner_schedule_core(date, date, jsonb, text)
from public, anon, authenticated;

create function public.set_planner_schedule(
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
  v_upserted_count integer := 0;
  v_milestone_goal_ids uuid[] := '{}'::uuid[];
begin
  select result.upserted_count
  into v_upserted_count
  from private.set_planner_schedule_core(
    p_start,
    p_end,
    p_items,
    p_expected_digest
  ) result;

  select coalesce(
    pg_catalog.array_agg(distinct item.goal_id),
    '{}'::uuid[]
  )
  into v_milestone_goal_ids
  from pg_catalog.jsonb_to_recordset(p_items) as item(goal_id uuid)
  join public.goals goal on goal.id = item.goal_id
  where goal.owner_id = v_owner
    and not goal.is_deleted
    and goal.frequency_type = 'fixed_milestones'::public.goal_frequency_type;

  perform private.normalize_milestone_planner_ordinals(
    v_owner,
    v_milestone_goal_ids
  );

  return query
  select
    public.get_planner_schedule_digest(v_owner),
    v_upserted_count;
end;
$$;

revoke all on function public.set_planner_schedule(date, date, jsonb, text)
from public, anon;
grant execute on function public.set_planner_schedule(date, date, jsonb, text)
to authenticated;

-- Repair the reported account without silently rewriting every existing user's
-- milestone labels. Other accounts normalize the next time their plan is saved.
do $$
declare
  v_owner_id uuid;
  v_goal_ids uuid[];
begin
  select user_row.id
  into v_owner_id
  from auth.users user_row
  where pg_catalog.lower(user_row.email) = '3jerryliu@gmail.com'
  limit 1;

  if v_owner_id is not null then
    select pg_catalog.array_agg(distinct item.goal_id)
    into v_goal_ids
    from public.planner_items item
    join public.goals goal on goal.id = item.goal_id
    where item.owner_id = v_owner_id
      and not goal.is_deleted
      and goal.frequency_type = 'fixed_milestones'::public.goal_frequency_type;

    perform private.normalize_milestone_planner_ordinals(
      v_owner_id,
      v_goal_ids
    );
  end if;
end;
$$;
