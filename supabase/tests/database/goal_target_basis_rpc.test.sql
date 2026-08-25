begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(13);

insert into auth.users (id, email)
values (
  '97000000-0000-4000-8000-000000000011',
  'goal-target-basis-rpc@example.com'
)
on conflict (id) do nothing;

insert into public.profiles (id, username)
values (
  '97000000-0000-4000-8000-000000000011',
  'goal_target_basis_rpc_fixture'
)
on conflict (id) do nothing;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '97000000-0000-4000-8000-000000000011',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select public.create_goal(
  '97000000-0000-4000-8000-000000000021',
  'Daily omitted target',
  null,
  null,
  'test',
  'test',
  null,
  'recurring',
  'daily',
  null,
  null,
  '2026-08-01',
  null,
  null,
  null,
  false,
  'medium',
  null
);

select is(
  (select target_basis from public.goals where id = '97000000-0000-4000-8000-000000000021'),
  'period'::public.goal_target_basis,
  'omitted daily basis resolves to period'
);
select is(
  (select target_count from public.goals where id = '97000000-0000-4000-8000-000000000021'),
  1,
  'omitted daily period target normalizes null to one'
);

select public.create_goal(
  '97000000-0000-4000-8000-000000000012',
  'Weekly period threshold',
  null,
  null,
  'test',
  'test',
  null,
  'recurring',
  'weekly',
  7,
  null,
  '2026-08-01',
  null,
  null,
  null,
  false,
  'medium',
  null
);

select is(
  (select target_basis from public.goals where id = '97000000-0000-4000-8000-000000000012'),
  'period'::public.goal_target_basis,
  'weekly target at seven remains period-based'
);

select public.create_goal(
  '97000000-0000-4000-8000-000000000013',
  'Weekly lifetime threshold',
  null,
  null,
  'test',
  'test',
  null,
  'recurring',
  'weekly',
  8,
  null,
  '2026-08-01',
  null,
  null,
  null,
  false,
  'medium',
  null
);

select is(
  (select target_basis from public.goals where id = '97000000-0000-4000-8000-000000000013'),
  'lifetime'::public.goal_target_basis,
  'weekly target above seven resolves to lifetime'
);

select public.create_goal(
  '97000000-0000-4000-8000-000000000014',
  'Monthly period threshold',
  null,
  null,
  'test',
  'test',
  null,
  'recurring',
  'monthly',
  31,
  null,
  '2026-08-01',
  null,
  null,
  null,
  false,
  'medium',
  null
);

select is(
  (select target_basis from public.goals where id = '97000000-0000-4000-8000-000000000014'),
  'period'::public.goal_target_basis,
  'monthly target at thirty-one remains period-based'
);

select public.create_goal(
  '97000000-0000-4000-8000-000000000015',
  'Monthly lifetime threshold',
  null,
  null,
  'test',
  'test',
  null,
  'recurring',
  'monthly',
  32,
  null,
  '2026-08-01',
  null,
  null,
  null,
  false,
  'medium',
  null
);

select is(
  (select target_basis from public.goals where id = '97000000-0000-4000-8000-000000000015'),
  'lifetime'::public.goal_target_basis,
  'monthly target above thirty-one resolves to lifetime'
);

select public.create_goal(
  '97000000-0000-4000-8000-000000000016',
  'Explicit lifetime',
  null,
  null,
  'test',
  'test',
  null,
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
  'lifetime'
);

select is(
  (select target_basis from public.goals where id = '97000000-0000-4000-8000-000000000016'),
  'lifetime'::public.goal_target_basis,
  'explicit lifetime basis is preserved'
);

select public.create_goal(
  '97000000-0000-4000-8000-000000000017',
  'Explicit period null target',
  null,
  null,
  'test',
  'test',
  null,
  'recurring',
  'monthly',
  null,
  null,
  '2026-08-01',
  null,
  null,
  null,
  false,
  'medium',
  'period'
);

select is(
  (select target_basis from public.goals where id = '97000000-0000-4000-8000-000000000017'),
  'period'::public.goal_target_basis,
  'explicit period basis is preserved'
);

select is(
  (select target_count from public.goals where id = '97000000-0000-4000-8000-000000000017'),
  1,
  'explicit period basis normalizes a null target to one'
);

select public.create_goal(
  '97000000-0000-4000-8000-000000000018',
  'Fixed milestones',
  null,
  null,
  'test',
  'test',
  null,
  'fixed_milestones',
  null,
  3,
  array['one', 'two', 'three'],
  '2026-08-01',
  null,
  null,
  null,
  false,
  'medium',
  'period'
);

select is(
  (select target_basis from public.goals where id = '97000000-0000-4000-8000-000000000018'),
  'lifetime'::public.goal_target_basis,
  'fixed milestones remain lifetime-based'
);

select public.create_goals(
  jsonb_build_array(
    jsonb_build_object(
      'id', '97000000-0000-4000-8000-000000000019',
      'title', 'Bulk direct RPC threshold',
      'category', 'test',
      'category_key', 'test',
      'frequency_type', 'recurring',
      'recurrence_interval', 'weekly',
      'target_count', 8,
      'start_date', '2026-08-01'
    )
  )
);

select is(
  (select target_basis from public.goals where id = '97000000-0000-4000-8000-000000000019'),
  'lifetime'::public.goal_target_basis,
  'bulk create_goals preserves omitted-basis threshold semantics'
);

select is(
  (
    select target_count
    from public.goals
    where id = '97000000-0000-4000-8000-000000000019'
  ),
  8,
  'bulk direct RPC preserves the supplied lifetime target'
);

select is(
  (
    select count(*)::integer
    from public.goals
    where frequency_type = 'recurring'::public.goal_frequency_type
      and target_basis = 'period'::public.goal_target_basis
      and target_count is null
      and owner_id = '97000000-0000-4000-8000-000000000011'
  ),
  0,
  'direct RPC writes leave no null recurring period target'
);

reset role;
select * from finish();
rollback;
