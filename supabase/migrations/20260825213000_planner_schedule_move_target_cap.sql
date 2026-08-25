-- Lifetime target caps apply only to lifetime-basis goals. Per-period cadence goals
-- legitimately schedule more rows than target_count within a window. When checking
-- lifetime caps, count persisted rows whose unit_key is not superseded by the
-- incoming snapshot so moves do not double-count the row being relocated.

do $migration$
declare
  v_definition text;
begin
  select pg_catalog.pg_get_functiondef(
    'public.set_planner_schedule(date,date,jsonb,text)'::regprocedure
  )
  into v_definition;

  if v_definition is null then
    raise exception using
      errcode = '55000',
      message = 'set_planner_schedule_definition_missing';
  end if;

  v_definition := pg_catalog.replace(
    v_definition,
    '        existing_outside_window as (
          select item.goal_id, count(*)::int as existing_count
          from public.planner_items item
          where item.owner_id = v_owner
            and (item.scheduled_date < p_start or item.scheduled_date > p_end)
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
        left join existing_outside_window existing on existing.goal_id = goal.id
        where goal.owner_id = v_owner
          and goal.target_count is not null
          and goal.target_count > 0
          and incoming.incoming_count + coalesce(existing.existing_count, 0) > goal.target_count',
    '        existing_not_superseded as (
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
          and goal.target_basis = ''lifetime''::public.goal_target_basis
          and goal.target_count is not null
          and goal.target_count > 0
          and incoming.incoming_count + coalesce(existing.existing_count, 0) > goal.target_count'
  );

  if v_definition = pg_catalog.pg_get_functiondef(
    'public.set_planner_schedule(date,date,jsonb,text)'::regprocedure
  ) then
    raise exception using
      errcode = '55000',
      message = 'set_planner_schedule_target_cap_patch_failed';
  end if;

  execute v_definition;
end;
$migration$;
