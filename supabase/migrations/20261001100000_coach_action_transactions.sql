-- Canonical task edits now require the version the user reviewed.
drop function public.set_planner_task_completion(uuid, boolean);

create or replace function public.set_planner_task_completion(
  p_task_id uuid,
  p_completed boolean,
  p_expected_updated_at timestamptz
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

  perform 1 from public.planner_tasks where id=p_task_id and owner_id=v_uid and is_deleted=false for update;
  if not found then raise exception using errcode='P0001', message='planner_task_not_found'; end if;
  if p_expected_updated_at is null or not exists(select 1 from public.planner_tasks t where t.id=p_task_id and t.updated_at=p_expected_updated_at) then
    raise exception using errcode='P0001', message='task_stale';
  end if;

  return query
  with updated as (
    update public.planner_tasks t
    set
      completed_at = case
        when coalesce(p_completed, true) then coalesce(t.completed_at, timezone('utc', now()))
        else null
      end,
      updated_at = clock_timestamp()
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

revoke all on function public.set_planner_task_completion(uuid, boolean, timestamptz) from public, anon;

grant execute on function public.set_planner_task_completion(uuid, boolean, timestamptz) to authenticated, service_role;

drop function public.set_planner_task_scheduled_date(uuid, date);

create or replace function public.set_planner_task_scheduled_date(
  p_task_id uuid,
  p_scheduled_date date,
  p_expected_updated_at timestamptz
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

  perform 1 from public.planner_tasks where id=p_task_id and owner_id=v_uid and is_deleted=false for update;
  if not found then raise exception using errcode='P0001', message='planner_task_not_found'; end if;
  if p_expected_updated_at is null or not exists(select 1 from public.planner_tasks t where t.id=p_task_id and t.updated_at=p_expected_updated_at) then
    raise exception using errcode='P0001', message='task_stale';
  end if;

  return query
  with updated as (
    update public.planner_tasks t
    set
      scheduled_date = p_scheduled_date,
      updated_at = clock_timestamp()
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

revoke all on function public.set_planner_task_scheduled_date(uuid, date, timestamptz) from public, anon;

grant execute on function public.set_planner_task_scheduled_date(uuid, date, timestamptz) to authenticated, service_role;

-- Preferences have one atomic write surface for both the planner and coach.
create function public.set_planner_preferences(p_timezone text, p_confirmed_at timestamptz, p_week_start integer, p_rest_days integer[], p_blackouts jsonb, p_expected_digest text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); result jsonb; blackout jsonb;
begin
  if u is null then raise exception using errcode='42501',message='authentication_required'; end if;
  perform pg_catalog.pg_advisory_xact_lock(private.planner_owner_lock_key(u));
  if p_expected_digest is not null and p_expected_digest<>public.get_planner_schedule_digest(u) then raise exception 'action_stale'; end if;
  if not exists(select 1 from pg_catalog.pg_timezone_names where name=p_timezone) or p_confirmed_at is null or p_week_start is null or p_week_start not between 0 and 6 or p_rest_days is null or exists(select 1 from unnest(p_rest_days) d where d is null or d not between 0 and 6) or p_blackouts is null or jsonb_typeof(p_blackouts)<>'array' then raise exception using errcode='22023',message='invalid_preferences'; end if;
  if cardinality(p_rest_days)>7 or jsonb_array_length(p_blackouts)>100 then raise exception using errcode='22023',message='invalid_preferences'; end if;
  for blackout in select value from jsonb_array_elements(p_blackouts) loop
    if jsonb_typeof(blackout)<>'object'
      or coalesce(blackout->>'start','') !~ '^\d{4}-\d{2}-\d{2}$'
      or coalesce(blackout->>'end','') !~ '^\d{4}-\d{2}-\d{2}$'
      or (blackout->>'start')>(blackout->>'end')
      or blackout - 'start' - 'end'<>'{}'::jsonb then
      raise exception using errcode='22023',message='invalid_preferences';
    end if;
    -- Casting rejects impossible dates as well as malformed windows.
    begin
      perform (blackout->>'start')::date, (blackout->>'end')::date;
    exception when invalid_datetime_format or datetime_field_overflow then
      raise exception using errcode='22023',message='invalid_preferences';
    end;
  end loop;
  update public.profiles set timezone=p_timezone,timezone_confirmed_at=p_confirmed_at,week_starts_on=p_week_start,rest_weekdays=p_rest_days,blackout_ranges=p_blackouts where id=u returning jsonb_build_object('timezone',timezone,'timezone_confirmed_at',timezone_confirmed_at,'week_starts_on',week_starts_on,'rest_weekdays',rest_weekdays,'blackout_ranges',blackout_ranges) into result;
  return result;
end $$;
revoke all on function public.set_planner_preferences(text,timestamptz,integer,integer[],jsonb,text) from public,anon;
grant execute on function public.set_planner_preferences(text,timestamptz,integer,integer[],jsonb,text) to authenticated;

create table public.coach_action_requests (
  owner_id uuid not null references public.profiles(id) on delete cascade,
  request_id uuid not null, action_id uuid not null references public.coach_actions(id) on delete cascade,
  receipt jsonb not null, primary key(owner_id,request_id)
);
alter table public.coach_action_requests enable row level security;
revoke all on public.coach_action_requests from public,anon,authenticated;
grant select on public.coach_action_requests to authenticated;
grant all on public.coach_action_requests to service_role;
create policy owner_read on public.coach_action_requests for select to authenticated using(owner_id=(select auth.uid()));

-- A client supplies only identity. Commands are exclusively authored by the server.
-- Domain mutation, action status, and replay receipt commit together.
create function public.apply_coach_action(p_action uuid,p_request uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); a public.coach_actions; c jsonb; receipt jsonb; replay public.coach_action_requests; profile public.profiles; task public.planner_tasks; domain_result jsonb; ids uuid[];
begin
  if u is null then raise exception using errcode='42501',message='authentication_required'; end if;
  perform pg_catalog.pg_advisory_xact_lock(private.planner_owner_lock_key(u));
  select * into replay from public.coach_action_requests where owner_id=u and request_id=p_request;
  if found then
    if replay.action_id<>p_action then raise exception 'idempotency_conflict'; end if;
    return replay.receipt;
  end if;
  select * into a from public.coach_actions where id=p_action and owner_id=u for update;
  if not found then raise exception 'action_not_found'; end if;
  if a.status in ('applied','undone') then
    insert into public.coach_action_requests values(u,p_request,p_action,a.result);
    return a.result;
  end if;
  if a.status<>'proposed' or exists(select 1 from public.coach_threads t join public.coach_topics p on p.id=t.topic_id where t.id=a.thread_id and (t.archived_at is not null or p.archived_at is not null)) then raise exception 'action_not_ready'; end if;
  c:=a.command;
  select * into profile from public.profiles where id=u;
  if profile.timezone_confirmed_at is null then raise exception 'timezone_confirmation_required'; end if;
  if profile.timezone is distinct from c->>'timezone' or (now() at time zone profile.timezone)::date<>(c->>'asOfDate')::date then raise exception 'action_stale'; end if;
  if c ? 'expectedDigest' and c->>'expectedDigest'<>public.get_planner_schedule_digest(u) then raise exception 'action_stale'; end if;
  if a.kind='move_sessions' then
    select to_jsonb(r) into domain_result from public.set_planner_schedule((c->>'startDate')::date,(c->>'endDate')::date,c->'items',c->>'expectedDigest') r;
  elsif a.kind='completion' then
    if not exists(select 1 from public.goals where id=(c->>'goalId')::uuid and owner_id=u and is_deleted=false) then raise exception 'action_stale'; end if;
    if (c->>'completed')::boolean then
      if c->>'unitKey' is not null then
        select to_jsonb(r) into domain_result from public.complete_planner_item_on_date_service((c->>'goalId')::uuid,c->>'unitKey',(c->>'date')::date,c->>'expectedDigest') r;
      else
        perform public.mark_goal_complete((c->>'goalId')::uuid,(c->>'date')::date);
      end if;
    else
      select to_jsonb(r) into domain_result from public.uncomplete_planner_item_on_date_service((c->>'goalId')::uuid,(c->>'date')::date,c->>'expectedDigest') r;
    end if;
  elsif a.kind in ('task_move','task_completion') then
    select * into task from public.planner_tasks where id=(c->>'taskId')::uuid and owner_id=u and is_deleted=false for update;
    if not found or task.updated_at is distinct from (c->>'expectedUpdatedAt')::timestamptz then raise exception 'action_stale'; end if;
    if a.kind='task_move' then
      select to_jsonb(r) into domain_result from public.set_planner_task_scheduled_date(task.id,(c->>'date')::date,task.updated_at) r;
    else
      select to_jsonb(r) into domain_result from public.set_planner_task_completion(task.id,(c->>'completed')::boolean,task.updated_at) r;
    end if;
  elsif a.kind='create_goal' then
    ids:=public.create_goals(c->'goals');
    if jsonb_array_length(c->'links')>0 then perform public.create_goal_links(c->'links'); end if;
    domain_result:=jsonb_build_object('goalIds',to_jsonb(ids));
  elsif a.kind='preference' then
    domain_result:=public.set_planner_preferences(profile.timezone,profile.timezone_confirmed_at,coalesce(profile.week_starts_on,1),array(select jsonb_array_elements_text(c->'restWeekdays')::integer),coalesce(profile.blackout_ranges,'[]'::jsonb),c->>'expectedDigest');
  else raise exception 'capability_unavailable'; end if;
  receipt:=jsonb_build_object('actionId',a.id,'kind',a.kind,'appliedAt',clock_timestamp(),'domain',domain_result,'scheduleDigest',public.get_planner_schedule_digest(u));
  update public.coach_actions set status='applied',applied_at=clock_timestamp(),result=receipt where id=a.id;
  if a.inverse_of is not null then update public.coach_actions set status='undone' where id=a.inverse_of and owner_id=u and status='applied'; end if;
  insert into public.coach_action_requests values(u,p_request,p_action,receipt);
  return receipt;
end $$;
revoke all on function public.apply_coach_action(uuid,uuid) from public,anon;
grant execute on function public.apply_coach_action(uuid,uuid) to authenticated;

create function public.replace_coach_action(p_owner uuid,p_original uuid,p_new jsonb,p_undo boolean default false)
returns uuid language plpgsql security definer set search_path='' as $$
declare a public.coach_actions; id uuid;
begin
  perform pg_catalog.pg_advisory_xact_lock(private.planner_owner_lock_key(p_owner));
  select x.* into a from public.coach_actions x where x.owner_id=p_owner and x.id=p_original for update;
  if not found then raise exception 'action_not_found'; end if;
  if (p_undo and (a.status<>'applied' or a.inverse is null)) or (not p_undo and a.status<>'proposed') then raise exception 'action_not_ready'; end if;
  if p_undo then
    select x.id into id from public.coach_actions x where x.owner_id=p_owner and x.inverse_of=a.id and x.status='proposed' limit 1;
    if id is not null then return id; end if;
  end if;
  insert into public.coach_actions(owner_id,thread_id,run_id,kind,title,command,preview,inverse,inverse_of)
  values(p_owner,a.thread_id,a.run_id,p_new->>'kind',p_new->>'title',p_new->'command',p_new->'preview',nullif(p_new->'inverse','null'::jsonb),case when p_undo then a.id else null end) returning coach_actions.id into id;
  if not p_undo then update public.coach_actions set status='superseded' where coach_actions.id=a.id; end if;
  return id;
end $$;
revoke all on function public.replace_coach_action(uuid,uuid,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.replace_coach_action(uuid,uuid,jsonb,boolean) to service_role;
