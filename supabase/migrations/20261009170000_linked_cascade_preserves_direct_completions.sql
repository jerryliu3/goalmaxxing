-- Both goals in a link are now visible and directly completable. Undoing the
-- source used to delete every descendant completion on that date, including a
-- completion the user made on the target. A source completed before the target
-- starts also inserted a cascade row the target's progress then ignored.
--
-- Undo removes a descendant row only when this cascade wrote it, and still
-- walks past a kept row so a later cascade credit can be removed. A cascade
-- credit is written only while the descendant is inside its own start and end.

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
  v_inside boolean;
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

    if v_current <> p_goal_id then
      select
        p_date >= goal.start_date
        and (goal.end_date is null or p_date <= goal.end_date)
      into v_inside
      from public.goals as goal
      where goal.id = v_current;

      if not coalesce(v_inside, false) then
        v_queue := v_queue || private.owned_linked_target_ids(v_uid, v_current);
        continue;
      end if;
    end if;

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
  v_removed boolean;
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

    if v_current = p_goal_id then
      delete from public.completions
      where goal_id = v_current
        and user_id = v_uid
        and completed_on = p_date;

      perform private.enqueue_goal_xp_recompute(v_uid, v_current);
    else
      select exists (
        select 1
        from public.completions
        where goal_id = v_current
          and user_id = v_uid
          and completed_on = p_date
          and source = 'linked_cascade'
      )
      into v_removed;

      if v_removed then
        perform private.release_milestone_session_for_completion(
          v_uid,
          v_current,
          p_date
        );

        delete from public.completions
        where goal_id = v_current
          and user_id = v_uid
          and completed_on = p_date
          and source = 'linked_cascade';

        perform private.enqueue_goal_xp_recompute(v_uid, v_current);
      end if;
    end if;

    v_queue := v_queue || private.owned_linked_target_ids(v_uid, v_current);
  end loop;
end;
$$;
