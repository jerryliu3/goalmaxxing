-- Restore the original three onboarding starter goals and give each a
-- seven-day deadline from the signup anchor date.

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
      v_anchor_date + 7,
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
      v_anchor_date + 7,
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
