-- Linked-target suppression remains a planning/visibility rule, not a
-- completion-write rule. The original 20260904140448 revision installed
-- private.raise_if_linked_target_completion_disallowed into mark_goal_complete;
-- editing that file in place does not replay on databases that already applied
-- it. Replace the write RPCs, then drop the helper.

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
  exception
    when check_violation then
      if SQLERRM = 'completion_outside_goal_lifetime' then
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

drop function if exists private.raise_if_linked_target_completion_disallowed(uuid, date);
