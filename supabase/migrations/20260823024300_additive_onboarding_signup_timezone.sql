-- Persist the device timezone from signup metadata and seed onboarding
-- starter goals on that timezone's local date instead of UTC.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_username text;
  resolved_username text;
  resolved_week_starts_on smallint := 1;
  resolved_timezone text := null;
begin
  base_username := lower(
    coalesce(
      nullif(new.raw_user_meta_data->>'username', ''),
      nullif(split_part(new.email, '@', 1), ''),
      'user'
    )
  );

  base_username := regexp_replace(base_username, '[^a-z0-9_]', '', 'g');
  if base_username = '' then
    base_username := 'user';
  end if;

  resolved_username := base_username;
  if exists (select 1 from public.profiles where username = resolved_username) then
    raise exception 'Username is already taken.'
      using errcode = '23505';
  end if;

  if
    jsonb_typeof(new.raw_user_meta_data) = 'object'
    and (new.raw_user_meta_data ? 'week_starts_on')
    and coalesce(new.raw_user_meta_data->>'week_starts_on', '') ~ '^[0-6]$'
  then
    resolved_week_starts_on := (new.raw_user_meta_data->>'week_starts_on')::smallint;
  end if;

  if jsonb_typeof(new.raw_user_meta_data) = 'object' then
    resolved_timezone := nullif(btrim(new.raw_user_meta_data->>'timezone'), '');
    if
      resolved_timezone is not null
      and not private.is_valid_planner_timezone(resolved_timezone)
    then
      resolved_timezone := null;
    end if;
  end if;

  insert into public.profiles (
    id,
    username,
    display_name,
    avatar_url,
    week_starts_on,
    timezone
  )
  values (
    new.id,
    resolved_username,
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), resolved_username),
    nullif(new.raw_user_meta_data->>'avatar_url', ''),
    resolved_week_starts_on,
    coalesce(resolved_timezone, 'UTC')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function private.seed_default_onboarding_goals()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_seed_default_goals boolean := false;
  v_anchor_date date;
begin
  select
    case
      when lower(coalesce(user_row.raw_user_meta_data->>'seed_default_goals', '')) in ('1', 't', 'true', 'yes')
        then true
      else false
    end
    into v_seed_default_goals
  from auth.users user_row
  where user_row.id = new.id;

  if coalesce(v_seed_default_goals, false) = false then
    return new;
  end if;

  -- If a row was backfilled for an existing account, do not duplicate starter data.
  if exists (
    select 1
    from public.goals goal
    where goal.owner_id = new.id
      and goal.is_deleted = false
  ) then
    return new;
  end if;

  if new.timezone is not null and private.is_valid_planner_timezone(new.timezone) then
    v_anchor_date := private.local_today_for_timezone(new.timezone);
  else
    v_anchor_date := (clock_timestamp() at time zone 'UTC')::date;
  end if;

  insert into public.goals (
    id,
    owner_id,
    title,
    description,
    category,
    category_key,
    frequency_type,
    recurrence_interval,
    target_count,
    milestone_names,
    start_date,
    end_date,
    team_id,
    is_private,
    difficulty,
    is_deleted
  )
  values
    (
      gen_random_uuid(),
      new.id,
      'Create your Goalmaxxing account',
      'Complete profile basics and confirm your planner preferences.',
      'Personal',
      'personal',
      'fixed_milestones'::public.goal_frequency_type,
      null,
      1,
      array['Account setup complete'],
      v_anchor_date,
      v_anchor_date,
      null,
      false,
      'easy'::public.goal_difficulty,
      false
    ),
    (
      gen_random_uuid(),
      new.id,
      'Create your first goal',
      'Use New Goal + to add one real goal you want to complete this week.',
      'Personal',
      'personal',
      'fixed_milestones'::public.goal_frequency_type,
      null,
      1,
      array['First goal created'],
      v_anchor_date,
      v_anchor_date + 1,
      null,
      false,
      'easy'::public.goal_difficulty,
      false
    ),
    (
      gen_random_uuid(),
      new.id,
      'Invite your first teammate',
      'Open Community Team and send one partner invite.',
      'Relationships',
      'relationships',
      'fixed_milestones'::public.goal_frequency_type,
      null,
      1,
      array['Team invite sent'],
      v_anchor_date,
      v_anchor_date + 7,
      null,
      false,
      'easy'::public.goal_difficulty,
      false
    );

  return new;
end;
$$;
