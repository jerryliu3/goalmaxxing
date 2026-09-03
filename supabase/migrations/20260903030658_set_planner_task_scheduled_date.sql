create or replace function public.set_planner_task_scheduled_date(
  p_task_id uuid,
  p_scheduled_date date
)
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
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;

  if p_scheduled_date is null then
    raise exception using errcode = '22023', message = 'invalid_scheduled_date';
  end if;

  return query
  with updated as (
    update public.planner_tasks t
    set
      scheduled_date = p_scheduled_date,
      updated_at = timezone('utc', now())
    where t.id = p_task_id
      and t.owner_id = v_uid
      and t.is_deleted = false
    returning
      t.id,
      t.title,
      t.scheduled_date,
      t.scheduled_time,
      t.completed_at,
      t.created_at,
      t.updated_at
  )
  select
    updated.id as task_id,
    updated.title,
    updated.scheduled_date,
    updated.scheduled_time,
    updated.completed_at,
    updated.created_at,
    updated.updated_at
  from updated;

  if not found then
    raise exception using errcode = 'P0001', message = 'planner_task_not_found';
  end if;
end;
$$;

revoke all on function public.set_planner_task_scheduled_date(uuid, date) from public, anon;
grant execute on function public.set_planner_task_scheduled_date(uuid, date)
  to authenticated, service_role;
