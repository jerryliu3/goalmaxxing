begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;

select plan(14);

insert into auth.users (id, email, raw_user_meta_data)
values (
  '7a111111-1111-4111-8111-111111111111',
  'seeded-onboarding@example.com',
  '{"username":"seeded_onboarding","seed_default_goals":true}'::jsonb
)
on conflict (id) do nothing;

select ok(
  exists(
    select 1
    from public.profiles profile
    where profile.id = '7a111111-1111-4111-8111-111111111111'
  ),
  'signup trigger creates profile for seeded account'
);

select is(
  (
    select count(*)::integer
    from public.goals goal
    where goal.owner_id = '7a111111-1111-4111-8111-111111111111'
      and goal.is_deleted = false
  ),
  4,
  'seeded account receives four onboarding default goals'
);

select is(
  (
    select count(*)::integer
    from public.planner_tasks task
    where task.owner_id = '7a111111-1111-4111-8111-111111111111'
      and task.is_deleted = false
      and task.title = 'Write your top priority for today'
  ),
  1,
  'seeded account receives one planner task'
);

select is(
  (
    select count(*)::integer
    from public.goals goal
    where goal.owner_id = '7a111111-1111-4111-8111-111111111111'
      and goal.frequency_type = 'recurring'::public.goal_frequency_type
      and goal.recurrence_interval = 'daily'::public.recurrence_interval
      and goal.title = 'Move for 10 minutes'
  ),
  1,
  'seeded defaults include a daily cadence goal'
);

select is(
  (
    select count(*)::integer
    from public.goals goal
    where goal.owner_id = '7a111111-1111-4111-8111-111111111111'
      and goal.frequency_type = 'recurring'::public.goal_frequency_type
      and goal.recurrence_interval = 'weekly'::public.recurrence_interval
      and goal.title = 'Review the week'
  ),
  1,
  'seeded defaults include a weekly cadence goal'
);

select is(
  (
    select (goal.end_date - goal.start_date)::integer
    from public.goals goal
    where goal.owner_id = '7a111111-1111-4111-8111-111111111111'
      and goal.title = 'Set up your profile'
  ),
  0,
  'profile setup starter goal is due on creation date'
);

select is(
  (
    select goal.target_count
    from public.goals goal
    where goal.owner_id = '7a111111-1111-4111-8111-111111111111'
      and goal.title = 'Invite a teammate'
      and goal.milestone_names = array['Send the invite', 'They join']::text[]
  ),
  2,
  'team invite starter goal has two subgoals'
);

select is(
  (
    select (goal.end_date - goal.start_date)::integer
    from public.goals goal
    where goal.owner_id = '7a111111-1111-4111-8111-111111111111'
      and goal.title = 'Invite a teammate'
  ),
  7,
  'team invite starter item is due within the first week'
);

insert into auth.users (id, email, raw_user_meta_data)
values (
  '7a222222-2222-4222-8222-222222222222',
  'unseeded-onboarding@example.com',
  '{"username":"unseeded_onboarding","seed_default_goals":false}'::jsonb
)
on conflict (id) do nothing;

select is(
  (
    select count(*)::integer
    from public.goals goal
    where goal.owner_id = '7a222222-2222-4222-8222-222222222222'
      and goal.is_deleted = false
  ),
  0,
  'accounts with explicit seed_default_goals=false do not receive defaults'
);

insert into auth.users (id, email, raw_user_meta_data)
values (
  '7a333333-3333-4333-8333-333333333333',
  'missing-seed-flag@example.com',
  '{"username":"missing_seed_flag"}'::jsonb
)
on conflict (id) do nothing;

select is(
  (
    select count(*)::integer
    from public.goals goal
    where goal.owner_id = '7a333333-3333-4333-8333-333333333333'
      and goal.is_deleted = false
  ),
  0,
  'accounts without seed_default_goals metadata do not receive defaults'
);

select is(
  (
    select count(*)::integer
    from public.goals goal
    where goal.owner_id = '7a111111-1111-4111-8111-111111111111'
      and goal.category_key in ('personal', 'relationships')
  ),
  4,
  'seeded defaults use canonical category keys'
);

insert into auth.users (id, email, raw_user_meta_data)
values (
  '7a444444-4444-4444-8444-444444444444',
  'timezone-onboarding@example.com',
  '{"username":"tz_onboarding","seed_default_goals":true,"timezone":"Pacific/Kiritimati"}'::jsonb
)
on conflict (id) do nothing;

select is(
  (
    select profile.timezone
    from public.profiles profile
    where profile.id = '7a444444-4444-4444-8444-444444444444'
  ),
  'Pacific/Kiritimati',
  'signup timezone metadata is stored on the new profile'
);

select is(
  (
    select goal.start_date
    from public.goals goal
    where goal.owner_id = '7a444444-4444-4444-8444-444444444444'
      and goal.title = 'Set up your profile'
  ),
  (clock_timestamp() at time zone 'Pacific/Kiritimati')::date,
  'seeded start dates use the device timezone local date'
);

insert into auth.users (id, email, raw_user_meta_data)
values (
  '7a555555-5555-4555-8555-555555555555',
  'invalid-timezone-onboarding@example.com',
  '{"username":"bad_tz_onboarding","seed_default_goals":true,"timezone":"Mars/Olympus_Mons"}'::jsonb
)
on conflict (id) do nothing;

select is(
  (
    select count(*)::integer
    from public.goals goal
    where goal.owner_id = '7a555555-5555-4555-8555-555555555555'
      and goal.is_deleted = false
  ),
  4,
  'invalid signup timezone still seeds default goals'
);

select * from finish();
rollback;
