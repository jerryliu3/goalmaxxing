-- Optional local wall-clock time for planner tasks (HH:mm), null = untimed.
-- List order: incomplete first, then date, then timed before untimed, then created_at.

alter table public.planner_tasks
add column if not exists scheduled_time text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'planner_tasks_scheduled_time_format'
      and conrelid = 'public.planner_tasks'::regclass
  ) then
    alter table public.planner_tasks
    add constraint planner_tasks_scheduled_time_format check (
      scheduled_time is null
      or scheduled_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    );
  end if;
end;
$$;

drop function if exists public.create_planner_task(text, date);
drop function if exists public.list_planner_tasks(date);
drop function if exists public.set_planner_task_completion(uuid, boolean);

create or replace function public.create_planner_task(
  p_title text,
  p_scheduled_date date default null,
  p_scheduled_time text default null
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
  v_timezone text := 'UTC';
  v_title text := btrim(coalesce(p_title, ''));
  v_scheduled_date date;
  v_scheduled_time text := nullif(btrim(coalesce(p_scheduled_time, '')), '');
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;

  if char_length(v_title) = 0 then
    raise exception using errcode = '22023', message = 'invalid_task_title';
  end if;

  if char_length(v_title) > 200 then
    raise exception using errcode = '22023', message = 'task_title_too_long';
  end if;

  if v_scheduled_time is not null
    and v_scheduled_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  then
    raise exception using errcode = '22023', message = 'invalid_scheduled_time';
  end if;

  select coalesce(p.timezone, 'UTC')
  into v_timezone
  from public.profiles p
  where p.id = v_uid;

  v_scheduled_date := coalesce(
    p_scheduled_date,
    private.local_today_for_timezone(coalesce(v_timezone, 'UTC'))
  );

  return query
  insert into public.planner_tasks (
    owner_id,
    title,
    scheduled_date,
    scheduled_time,
    completed_at,
    is_deleted,
    updated_at
  )
  values (
    v_uid,
    v_title,
    v_scheduled_date,
    v_scheduled_time,
    null,
    false,
    timezone('utc', now())
  )
  returning
    id as task_id,
    public.planner_tasks.title,
    public.planner_tasks.scheduled_date,
    public.planner_tasks.scheduled_time,
    public.planner_tasks.completed_at,
    public.planner_tasks.created_at,
    public.planner_tasks.updated_at;
end;
$$;

create or replace function public.set_planner_task_completion(
  p_task_id uuid,
  p_completed boolean default true
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

  return query
  with updated as (
    update public.planner_tasks t
    set
      completed_at = case
        when coalesce(p_completed, true) then coalesce(t.completed_at, timezone('utc', now()))
        else null
      end,
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

create or replace function public.list_planner_tasks(
  p_for_date date default null
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

  select coalesce(p.timezone, 'UTC')
  into v_timezone
  from public.profiles p
  where p.id = v_uid;

  v_today := private.local_today_for_timezone(coalesce(v_timezone, 'UTC'));

  return query
  select
    t.id as task_id,
    t.title,
    t.scheduled_date,
    t.scheduled_time,
    t.completed_at,
    t.created_at,
    t.updated_at
  from public.planner_tasks t
  where t.owner_id = v_uid
    and t.is_deleted = false
    and (
      p_for_date is null
      or t.scheduled_date <= p_for_date
    )
    and (
      t.completed_at is null
      or (t.completed_at at time zone coalesce(v_timezone, 'UTC'))::date >= coalesce(p_for_date, v_today)
    )
  order by
    case when t.completed_at is null then 0 else 1 end asc,
    t.scheduled_date asc,
    t.scheduled_time asc nulls last,
    t.created_at asc;
end;
$$;

revoke all on function public.create_planner_task(text, date, text) from public, anon;
grant execute on function public.create_planner_task(text, date, text)
  to authenticated, service_role;

revoke all on function public.set_planner_task_completion(uuid, boolean) from public, anon;
grant execute on function public.set_planner_task_completion(uuid, boolean)
  to authenticated, service_role;

revoke all on function public.list_planner_tasks(date) from public, anon;
grant execute on function public.list_planner_tasks(date)
  to authenticated, service_role;
