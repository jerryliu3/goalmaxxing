begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(7);

insert into auth.users (id, email)
values (
  '11111111-1111-4111-8111-111111111111',
  'goal-soft-delete-planner-cleanup@example.com'
)
on conflict (id) do nothing;

insert into public.profiles (id, username, timezone)
values (
  '11111111-1111-4111-8111-111111111111',
  'goal_soft_delete_planner_cleanup_owner',
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
  '92800000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  'Soft delete planner cleanup goal',
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
    '92800000-0000-4000-8000-000000000001',
    'cadence:' || to_char(current_date - 3, 'YYYY-MM-DD'),
    current_date - 3,
    current_date - 3,
    false
  ),
  (
    '11111111-1111-4111-8111-111111111111',
    '92800000-0000-4000-8000-000000000001',
    'cadence:' || to_char(current_date, 'YYYY-MM-DD'),
    current_date,
    current_date,
    false
  ),
  (
    '11111111-1111-4111-8111-111111111111',
    '92800000-0000-4000-8000-000000000001',
    'cadence:' || to_char(current_date + 5, 'YYYY-MM-DD'),
    current_date + 5,
    current_date + 5,
    false
  );

insert into public.completions (goal_id, user_id, completed_on, source)
values (
  '92800000-0000-4000-8000-000000000001',
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
  '92800000-0000-4000-8000-000000000001',
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
    where goal_id = '92800000-0000-4000-8000-000000000001'
  ),
  3,
  'seed goal has past, completed-today, and future planner items'
);

select lives_ok(
  $$
    select public.soft_delete_goal('92800000-0000-4000-8000-000000000001')
  $$,
  'soft_delete_goal succeeds for owner'
);

select lives_ok(
  $$
    select public.soft_delete_goal('92800000-0000-4000-8000-000000000001')
  $$,
  'soft_delete_goal is idempotent after planner cleanup'
);

set local role service_role;

select is(
  (
    select pg_catalog.count(*)::integer
    from public.planner_items
    where goal_id = '92800000-0000-4000-8000-000000000001'
  ),
  0,
  'soft delete removes all planner items including completed sessions'
);

select is(
  (
    select pg_catalog.count(*)::integer
    from public.planner_goal_unplaceable
    where goal_id = '92800000-0000-4000-8000-000000000001'
  ),
  0,
  'soft delete clears durable unplaceable state for the goal'
);

select is(
  (
    select pg_catalog.count(*)::integer
    from public.completions
    where goal_id = '92800000-0000-4000-8000-000000000001'
  ),
  1,
  'soft delete keeps completion history'
);

select is(
  (
    select is_deleted
    from public.goals
    where id = '92800000-0000-4000-8000-000000000001'
  ),
  true,
  'goal remains soft-deleted after repeated delete'
);

select * from finish();
rollback;
