-- Archiving a goal should remove incomplete planner sessions so calendar/checklist
-- UX cannot interact with stale open items. Completed sessions (matching completion
-- on scheduled_date) are preserved for history.

create or replace function private.delete_incomplete_planner_items_for_goal(
  p_goal_id uuid
)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.planner_items item
  where item.goal_id = p_goal_id
    and not exists (
      select 1
      from public.completions completion
      where completion.goal_id = item.goal_id
        and completion.completed_on = item.scheduled_date
    );
$$;

revoke all on function private.delete_incomplete_planner_items_for_goal(uuid)
from public, anon;

create or replace function public.set_goal_archived(
  p_goal_id uuid,
  p_archived boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_old_archived timestamptz;
  v_new_archived timestamptz;
begin
  perform private.assert_goal_owner(p_goal_id, v_uid);

  select archived_at
  into v_old_archived
  from public.goals
  where id = p_goal_id
  for update;

  v_new_archived := case
    when coalesce(p_archived, false) then coalesce(v_old_archived, pg_catalog.now())
    else null
  end;

  update public.goals
  set archived_at = v_new_archived
  where id = p_goal_id
    and owner_id = v_uid;

  if v_new_archived is not null and v_old_archived is distinct from v_new_archived then
    perform private.delete_incomplete_planner_items_for_goal(p_goal_id);

    delete from public.planner_goal_unplaceable unplaceable
    where unplaceable.goal_id = p_goal_id
      and unplaceable.owner_id = v_uid;
  end if;

  if v_old_archived is distinct from v_new_archived then
    perform private.recompute_xp_for_goal_users(p_goal_id);
  end if;
end;
$$;

revoke all on function public.set_goal_archived(uuid, boolean) from public, anon;
grant execute on function public.set_goal_archived(uuid, boolean) to authenticated;

-- Defense in depth: planner saves should also drop schedule rows for archived goals.
do $migration$
declare
  v_definition text;
  v_not_deleted_count integer;
  v_deleted_count integer;
begin
  select pg_catalog.pg_get_functiondef(
    'public.prepare_planner_schedule_core(jsonb,jsonb,text)'::regprocedure
  )
  into v_definition;

  v_not_deleted_count := (
    pg_catalog.length(v_definition)
    - pg_catalog.length(
      pg_catalog.replace(v_definition, 'and not goal.is_deleted', '')
    )
  ) / pg_catalog.length('and not goal.is_deleted');

  if v_not_deleted_count < 1 then
    raise exception using
      errcode = '55000',
      message = 'unexpected_prepare_not_deleted_guard_count: ' || v_not_deleted_count;
  end if;

  v_definition := pg_catalog.replace(
    v_definition,
    'and not goal.is_deleted',
    'and not goal.is_deleted and goal.archived_at is null'
  );

  v_deleted_count := (
    pg_catalog.length(v_definition)
    - pg_catalog.length(
      pg_catalog.replace(v_definition, 'goal.is_deleted', '')
    )
  ) / pg_catalog.length('goal.is_deleted');

  if v_deleted_count < 1 then
    raise exception using
      errcode = '55000',
      message = 'unexpected_prepare_deleted_guard_count: ' || v_deleted_count;
  end if;

  v_definition := pg_catalog.replace(
    v_definition,
    'goal.is_deleted',
    '(goal.is_deleted or goal.archived_at is not null)'
  );

  execute v_definition;
end;
$migration$;
