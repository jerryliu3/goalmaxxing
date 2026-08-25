begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(7);

insert into auth.users (id, email)
values (
  '97000000-0000-4000-8000-000000000001',
  'goal-period-target-backfill@example.com'
)
on conflict (id) do nothing;

insert into public.profiles (id, username)
values (
  '97000000-0000-4000-8000-000000000001',
  'goal_period_target_backfill_fixture'
)
on conflict (id) do nothing;

set local role service_role;

select is(
  (
    select count(*)::integer
    from public.goals
    where frequency_type = 'recurring'::public.goal_frequency_type
      and target_basis = 'period'::public.goal_target_basis
      and target_count is null
  ),
  0,
  'migration backfills existing recurring period goals with null targets'
);

insert into public.goals (
  id,
  owner_id,
  title,
  category,
  frequency_type,
  recurrence_interval,
  target_count,
  target_basis,
  start_date
)
values (
  '97000000-0000-4000-8000-000000000002',
  '97000000-0000-4000-8000-000000000001',
  'Legacy period target',
  'test',
  'recurring',
  'weekly',
  null,
  'period'::public.goal_target_basis,
  '2026-08-01'
);

select is(
  (
    select target_count
    from public.goals
    where id = '97000000-0000-4000-8000-000000000002'
  ),
  null::integer,
  'fixture starts in the legacy recurring-period shape'
);

-- Migrations are applied before this test transaction, so pgTAP cannot replay
-- this migration against a pre-migration row. The fixture below exercises the
-- exact legacy predicate and verifies the resulting immutable edit contract.
select lives_ok(
  $$
    update public.goals
    set target_count = 1
    where id = '97000000-0000-4000-8000-000000000002'
      and frequency_type = 'recurring'::public.goal_frequency_type
      and target_basis = 'period'::public.goal_target_basis
      and target_count is null
  $$,
  'legacy recurring period target can be normalized to one'
);

select is(
  (
    select target_count
    from public.goals
    where id = '97000000-0000-4000-8000-000000000002'
  ),
  1,
  'normalized recurring period target is one'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '97000000-0000-4000-8000-000000000001',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$
    select public.update_goal(
      '97000000-0000-4000-8000-000000000002',
      'Legacy period target edited',
      null,
      null,
      'test',
      'test',
      '#6366f1',
      'recurring',
      'weekly',
      1,
      null,
      '2026-08-01',
      null,
      null,
      null,
      false,
      'medium',
      'period'
    )
  $$,
  'normalized legacy period goal can use the immutable edit path'
);

select throws_ok(
  $$
    select public.update_goal(
      '97000000-0000-4000-8000-000000000002',
      'Invalid target edit',
      null,
      null,
      'test',
      'test',
      '#6366f1',
      'recurring',
      'weekly',
      2,
      null,
      '2026-08-01',
      null,
      null,
      null,
      false,
      'medium',
      'period'
    )
  $$,
  '22023',
  'goal definition fields are immutable after creation',
  'normalized legacy period goal still rejects definition edits'
);

select is(
  (
    select target_count
    from public.goals
    where id = '97000000-0000-4000-8000-000000000002'
  ),
  1,
  'rejected immutable edit leaves normalized target unchanged'
);

reset role;
select * from finish();
rollback;
