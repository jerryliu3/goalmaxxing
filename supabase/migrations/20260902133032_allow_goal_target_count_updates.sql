-- Allow update_goal to change target_count after creation. Type, cadence,
-- target basis, and start date stay immutable. Ordinal targets cannot drop
-- below completions already recorded on the goal.

create or replace function public.update_goal(
  p_id uuid,
  p_title text,
  p_description text default null,
  p_reward_text text default null,
  p_category text default 'general',
  p_category_key text default null,
  p_color text default null,
  p_frequency_type public.goal_frequency_type default 'recurring',
  p_recurrence_interval public.recurrence_interval default null,
  p_target_count integer default null,
  p_milestone_names text[] default null,
  p_start_date date default current_date,
  p_end_date date default null,
  p_default_local_time text default null,
  p_team_id uuid default null,
  p_is_private boolean default false,
  p_difficulty public.goal_difficulty default null,
  p_target_basis public.goal_target_basis default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_old public.goals%rowtype;
  v_category text;
  v_category_key text;
  v_needs_xp boolean := false;
  v_is_private boolean := coalesce(p_is_private, false);
  v_difficulty public.goal_difficulty;
  v_new_target_count integer;
  v_completed_count integer := 0;
begin
  perform private.assert_goal_owner(p_id, v_uid);

  if p_team_id is not null
    and not private.is_active_team_member(p_team_id, v_uid) then
    raise exception using
      errcode = '42501',
      message = 'not a member of team';
  end if;

  select *
  into v_old
  from public.goals
  where id = p_id
  for update;

  if v_old.frequency_type is distinct from p_frequency_type
    or v_old.recurrence_interval is distinct from p_recurrence_interval
    or v_old.target_basis is distinct from private.resolve_goal_target_basis(
      p_frequency_type,
      p_recurrence_interval,
      p_target_count,
      p_target_basis
    )
    or v_old.start_date is distinct from p_start_date then
    raise exception using
      errcode = '22023',
      message = 'goal definition fields are immutable after creation';
  end if;

  v_new_target_count := private.normalize_goal_target_count(
    p_frequency_type,
    p_recurrence_interval,
    p_target_count,
    coalesce(
      p_target_basis,
      v_old.target_basis
    )
  );

  if v_old.frequency_type = 'fixed_milestones'::public.goal_frequency_type
    or v_old.target_basis = 'lifetime'::public.goal_target_basis then
    select count(*)::integer
    into v_completed_count
    from public.completions
    where goal_id = p_id;

    if v_new_target_count is not null
      and v_new_target_count < v_completed_count then
      raise exception using
        errcode = '22023',
        message = 'target count cannot be below existing completions';
    end if;
  end if;

  select n.category, n.category_key
  into v_category, v_category_key
  from private.normalize_goal_category_pair(p_category, p_category_key) n;

  v_difficulty := coalesce(
    p_difficulty,
    v_old.difficulty,
    'medium'::public.goal_difficulty
  );

  v_needs_xp :=
    v_old.end_date is distinct from p_end_date
    or v_old.category_key is distinct from v_category_key
    or v_old.target_count is distinct from v_new_target_count;

  update public.goals
  set
    title = p_title,
    description = p_description,
    reward_text = p_reward_text,
    category = v_category,
    category_key = v_category_key,
    color = p_color,
    target_count = v_new_target_count,
    milestone_names = p_milestone_names,
    end_date = p_end_date,
    default_local_time = p_default_local_time,
    team_id = p_team_id,
    is_private = v_is_private,
    difficulty = v_difficulty
  where id = p_id
    and owner_id = v_uid;

  if v_is_private then
    delete from public.goal_shares
    where goal_id = p_id;
  end if;

  if v_needs_xp then
    perform private.recompute_xp_for_goal_users(p_id);
  end if;
end;
$$;
