-- Task edits retain their separate storage and canonical version checks.
drop function public.set_planner_task_scheduled_date(uuid, date, timestamptz);
create function public.set_planner_task_scheduled_date(
  p_task_id uuid,
  p_scheduled_date date,
  p_expected_updated_at timestamptz,
  p_title text default null,
  p_scheduled_time text default null,
  p_update_time boolean default false
)
returns table (task_id uuid, title text, scheduled_date date, scheduled_time text,
  completed_at timestamptz, created_at timestamptz, updated_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_task public.planner_tasks%rowtype;
  v_today date;
begin
  if v_uid is null then
    raise exception using errcode='42501', message='authentication required';
  end if;
  select * into v_task from public.planner_tasks t
    where t.id=p_task_id and t.owner_id=v_uid and not t.is_deleted for update;
  if not found then
    raise exception using errcode='P0001', message='planner_task_not_found';
  end if;
  if p_expected_updated_at is null or v_task.updated_at <> p_expected_updated_at then
    raise exception using errcode='P0001', message='task_stale';
  end if;
  select private.local_today_for_timezone(coalesce(p.timezone, 'UTC'))
    into v_today from public.profiles p where p.id=v_uid;
  if p_scheduled_date is null then
    raise exception using errcode='22023', message='invalid_scheduled_date';
  end if;
  -- Editing the name/time of an overdue or completed task is still allowed.
  if p_scheduled_date <> v_task.scheduled_date then
    if v_task.completed_at is not null then
      raise exception using errcode='22023', message='task_completed';
    end if;
    if p_scheduled_date < v_today then
      raise exception using errcode='22023', message='task_date_in_past';
    end if;
  end if;
  if p_title is not null and char_length(btrim(p_title)) not between 1 and 200 then
    raise exception using errcode='22023', message='invalid_task_title';
  end if;
  if p_update_time and p_scheduled_time is not null
    and p_scheduled_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
    raise exception using errcode='22023', message='invalid_scheduled_time';
  end if;
  return query update public.planner_tasks t set
    title=coalesce(btrim(p_title),t.title),
    scheduled_date=p_scheduled_date,
    scheduled_time=case when p_update_time then p_scheduled_time else t.scheduled_time end,
    updated_at=clock_timestamp()
  where t.id=v_task.id
  returning t.id,t.title,t.scheduled_date,t.scheduled_time,t.completed_at,t.created_at,t.updated_at;
end;
$$;
revoke all on function public.set_planner_task_scheduled_date(uuid,date,timestamptz,text,text,boolean) from public,anon;
grant execute on function public.set_planner_task_scheduled_date(uuid,date,timestamptz,text,text,boolean) to authenticated,service_role;

-- Reuse the XP ledger and easy-goal points, without goal achievement or feed rows.
alter table public.xp_ledger drop constraint xp_ledger_event_type_valid;
alter table public.xp_ledger add constraint xp_ledger_event_type_valid check
  (event_type in ('completion_credit','goal_achievement','challenge_award','season_award','task_credit'));
alter table public.xp_ledger drop constraint xp_ledger_goal_scoped_events;
alter table public.xp_ledger add constraint xp_ledger_goal_scoped_events check
  (goal_id is not null or event_type in ('challenge_award','season_award','task_credit'));
-- Keep the social award uniqueness contract; each task transition has its own source key.
create index xp_ledger_task_balance_idx on public.xp_ledger(user_id,(metadata->>'task_id'))
  where event_type='task_credit';

create function private.guard_planner_task_capture() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_today date;
begin
  select private.local_today_for_timezone(coalesce(p.timezone,'UTC')) into v_today
    from public.profiles p where p.id=new.owner_id;
  if new.scheduled_date < v_today then
    raise exception using errcode='22023', message='task_date_in_past';
  end if;
  return new;
end;
$$;
revoke all on function private.guard_planner_task_capture() from public,anon,authenticated;
create trigger planner_task_capture_date before insert on public.planner_tasks
  for each row execute function private.guard_planner_task_capture();

create function private.sync_planner_task_xp() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_task public.planner_tasks%rowtype;
  v_balance integer;
  v_desired integer := 0;
  v_delta integer;
  v_today date;
begin
  if TG_OP='DELETE' then v_task:=old; else v_task:=new; end if;
  select private.local_today_for_timezone(coalesce(p.timezone,'UTC')) into v_today
    from public.profiles p where p.id=v_task.owner_id;
  if TG_OP <> 'DELETE' and v_task.completed_at is not null and not v_task.is_deleted then
    if v_task.scheduled_date > v_today then
      raise exception using errcode='22023', message='task_completion_in_future';
    end if;
    v_desired:=private.xp_points_for_completion_source('manual'::public.completion_source,'easy'::public.goal_difficulty);
  end if;
  select coalesce(sum(l.xp_delta),0)::integer into v_balance from public.xp_ledger l
    where l.user_id=v_task.owner_id and l.event_type='task_credit' and l.metadata->>'task_id'=v_task.id::text;
  v_delta:=v_desired-v_balance;
  if v_delta <> 0 then
    insert into public.xp_ledger(user_id,track_key,event_type,entry_kind,source_key,xp_delta,earned_on,metadata)
    values(v_task.owner_id,'general','task_credit',case when v_delta>0 then 'award' else 'reversal' end,
      'task:'||v_task.id::text||':'||gen_random_uuid()::text,v_delta,v_today,jsonb_build_object('task_id',v_task.id,'difficulty','easy'));
    perform private.refresh_xp_profile(v_task.owner_id,array['general']);
  end if;
  return null;
end;
$$;
revoke all on function private.sync_planner_task_xp() from public,anon,authenticated;
create trigger planner_task_xp after insert or update of completed_at,is_deleted or delete
  on public.planner_tasks for each row execute function private.sync_planner_task_xp();
-- Existing historical task completions are intentionally not retroactively awarded.
