-- Retried goal creation uses the caller-provided deterministic id. Treat an
-- existing row owned by the caller as an idempotent replay, while preserving
-- the explicit ownership failure for another owner's row.

-- Keep this write boundary safe if the later target-basis alignment migration
-- is deployed separately. Period-basis recurring rows always get a valid
-- target before they reach public.goals.
create or replace function private.goal_period_target_max(
  p_recurrence_interval public.recurrence_interval
)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_recurrence_interval
    when 'weekly'::public.recurrence_interval then 7
    when 'monthly'::public.recurrence_interval then 31
    else 1
  end;
$$;

revoke all on function private.goal_period_target_max(
  public.recurrence_interval
) from public, anon, authenticated;
grant execute on function private.goal_period_target_max(
  public.recurrence_interval
) to service_role;

create or replace function private.resolve_goal_target_basis(
  p_frequency_type public.goal_frequency_type,
  p_recurrence_interval public.recurrence_interval,
  p_target_count integer,
  p_target_basis public.goal_target_basis default null
)
returns public.goal_target_basis
language sql
immutable
set search_path = ''
as $$
  select case
    when p_frequency_type = 'fixed_milestones'::public.goal_frequency_type then
      'lifetime'::public.goal_target_basis
    when p_target_basis is not null then
      p_target_basis
    when p_frequency_type = 'recurring'::public.goal_frequency_type
      and p_target_count > private.goal_period_target_max(p_recurrence_interval) then
      'lifetime'::public.goal_target_basis
    else
      'period'::public.goal_target_basis
  end;
$$;

revoke all on function private.resolve_goal_target_basis(
  public.goal_frequency_type,
  public.recurrence_interval,
  integer,
  public.goal_target_basis
) from public, anon, authenticated;
grant execute on function private.resolve_goal_target_basis(
  public.goal_frequency_type,
  public.recurrence_interval,
  integer,
  public.goal_target_basis
) to service_role;

create or replace function private.normalize_goal_target_count(
  p_frequency_type public.goal_frequency_type,
  p_recurrence_interval public.recurrence_interval,
  p_target_count integer,
  p_target_basis public.goal_target_basis
)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case
    when p_frequency_type = 'recurring'::public.goal_frequency_type
      and private.resolve_goal_target_basis(
        p_frequency_type,
        p_recurrence_interval,
        p_target_count,
        p_target_basis
      ) = 'period'::public.goal_target_basis
      then coalesce(p_target_count, 1)
    else p_target_count
  end;
$$;

revoke all on function private.normalize_goal_target_count(
  public.goal_frequency_type,
  public.recurrence_interval,
  integer,
  public.goal_target_basis
) from public, anon, authenticated;
grant execute on function private.normalize_goal_target_count(
  public.goal_frequency_type,
  public.recurrence_interval,
  integer,
  public.goal_target_basis
) to service_role;

update public.goals
set target_count = 1
where frequency_type = 'recurring'::public.goal_frequency_type
  and target_basis = 'period'::public.goal_target_basis
  and target_count is null;

create or replace function public.create_goal(
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
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_category text;
  v_category_key text;
  v_id uuid := coalesce(p_id, gen_random_uuid());
  v_difficulty public.goal_difficulty := coalesce(
    p_difficulty,
    'medium'::public.goal_difficulty
  );
  v_target_basis public.goal_target_basis := private.resolve_goal_target_basis(
    p_frequency_type,
    p_recurrence_interval,
    p_target_count,
    p_target_basis
  );
begin
  if v_uid is null then
    raise exception using
      errcode = '42501',
      message = 'authentication required';
  end if;

  if p_team_id is not null
    and not private.is_active_team_member(p_team_id, v_uid) then
    raise exception using
      errcode = '42501',
      message = 'not a member of team';
  end if;

  select n.category, n.category_key
  into v_category, v_category_key
  from private.normalize_goal_category_pair(p_category, p_category_key) n;

  insert into public.goals (
    id,
    owner_id,
    title,
    description,
    reward_text,
    category,
    category_key,
    color,
    frequency_type,
    recurrence_interval,
    target_count,
    target_basis,
    milestone_names,
    start_date,
    end_date,
    default_local_time,
    team_id,
    is_private,
    difficulty,
    is_deleted
  )
  values (
    v_id,
    v_uid,
    p_title,
    p_description,
    p_reward_text,
    v_category,
    v_category_key,
    p_color,
    p_frequency_type,
    p_recurrence_interval,
    private.normalize_goal_target_count(
      p_frequency_type,
      p_recurrence_interval,
      p_target_count,
      v_target_basis
    ),
    v_target_basis,
    p_milestone_names,
    p_start_date,
    p_end_date,
    p_default_local_time,
    p_team_id,
    coalesce(p_is_private, false),
    v_difficulty,
    false
  )
  on conflict (id) do nothing;

  if not found then
    perform private.assert_goal_owner(v_id, v_uid);
  end if;

  return v_id;
end;
$$;

-- Replayed link batches must accept the exact same source/target pair without
-- weakening validation for ownership, group goals, or self-links.
create or replace function private.insert_goal_link_validated(
  p_owner_id uuid,
  p_source_goal_id uuid,
  p_target_goal_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_source_owner uuid;
  v_target_owner uuid;
  v_source_team uuid;
  v_target_team uuid;
begin
  if p_source_goal_id = p_target_goal_id then
    raise exception using
      errcode = '23514',
      message = 'goal link source and target must differ';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    private.planner_owner_lock_key(p_owner_id)
  );

  perform id
  from public.goals
  where id in (p_source_goal_id, p_target_goal_id)
  order by id
  for key share;

  select owner_id, team_id
  into v_source_owner, v_source_team
  from public.goals
  where id = p_source_goal_id;

  select owner_id, team_id
  into v_target_owner, v_target_team
  from public.goals
  where id = p_target_goal_id;

  if v_source_owner is null or v_target_owner is null then
    raise exception using
      errcode = '23503',
      message = 'both goals must exist for linking';
  end if;

  if v_source_owner <> p_owner_id or v_target_owner <> p_owner_id then
    raise exception using
      errcode = '23514',
      message = 'goal links may only connect goals owned by the link owner';
  end if;

  if v_source_team is not null or v_target_team is not null then
    raise exception using
      errcode = '23514',
      message = 'team goals cannot participate in personal goal links';
  end if;

  insert into public.goal_links (
    owner_id,
    source_goal_id,
    target_goal_id
  )
  values (
    p_owner_id,
    p_source_goal_id,
    p_target_goal_id
  )
  on conflict (source_goal_id, target_goal_id) do nothing;
end;
$$;
