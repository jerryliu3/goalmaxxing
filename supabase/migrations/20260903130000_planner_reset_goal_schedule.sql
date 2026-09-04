-- Per-goal planner schedule reset: delete scheduled items for one owned goal
-- across one or more month windows, with the same digest/replay guards as
-- clear_planner_schedule_windows.

create or replace function public.clear_planner_schedule_for_goal(
  p_goal_id uuid,
  p_windows jsonb,
  p_expected_digest text
)
returns table (
  schedule_digest text,
  deleted_count integer,
  window_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
  v_window_count integer := 0;
  v_total_deleted integer := 0;
  v_deleted integer := 0;
  v_current_digest text;
  v_window_replay boolean := false;
  v_all_replay boolean := true;
  v_start date;
  v_end date;
begin
  if v_owner is null then
    raise exception using errcode = '28000', message = 'authentication_required';
  end if;

  perform private.assert_goal_owner(p_goal_id, v_owner);

  if p_windows is null
    or jsonb_typeof(p_windows) <> 'array'
    or jsonb_array_length(p_windows) = 0 then
    raise exception using errcode = '22023', message = 'invalid_schedule_windows_payload';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_windows) as window_payload(payload)
    where jsonb_typeof(window_payload.payload) <> 'object'
  ) then
    raise exception using errcode = '22023', message = 'invalid_schedule_windows_payload';
  end if;
  if exists (
    select 1
    from jsonb_to_recordset(p_windows) as item(
      start_date date,
      end_date date
    )
    where start_date is null
      or end_date is null
  ) then
    raise exception using errcode = '22023', message = 'invalid_schedule_windows_payload';
  end if;
  if exists (
    select 1
    from jsonb_to_recordset(p_windows) as item(
      start_date date,
      end_date date
    )
    group by item.start_date, item.end_date
    having count(*) > 1
  ) then
    raise exception using errcode = '22023', message = 'duplicate_schedule_window';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_windows) with ordinality as left_window(payload, ordinality)
    join jsonb_array_elements(p_windows) with ordinality as right_window(payload, ordinality)
      on left_window.ordinality < right_window.ordinality
    where (left_window.payload ->> 'start_date')::date
        <= (right_window.payload ->> 'end_date')::date
      and (right_window.payload ->> 'start_date')::date
        <= (left_window.payload ->> 'end_date')::date
  ) then
    raise exception using errcode = '22023', message = 'overlapping_schedule_windows';
  end if;

  for v_start, v_end in
    select
      (item.payload ->> 'start_date')::date,
      (item.payload ->> 'end_date')::date
    from jsonb_array_elements(p_windows) with ordinality as item(payload, ordinality)
    order by item.ordinality
  loop
    perform private.assert_planner_schedule_window(v_start, v_end);
    v_window_count := v_window_count + 1;
  end loop;

  perform pg_catalog.pg_advisory_xact_lock(
    private.planner_owner_lock_key(v_owner)
  );
  select public.get_planner_schedule_digest(v_owner)
  into v_current_digest;

  for v_start, v_end in
    select
      (item.payload ->> 'start_date')::date,
      (item.payload ->> 'end_date')::date
    from jsonb_array_elements(p_windows) with ordinality as item(payload, ordinality)
    order by item.ordinality
  loop
    select not exists (
      select 1
      from public.planner_items item
      where item.owner_id = v_owner
        and item.goal_id = p_goal_id
        and item.scheduled_date >= v_start
        and item.scheduled_date <= v_end
    )
    into v_window_replay;
    if not v_window_replay then
      v_all_replay := false;
    end if;
  end loop;

  if not v_all_replay
    and coalesce(p_expected_digest, '') <> coalesce(v_current_digest, '') then
    raise exception using errcode = 'P0001', message = 'stale_schedule';
  end if;

  if v_all_replay then
    return query
    select
      v_current_digest,
      0,
      v_window_count;
    return;
  end if;

  for v_start, v_end in
    select
      (item.payload ->> 'start_date')::date,
      (item.payload ->> 'end_date')::date
    from jsonb_array_elements(p_windows) with ordinality as item(payload, ordinality)
    order by item.ordinality
  loop
    delete from public.planner_items item
    where item.owner_id = v_owner
      and item.goal_id = p_goal_id
      and item.scheduled_date >= v_start
      and item.scheduled_date <= v_end;
    get diagnostics v_deleted = row_count;
    v_total_deleted := v_total_deleted + coalesce(v_deleted, 0);
  end loop;

  delete from public.planner_goal_unplaceable unplaceable
  where unplaceable.owner_id = v_owner
    and unplaceable.goal_id = p_goal_id;

  return query
  select
    public.get_planner_schedule_digest(v_owner),
    v_total_deleted,
    v_window_count;
end;
$$;

revoke all on function public.clear_planner_schedule_for_goal(uuid, jsonb, text) from public;
grant execute on function public.clear_planner_schedule_for_goal(uuid, jsonb, text) to authenticated;
