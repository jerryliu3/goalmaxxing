begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(7);

insert into auth.users (id, email)
values (
  '11111111-1111-4111-8111-111111111111',
  'goal-archive-planner-cleanup@example.com'
)
on conflict (id) do nothing;

insert into public.profiles (id, username, timezone)
values (
  '11111111-1111-4111-8111-111111111111',
  'goal_archive_planner_cleanup_owner',
  'UTC'
)
on conflict (id) do update
set timezone = excluded.timezone;

set local role service_role;

insert into public.goals (
  id,
  owner_id,
  title,
  description,
  category,
  color,
  frequency_type,
  recurrence_interval,
  target_count,
  start_date,
  end_date
)
values (
  '91800000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  'Archive planner cleanup goal',
  null,
  'test',
  null,
  'recurring',
  'daily',
  null,
  current_date - 14,
  current_date + 14
);

insert into public.planner_items (
  owner_id,
  goal_id,
  unit_key,
  scheduled_date,
  original_scheduled_date,
  locked
)
values
  (
    '11111111-1111-4111-8111-111111111111',
    '91800000-0000-4000-8000-000000000001',
    'cadence:' || to_char(current_date - 3, 'YYYY-MM-DD'),
    current_date - 3,
    current_date - 3,
    false
  ),
  (
    '11111111-1111-4111-8111-111111111111',
    '91800000-0000-4000-8000-000000000001',
    'cadence:' || to_char(current_date, 'YYYY-MM-DD'),
    current_date,
    current_date,
    false
  ),
  (
    '11111111-1111-4111-8111-111111111111',
    '91800000-0000-4000-8000-000000000001',
    'cadence:' || to_char(current_date + 5, 'YYYY-MM-DD'),
    current_date + 5,
    current_date + 5,
    false
  );

insert into public.completions (goal_id, user_id, completed_on, source)
values (
  '91800000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  current_date,
  'manual'
);

insert into public.planner_goal_unplaceable (
  owner_id,
  goal_id,
  requirement_fingerprint,
  policy_fingerprint,
  policy_revision,
  lock_signature,
  effective_span_end,
  unplaced_count,
  reason
)
values (
  '11111111-1111-4111-8111-111111111111',
  '91800000-0000-4000-8000-000000000001',
  'req-fingerprint',
  'policy-fingerprint',
  0,
  '',
  current_date + 14,
  2,
  'capacity'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (
    select pg_catalog.count(*)::integer
    from public.planner_items
    where goal_id = '91800000-0000-4000-8000-000000000001'
  ),
  3,
  'seed goal has past, completed-today, and future planner items'
);

select lives_ok(
  $$
    select public.set_goal_archived(
      '91800000-0000-4000-8000-000000000001',
      true
    )
  $$,
  'set_goal_archived succeeds for owner'
);

select is(
  (
    select pg_catalog.count(*)::integer
    from public.planner_items
    where goal_id = '91800000-0000-4000-8000-000000000001'
  ),
  1,
  'archive removes incomplete planner items but keeps completed session'
);

select is(
  (
    select scheduled_date::text
    from public.planner_items
    where goal_id = '91800000-0000-4000-8000-000000000001'
  ),
  current_date::text,
  'remaining planner item is the completed session date'
);

select is(
  (
    select pg_catalog.count(*)::integer
    from public.planner_goal_unplaceable
    where goal_id = '91800000-0000-4000-8000-000000000001'
  ),
  0,
  'archive clears durable unplaceable state for the goal'
);

select lives_ok(
  $$
    select public.set_goal_archived(
      '91800000-0000-4000-8000-000000000001',
      false
    )
  $$,
  'restore goal succeeds without recreating planner items'
);

select is(
  (
    select pg_catalog.count(*)::integer
    from public.planner_items
    where goal_id = '91800000-0000-4000-8000-000000000001'
  ),
  1,
  'restore does not resurrect deleted incomplete planner items'
);

select * from finish();
rollback;
