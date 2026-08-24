-- Seed new accounts with one planner task, daily and weekly cadences,
-- a one-step milestone, and a two-step teammate milestone.

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

  insert into public.planner_tasks (
    owner_id,
    title,
    scheduled_date,
    completed_at,
    is_deleted
  )
  values (
    new.id,
    'Write your top priority for today',
    v_anchor_date,
    null,
    false
  );

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
      'Move for 10 minutes',
      'A small daily movement habit to get you on the calendar.',
      'Personal',
      'personal',
      'recurring'::public.goal_frequency_type,
      'daily'::public.recurrence_interval,
      null,
      null,
      v_anchor_date,
      null,
      null,
      false,
      'easy'::public.goal_difficulty,
      false
    ),
    (
      gen_random_uuid(),
      new.id,
      'Review the week',
      'A weekly check-in to notice what worked and what to change.',
      'Personal',
      'personal',
      'recurring'::public.goal_frequency_type,
      'weekly'::public.recurrence_interval,
      null,
      null,
      v_anchor_date,
      null,
      null,
      false,
      'easy'::public.goal_difficulty,
      false
    ),
    (
      gen_random_uuid(),
      new.id,
      'Set up your profile',
      'Add a name and photo so teammates can recognize you.',
      'Personal',
      'personal',
      'fixed_milestones'::public.goal_frequency_type,
      null,
      1,
      array['Profile basics complete'],
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
      'Invite a teammate',
      'Open Community Team and send one partner invite.',
      'Relationships',
      'relationships',
      'fixed_milestones'::public.goal_frequency_type,
      null,
      2,
      array['Send the invite', 'They join'],
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
