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
