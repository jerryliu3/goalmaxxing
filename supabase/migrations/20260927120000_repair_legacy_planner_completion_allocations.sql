-- Repair legacy ordinal-based planner completions that predate durable unit
-- allocation. Cadence goals are intentionally excluded because assigning them
-- requires period eligibility and week-anchor context.

with exact_matches as (
  select
    completion.id as completion_id,
    item.unit_key
  from public.completions completion
  join public.goals goal
    on goal.id = completion.goal_id
    and goal.owner_id = completion.user_id
  join public.planner_items item
    on item.owner_id = completion.user_id
    and item.goal_id = completion.goal_id
    and item.scheduled_date = completion.completed_on
  where completion.planner_unit_key is null
    and (
      goal.frequency_type = 'fixed_milestones'
      or (
        goal.frequency_type = 'recurring'
        and goal.target_basis = 'lifetime'
      )
    )
    and not exists (
      select 1
      from public.completions allocated
      where allocated.goal_id = completion.goal_id
        and allocated.user_id = completion.user_id
        and allocated.planner_unit_key = item.unit_key
    )
)
update public.completions completion
set planner_unit_key = exact_matches.unit_key
from exact_matches
where completion.id = exact_matches.completion_id;

with eligible_goals as (
  select
    goal.id,
    goal.owner_id,
    greatest(coalesce(goal.target_count, 1), 1) as target_count,
    case
      when goal.frequency_type = 'fixed_milestones' then 'milestone:'
      else 'total:'
    end as unit_prefix
  from public.goals goal
  where goal.frequency_type = 'fixed_milestones'
    or (
      goal.frequency_type = 'recurring'
      and goal.target_basis = 'lifetime'
    )
),
available_units as (
  select
    goal.id as goal_id,
    goal.owner_id,
    goal.unit_prefix || ordinal::text as unit_key,
    row_number() over (
      partition by goal.id, goal.owner_id
      order by ordinal
    ) as allocation_rank
  from eligible_goals goal
  cross join lateral pg_catalog.generate_series(1, goal.target_count) ordinal
  where not exists (
    select 1
    from public.completions allocated
    where allocated.goal_id = goal.id
      and allocated.user_id = goal.owner_id
      and allocated.planner_unit_key = goal.unit_prefix || ordinal::text
  )
),
unallocated_completions as (
  select
    completion.id,
    completion.goal_id,
    completion.user_id,
    row_number() over (
      partition by completion.goal_id, completion.user_id
      order by completion.completed_on, completion.created_at, completion.id
    ) as allocation_rank
  from public.completions completion
  join eligible_goals goal
    on goal.id = completion.goal_id
    and goal.owner_id = completion.user_id
  where completion.planner_unit_key is null
),
ordinal_matches as (
  select
    completion.id as completion_id,
    unit.unit_key
  from unallocated_completions completion
  join available_units unit
    on unit.goal_id = completion.goal_id
    and unit.owner_id = completion.user_id
    and unit.allocation_rank = completion.allocation_rank
)
update public.completions completion
set planner_unit_key = ordinal_matches.unit_key
from ordinal_matches
where completion.id = ordinal_matches.completion_id;

update public.planner_items item
set
  scheduled_date = completion.completed_on,
  original_scheduled_date = coalesce(
    item.original_scheduled_date,
    item.scheduled_date
  ),
  updated_at = pg_catalog.now()
from public.completions completion
where completion.goal_id = item.goal_id
  and completion.user_id = item.owner_id
  and completion.planner_unit_key = item.unit_key
  and item.scheduled_date is distinct from completion.completed_on
  and not item.locked
  and not exists (
    select 1
    from public.planner_items destination_item
    where destination_item.goal_id = item.goal_id
      and destination_item.scheduled_date = completion.completed_on
      and destination_item.id <> item.id
  );
