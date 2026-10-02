-- Completion and scheduling edits never change a task's list position.
-- New captures appear beside the composer; existing captures retain their order.
create or replace function public.list_planner_tasks(p_for_date date default null)
returns table (
  task_id uuid,
  title text,
  scheduled_date date,
  scheduled_time text,
  completed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_timezone text := 'UTC';
  v_today date;
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;

  select coalesce(p.timezone, 'UTC') into v_timezone
  from public.profiles p where p.id = v_uid;
  v_today := private.local_today_for_timezone(coalesce(v_timezone, 'UTC'));

  return query
  select t.id, t.title, t.scheduled_date, t.scheduled_time,
    t.completed_at, t.created_at, t.updated_at
  from public.planner_tasks t
  where t.owner_id = v_uid
    and t.is_deleted = false
    and (p_for_date is null or t.scheduled_date <= p_for_date)
    and (
      t.completed_at is null
      or (t.completed_at at time zone coalesce(v_timezone, 'UTC'))::date >= coalesce(p_for_date, v_today)
    )
  order by t.created_at desc, t.id asc;
end;
$$;

revoke all on function public.list_planner_tasks(date) from public, anon;
grant execute on function public.list_planner_tasks(date) to authenticated, service_role;
