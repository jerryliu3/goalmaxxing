-- A linked-cascade completion on a fixed-milestones target must behave like a
-- direct completion of that target: it claims one session, the session sits on
-- the completion date, and undo puts it back. Unbound cascade credits floated
-- to the earliest uncredited ordinal at read time while the credited row kept
-- its future date, hiding a session that still blocked that day.

create or replace function private.claim_milestone_session_for_completion(
  p_owner_id uuid,
  p_goal_id uuid,
  p_date date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_completion_id uuid;
  v_item public.planner_items%rowtype;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    private.planner_owner_lock_key(p_owner_id)
  );

  select completion.id
  into v_completion_id
  from public.completions completion
  join public.goals goal on goal.id = completion.goal_id
  where completion.goal_id = p_goal_id
    and completion.user_id = p_owner_id
    and completion.completed_on = p_date
    and completion.planner_unit_key is null
    and goal.owner_id = p_owner_id
    and not goal.is_deleted
    and goal.frequency_type = 'fixed_milestones'::public.goal_frequency_type
    and p_date >= goal.start_date
    and (goal.end_date is null or p_date <= goal.end_date);

  if v_completion_id is null then
    return;
  end if;

  -- Prefer a session already on the completion date; otherwise take the
  -- earliest uncredited session and move it onto the date.
  select item.*
  into v_item
  from public.planner_items item
  where item.owner_id = p_owner_id
    and item.goal_id = p_goal_id
    and not exists (
      select 1
      from public.completions allocated
      where allocated.goal_id = p_goal_id
        and allocated.user_id = p_owner_id
        and allocated.planner_unit_key = item.unit_key
    )
    and (
      item.scheduled_date = p_date
      or (
        not item.locked
        and not exists (
          select 1
          from public.planner_items other_item
          where other_item.goal_id = p_goal_id
            and other_item.scheduled_date = p_date
        )
      )
    )
  order by (item.scheduled_date = p_date) desc, item.scheduled_date, item.id
  limit 1
  for update;

  if v_item.id is null then
    return;
  end if;

  if v_item.scheduled_date <> p_date then
    update public.planner_items item
    set
      scheduled_date = p_date,
      original_scheduled_date = coalesce(
        item.original_scheduled_date,
        item.scheduled_date
      ),
      updated_at = pg_catalog.now()
    where item.id = v_item.id;
  end if;

  update public.completions completion
  set planner_unit_key = v_item.unit_key
  where completion.id = v_completion_id;

  perform private.normalize_milestone_planner_ordinals(
    p_owner_id,
    array[p_goal_id]
  );
end;
$$;

revoke all on function private.claim_milestone_session_for_completion(uuid, uuid, date)
from public, anon, authenticated;

-- Call before the completion is deleted: restores the claimed session to the
-- date it was moved from when that date is still free and inside the goal.
create or replace function private.release_milestone_session_for_completion(
  p_owner_id uuid,
  p_goal_id uuid,
  p_date date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.planner_items%rowtype;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    private.planner_owner_lock_key(p_owner_id)
  );

  select item.*
  into v_item
  from public.completions completion
  join public.goals goal on goal.id = completion.goal_id
  join public.planner_items item
    on item.owner_id = completion.user_id
   and item.goal_id = completion.goal_id
   and item.unit_key = completion.planner_unit_key
  where completion.goal_id = p_goal_id
    and completion.user_id = p_owner_id
    and completion.completed_on = p_date
    and goal.owner_id = p_owner_id
    and not goal.is_deleted
    and goal.frequency_type = 'fixed_milestones'::public.goal_frequency_type
    and item.original_scheduled_date is not null
    and item.original_scheduled_date is distinct from item.scheduled_date
    and item.original_scheduled_date >= goal.start_date
    and (goal.end_date is null or item.original_scheduled_date <= goal.end_date)
  for update of item;

  if v_item.id is null
    or exists (
      select 1
      from public.planner_items other_item
      where other_item.goal_id = p_goal_id
        and other_item.scheduled_date = v_item.original_scheduled_date
        and other_item.id <> v_item.id
    )
  then
    return;
  end if;

  update public.planner_items item
  set
    scheduled_date = v_item.original_scheduled_date,
    original_scheduled_date = null,
    updated_at = pg_catalog.now()
  where item.id = v_item.id;

  perform private.normalize_milestone_planner_ordinals(
    p_owner_id,
    array[p_goal_id]
  );
end;
$$;

revoke all on function private.release_milestone_session_for_completion(uuid, uuid, date)
from public, anon, authenticated;

-- The planner owner lock is taken before any completion row is written so the
-- lock order matches every planner writer (owner lock, then goal rows).
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

  perform pg_catalog.pg_advisory_xact_lock(
    private.planner_owner_lock_key(v_uid)
  );

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

    if v_current <> p_goal_id then
      perform private.claim_milestone_session_for_completion(
        v_uid,
        v_current,
        p_date
      );
    end if;

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

  perform pg_catalog.pg_advisory_xact_lock(
    private.planner_owner_lock_key(v_uid)
  );

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

    if v_current <> p_goal_id then
      perform private.release_milestone_session_for_completion(
        v_uid,
        v_current,
        p_date
      );
    end if;

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

  perform pg_catalog.pg_advisory_xact_lock(
    private.planner_owner_lock_key(v_uid)
  );

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
    else
      perform private.claim_milestone_session_for_completion(
        v_uid,
        v_current,
        p_completed_on
      );
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

-- Bring existing unbound cascade credits into the same shape, oldest first so
-- each claims the session reconciliation already credited it with.
do $$
declare
  v_row record;
begin
  for v_row in
    select completion.user_id, completion.goal_id, completion.completed_on
    from public.completions completion
    join public.goals goal
      on goal.id = completion.goal_id
     and goal.owner_id = completion.user_id
    where completion.planner_unit_key is null
      and completion.source = 'linked_cascade'::public.completion_source
      and not goal.is_deleted
      and goal.frequency_type = 'fixed_milestones'::public.goal_frequency_type
    order by
      completion.user_id,
      completion.goal_id,
      completion.completed_on,
      completion.created_at,
      completion.id
  loop
    perform private.claim_milestone_session_for_completion(
      v_row.user_id,
      v_row.goal_id,
      v_row.completed_on
    );
  end loop;
end;
$$;
