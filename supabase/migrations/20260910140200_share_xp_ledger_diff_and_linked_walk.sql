-- Share one desired-vs-ledger diff between preview and recompute, and one
-- owned-link walk for completion cascade. Drain applies XP before dropping
-- the outbox row.

create or replace function private.goal_xp_ledger_diffs(
  p_user_id uuid,
  p_goal_id uuid,
  p_force_zero boolean default false
)
returns table (
  source_key text,
  track_key text,
  event_type text,
  earned_on date,
  completion_id uuid,
  completion_source public.completion_source,
  xp_delta integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with desired as (
    select *
    from private.goal_xp_credited_units(p_user_id, p_goal_id)
    where not p_force_zero
  ),
  current_balance as (
    select
      l.source_key,
      l.track_key,
      pg_catalog.min(l.event_type) as event_type,
      pg_catalog.max(l.earned_on) as earned_on,
      pg_catalog.sum(l.xp_delta)::integer as balance
    from public.xp_ledger l
    where l.user_id = p_user_id
      and l.goal_id = p_goal_id
    group by l.source_key, l.track_key
    having pg_catalog.sum(l.xp_delta) <> 0
  )
  select
    coalesce(d.source_key, c.source_key) as source_key,
    coalesce(d.track_key, c.track_key) as track_key,
    coalesce(d.event_type, c.event_type) as event_type,
    coalesce(d.earned_on, c.earned_on) as earned_on,
    d.completion_id,
    d.completion_source,
    coalesce(d.xp_amount, 0) - coalesce(c.balance, 0) as xp_delta
  from desired d
  full outer join current_balance c
    on c.source_key = d.source_key
   and c.track_key = d.track_key
  where coalesce(d.xp_amount, 0) - coalesce(c.balance, 0) <> 0;
$$;

revoke all on function private.goal_xp_ledger_diffs(uuid, uuid, boolean)
  from public, anon, authenticated;
grant execute on function private.goal_xp_ledger_diffs(uuid, uuid, boolean)
  to service_role;

create or replace function private.goal_xp_pending_delta(
  p_user_id uuid,
  p_goal_id uuid
)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(d.xp_delta), 0)::integer
  from private.goal_xp_ledger_diffs(p_user_id, p_goal_id) d;
$$;

create or replace function public.recompute_goal_xp_service(
  p_user_id uuid,
  p_goal_id uuid,
  p_force_zero boolean default false
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows_written integer := 0;
  v_track_keys text[] := '{}'::text[];
  r record;
begin
  if p_user_id is null or p_goal_id is null then
    raise exception
      using errcode = '22023',
            message = 'xp_recompute_goal_args_required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    private.xp_lock_key('resolution.xp:' || p_user_id::text || ':' || p_goal_id::text)
  );

  for r in
    select *
    from private.goal_xp_ledger_diffs(p_user_id, p_goal_id, p_force_zero)
  loop
    insert into public.xp_ledger (
      user_id,
      goal_id,
      completion_id,
      track_key,
      event_type,
      entry_kind,
      source_key,
      xp_delta,
      earned_on,
      completion_source,
      metadata
    )
    values (
      p_user_id,
      p_goal_id,
      r.completion_id,
      r.track_key,
      r.event_type,
      case when r.xp_delta > 0 then 'award' else 'reversal' end,
      r.source_key,
      r.xp_delta,
      r.earned_on,
      r.completion_source,
      jsonb_build_object(
        'source', 'recompute_goal_xp_service',
        'force_zero', p_force_zero
      )
    );

    perform private.emit_feed_for_xp_ledger_row(
      p_user_id,
      r.event_type,
      r.track_key,
      p_goal_id,
      r.xp_delta,
      r.earned_on,
      r.source_key
    );

    v_rows_written := v_rows_written + 1;
    v_track_keys := pg_catalog.array_append(v_track_keys, r.track_key);
  end loop;

  if v_rows_written > 20 then
    raise warning 'xp_anomaly kind=large_delta user=% detail=%',
      p_user_id,
      jsonb_build_object(
        'goal_id', p_goal_id,
        'rows_written', v_rows_written
      );
  end if;

  if v_rows_written > 0 then
    perform private.refresh_xp_profile(p_user_id, v_track_keys);
  end if;

  return v_rows_written;
end;
$$;

create or replace function public.drain_xp_recompute_outbox(
  p_limit integer default 50
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_limit integer := greatest(1, least(coalesce(p_limit, 50), 200));
  r record;
  v_count integer := 0;
begin
  for r in
    select q.user_id, q.goal_id
    from private.xp_recompute_outbox q
    where v_uid is null or q.user_id = v_uid
    order by q.queued_at
    limit v_limit
    for update skip locked
  loop
    perform public.recompute_goal_xp_service(r.user_id, r.goal_id);
    delete from private.xp_recompute_outbox q
    where q.user_id = r.user_id
      and q.goal_id = r.goal_id;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

create or replace function private.owned_linked_target_ids(
  p_user_id uuid,
  p_source_goal_id uuid
)
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select array_agg(gl.target_goal_id)
      from public.goal_links gl
      join public.goals source_goal on source_goal.id = gl.source_goal_id
      join public.goals target_goal on target_goal.id = gl.target_goal_id
      where gl.source_goal_id = p_source_goal_id
        and gl.owner_id = p_user_id
        and source_goal.owner_id = p_user_id
        and target_goal.owner_id = p_user_id
    ),
    '{}'::uuid[]
  );
$$;

revoke all on function private.owned_linked_target_ids(uuid, uuid)
  from public, anon, authenticated;
grant execute on function private.owned_linked_target_ids(uuid, uuid)
  to service_role;

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

    perform private.enqueue_goal_xp_recompute(v_uid, v_current);

    v_queue := v_queue || private.owned_linked_target_ids(v_uid, v_current);
  end loop;
end;
$$;

create or replace function public.unmark_goal_complete(
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

    delete from public.completions
    where goal_id = v_current
      and user_id = v_uid
      and completed_on = p_date;

    perform private.enqueue_goal_xp_recompute(v_uid, v_current);

    v_queue := v_queue || private.owned_linked_target_ids(v_uid, v_current);
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

    perform private.enqueue_goal_xp_recompute(v_uid, v_current);

    v_queue := v_queue || private.owned_linked_target_ids(v_uid, v_current);
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
