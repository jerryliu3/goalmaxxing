-- Enforce completion lifetime and linked-target suppression in write RPCs.
-- Authenticated clients cannot insert completions directly; these guards close
-- the remaining RPC bypasses that TypeScript currently checks only on some
-- surfaces. Cascade onto targets from a completed source remains allowed.

create or replace function private.raise_if_completion_outside_goal_lifetime(
  p_goal_id uuid,
  p_date date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_start date;
  v_end date;
begin
  select goal.start_date, goal.end_date
    into v_start, v_end
  from public.goals as goal
  where goal.id = p_goal_id;

  if not found then
    return;
  end if;

  if p_date < v_start
    or (v_end is not null and p_date > v_end)
  then
    raise exception
      using errcode = '23514',
            message = 'completion_outside_goal_lifetime';
  end if;
end;
$$;

create or replace function private.raise_if_linked_target_completion_disallowed(
  p_goal_id uuid,
  p_date date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
  v_suppressed boolean := false;
begin
  select goal.owner_id
    into v_owner_id
  from public.goals as goal
  where goal.id = p_goal_id;

  if not found then
    return;
  end if;

  with recursive ancestors as (
    select p_goal_id as goal_id
    union
    select gl.source_goal_id
    from public.goal_links as gl
    inner join ancestors as ancestor on ancestor.goal_id = gl.target_goal_id
    where gl.owner_id = v_owner_id
  )
  select exists (
    select 1
    from ancestors as ancestor
    inner join public.goals as source_goal
      on source_goal.id = ancestor.goal_id
    where ancestor.goal_id is distinct from p_goal_id
      and source_goal.owner_id = v_owner_id
      and source_goal.is_deleted = false
      and source_goal.archived_at is null
      and (
        source_goal.end_date is null
        or (
          source_goal.end_date >= source_goal.start_date
          and source_goal.end_date >= p_date
        )
      )
  )
  into v_suppressed;

  if v_suppressed then
    raise exception
      using errcode = '23514',
            message = 'linked_goal_disallowed';
  end if;
end;
$$;

revoke all on function private.raise_if_completion_outside_goal_lifetime(uuid, date)
  from public, anon, authenticated;
revoke all on function private.raise_if_linked_target_completion_disallowed(uuid, date)
  from public, anon, authenticated;

create or replace function public.mark_goal_complete(
  p_goal_id uuid,
  p_date date default current_date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_visited uuid[] := '{}'::uuid[];
  v_queue uuid[] := array[p_goal_id]::uuid[];
  v_current uuid;
begin
  if v_uid is null then
    raise exception 'authentication required';
  end if;

  if not public.can_complete_goal(p_goal_id, v_uid) then
    raise exception 'not authorized for goal %', p_goal_id;
  end if;

  perform private.raise_if_future_completion_date(v_uid, p_date);
  perform private.raise_if_completion_outside_goal_lifetime(p_goal_id, p_date);
  perform private.raise_if_linked_target_completion_disallowed(p_goal_id, p_date);

  while coalesce(array_length(v_queue, 1), 0) > 0 loop
    v_current := v_queue[1];
    v_queue := case
      when array_length(v_queue, 1) > 1 then v_queue[2:array_length(v_queue, 1)]
      else '{}'::uuid[]
    end;

    if v_current = any(v_visited) then
      continue;
    end if;

    v_visited := array_append(v_visited, v_current);

    insert into public.completions (goal_id, user_id, completed_on, source)
    values (
      v_current,
      v_uid,
      p_date,
      case
        when v_current = p_goal_id then 'manual'::public.completion_source
        else 'linked_cascade'::public.completion_source
      end
    )
    on conflict (goal_id, user_id, completed_on) do nothing;

    perform public.recompute_goal_xp_service(v_uid, v_current);

    v_queue := v_queue || coalesce(
      (
        select array_agg(gl.target_goal_id)
        from public.goal_links gl
        join public.goals source_goal on source_goal.id = gl.source_goal_id
        join public.goals target_goal on target_goal.id = gl.target_goal_id
        where gl.source_goal_id = v_current
          and gl.owner_id = v_uid
          and source_goal.owner_id = v_uid
          and target_goal.owner_id = v_uid
      ),
      '{}'::uuid[]
    );
  end loop;
end;
$$;

create or replace function public.apply_external_completion_service(
  p_goal_id uuid,
  p_completed_on date,
  p_local_today date,
  p_external_key text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_visited uuid[] := '{}'::uuid[];
  v_queue uuid[] := array[p_goal_id]::uuid[];
  v_current uuid;
  v_root_inserted boolean := false;
  v_rows_inserted integer := 0;
begin
  if v_uid is null then
    raise exception using errcode = '28000', message = 'authentication_required';
  end if;

  if p_goal_id is null or p_completed_on is null or p_local_today is null then
    raise exception using errcode = '22023', message = 'invalid_external_completion';
  end if;

  if p_external_key is null or pg_catalog.length(pg_catalog.btrim(p_external_key)) = 0 then
    raise exception using errcode = '22023', message = 'invalid_external_key';
  end if;

  if not public.can_complete_goal(p_goal_id, v_uid) then
    raise exception using errcode = '42501', message = 'not_authorized_for_goal';
  end if;

  perform private.assert_health_local_today(p_local_today);

  if p_completed_on <> p_local_today
    and p_completed_on <> (p_local_today - 1)
  then
    return false;
  end if;
  -- Product policy: unmarking does not permanently opt a date out of future
  -- external_sync completion writes. If users do not want a synced completion
  -- retained, they should unmark after the sync has applied for that day.

  if exists (
    select 1
    from public.health_completion_links as link
    where link.user_id = v_uid
      and link.external_key = pg_catalog.btrim(p_external_key)
  ) then
    return false;
  end if;

  begin
    perform private.raise_if_completion_outside_goal_lifetime(p_goal_id, p_completed_on);
    perform private.raise_if_linked_target_completion_disallowed(p_goal_id, p_completed_on);
  exception
    when check_violation then
      if SQLERRM in ('completion_outside_goal_lifetime', 'linked_goal_disallowed') then
        return false;
      end if;
      raise;
  end;

  while coalesce(array_length(v_queue, 1), 0) > 0 loop
    v_current := v_queue[1];
    v_queue := case
      when array_length(v_queue, 1) > 1 then v_queue[2:array_length(v_queue, 1)]
      else '{}'::uuid[]
    end;

    if v_current = any(v_visited) then
      continue;
    end if;

    v_visited := array_append(v_visited, v_current);

    insert into public.completions (goal_id, user_id, completed_on, source)
    values (
      v_current,
      v_uid,
      p_completed_on,
      case
        when v_current = p_goal_id then 'external_sync'::public.completion_source
        else 'linked_cascade'::public.completion_source
      end
    )
    on conflict (goal_id, user_id, completed_on) do nothing;

    get diagnostics v_rows_inserted = row_count;
    if v_current = p_goal_id then
      v_root_inserted := v_rows_inserted > 0;
    end if;

    perform public.recompute_goal_xp_service(v_uid, v_current);

    v_queue := v_queue || coalesce(
      (
        select array_agg(gl.target_goal_id)
        from public.goal_links gl
        join public.goals source_goal on source_goal.id = gl.source_goal_id
        join public.goals target_goal on target_goal.id = gl.target_goal_id
        where gl.source_goal_id = v_current
          and gl.owner_id = v_uid
          and source_goal.owner_id = v_uid
          and target_goal.owner_id = v_uid
      ),
      '{}'::uuid[]
    );
  end loop;

  if v_root_inserted then
    insert into public.health_completion_links (
      user_id,
      goal_id,
      completed_on,
      external_key
    )
    values (
      v_uid,
      p_goal_id,
      p_completed_on,
      pg_catalog.btrim(p_external_key)
    )
    on conflict (user_id, external_key) do nothing;
  end if;

  return v_root_inserted;
end;
$$;
