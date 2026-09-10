-- Keep linked-goal BFS inside the completion write, but move XP ledger
-- recompute off that transaction. Completions enqueue (user, goal) rows;
-- HTTP handlers drain the outbox in after() so XP follows the fact write
-- immediately without sharing a transaction.
-- reconcile_goal_xp_service remains the eventual-consistency backstop.

create table if not exists private.xp_recompute_outbox (
  user_id uuid not null,
  goal_id uuid not null,
  queued_at timestamptz not null default now(),
  primary key (user_id, goal_id)
);

create index if not exists xp_recompute_outbox_queued_at_idx
  on private.xp_recompute_outbox (queued_at);

alter table private.xp_recompute_outbox enable row level security;

revoke all on table private.xp_recompute_outbox from public, anon, authenticated;

create or replace function private.enqueue_goal_xp_recompute(
  p_user_id uuid,
  p_goal_id uuid
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into private.xp_recompute_outbox (user_id, goal_id)
  values (p_user_id, p_goal_id)
  on conflict (user_id, goal_id) do update
    set queued_at = now();
$$;

revoke all on function private.enqueue_goal_xp_recompute(uuid, uuid)
  from public, anon, authenticated;
grant execute on function private.enqueue_goal_xp_recompute(uuid, uuid)
  to service_role;

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
    delete from private.xp_recompute_outbox q
    where q.user_id = r.user_id
      and q.goal_id = r.goal_id;
    perform public.recompute_goal_xp_service(r.user_id, r.goal_id);
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.drain_xp_recompute_outbox(integer)
  from public, anon;
grant execute on function public.drain_xp_recompute_outbox(integer)
  to authenticated, service_role;

-- Same desired-vs-ledger diff recompute_goal_xp_service writes, without the write.
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
  with desired as (
    select *
    from private.goal_xp_credited_units(p_user_id, p_goal_id)
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
  ),
  diff as (
    select coalesce(d.xp_amount, 0) - coalesce(c.balance, 0) as xp_delta
    from desired d
    full outer join current_balance c
      on c.source_key = d.source_key
     and c.track_key = d.track_key
  )
  select coalesce(sum(diff.xp_delta), 0)::integer
  from diff
  where diff.xp_delta <> 0;
$$;

revoke all on function private.goal_xp_pending_delta(uuid, uuid)
  from public, anon, authenticated;
grant execute on function private.goal_xp_pending_delta(uuid, uuid)
  to service_role;

create or replace function public.preview_queued_xp_delta()
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_total integer := 0;
begin
  if v_uid is null then
    raise exception 'authentication required';
  end if;

  select coalesce(sum(private.goal_xp_pending_delta(v_uid, q.goal_id)), 0)::integer
    into v_total
  from private.xp_recompute_outbox q
  where q.user_id = v_uid;

  return v_total;
end;
$$;

revoke all on function public.preview_queued_xp_delta()
  from public, anon;
grant execute on function public.preview_queued_xp_delta()
  to authenticated, service_role;

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

    perform private.enqueue_goal_xp_recompute(v_uid, v_current);

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
