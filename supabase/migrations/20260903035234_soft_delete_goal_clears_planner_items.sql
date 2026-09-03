-- Soft-deleted goals are excluded from planner context loads, so leftover
-- planner_items and unplaceable rows become unreachable orphans. Drop them
-- at delete time (unlike archive, which keeps completed sessions for history).

create or replace function public.soft_delete_goal(
  p_goal_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_was_deleted boolean;
begin
  perform private.assert_goal_owner(p_goal_id, v_uid);

  select is_deleted
  into v_was_deleted
  from public.goals
  where id = p_goal_id
  for update;

  update public.goals
  set is_deleted = true
  where id = p_goal_id
    and owner_id = v_uid;

  if not coalesce(v_was_deleted, false) then
    delete from public.planner_items
    where goal_id = p_goal_id;

    delete from public.planner_goal_unplaceable
    where goal_id = p_goal_id
      and owner_id = v_uid;

    perform private.recompute_xp_for_goal_users(p_goal_id);
  end if;
end;
$$;

revoke all on function public.soft_delete_goal(uuid) from public, anon;
grant execute on function public.soft_delete_goal(uuid) to authenticated;

delete from public.planner_items item
using public.goals goal
where item.goal_id = goal.id
  and goal.is_deleted;

delete from public.planner_goal_unplaceable unplaceable
using public.goals goal
where unplaceable.goal_id = goal.id
  and goal.is_deleted;
