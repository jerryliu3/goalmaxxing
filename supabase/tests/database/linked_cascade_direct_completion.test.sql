begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(8);

insert into auth.users (id, email)
values ('11111111-1111-4111-8111-111111111111', 'cascade-direct-alice@example.com')
on conflict (id) do nothing;

insert into public.profiles (id, username, timezone)
values ('11111111-1111-4111-8111-111111111111', 'cascade_direct_alice', 'UTC')
on conflict (id) do update
set timezone = excluded.timezone;

set local role service_role;

insert into public.goals (
  id,
  owner_id,
  title,
  category,
  color,
  frequency_type,
  recurrence_interval,
  target_count,
  start_date,
  end_date
)
values
  (
    'c1197000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'Cascade source',
    'health',
    '#10b981',
    'recurring',
    'daily',
    1,
    current_date - 7,
    current_date + 30
  ),
  (
    'c1197000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    'Direct target',
    'health',
    '#10b981',
    'recurring',
    'daily',
    1,
    current_date - 7,
    current_date + 30
  ),
  (
    'c1197000-0000-4000-8000-000000000003',
    '11111111-1111-4111-8111-111111111111',
    'Future target',
    'health',
    '#10b981',
    'recurring',
    'daily',
    1,
    current_date + 7,
    current_date + 30
  ),
  (
    'c1197000-0000-4000-8000-000000000004',
    '11111111-1111-4111-8111-111111111111',
    'Paused middle',
    'health',
    '#10b981',
    'recurring',
    'daily',
    1,
    current_date + 7,
    current_date + 30
  ),
  (
    'c1197000-0000-4000-8000-000000000005',
    '11111111-1111-4111-8111-111111111111',
    'Active grandchild',
    'health',
    '#10b981',
    'recurring',
    'daily',
    1,
    current_date - 7,
    current_date + 30
  );

insert into public.goal_links (id, owner_id, source_goal_id, target_goal_id)
values
  (
    'c1197100-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'c1197000-0000-4000-8000-000000000001',
    'c1197000-0000-4000-8000-000000000002'
  ),
  (
    'c1197100-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    'c1197000-0000-4000-8000-000000000001',
    'c1197000-0000-4000-8000-000000000003'
  ),
  (
    'c1197100-0000-4000-8000-000000000003',
    '11111111-1111-4111-8111-111111111111',
    'c1197000-0000-4000-8000-000000000001',
    'c1197000-0000-4000-8000-000000000004'
  ),
  (
    'c1197100-0000-4000-8000-000000000004',
    '11111111-1111-4111-8111-111111111111',
    'c1197000-0000-4000-8000-000000000004',
    'c1197000-0000-4000-8000-000000000005'
  );

insert into public.completions (goal_id, user_id, completed_on, source)
values (
  'c1197000-0000-4000-8000-000000000002',
  '11111111-1111-4111-8111-111111111111',
  current_date,
  'manual'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$ select public.mark_goal_complete('c1197000-0000-4000-8000-000000000001', current_date) $$,
  'completing the source cascades onto active targets'
);

select results_eq(
  $$
    select source::text
    from public.completions
    where goal_id = 'c1197000-0000-4000-8000-000000000002'
      and completed_on = current_date
  $$,
  $$ select 'manual'::text $$,
  'an existing direct target completion is not overwritten by the cascade'
);

select is_empty(
  $$
    select 1
    from public.completions
    where goal_id = 'c1197000-0000-4000-8000-000000000003'
      and completed_on = current_date
  $$,
  'a target that has not started does not receive a cascade row'
);

select is_empty(
  $$
    select 1
    from public.completions
    where goal_id = 'c1197000-0000-4000-8000-000000000004'
      and completed_on = current_date
  $$,
  'a paused middle goal does not receive a cascade row'
);

select results_eq(
  $$
    select source::text
    from public.completions
    where goal_id = 'c1197000-0000-4000-8000-000000000005'
      and completed_on = current_date
  $$,
  $$ select 'linked_cascade'::text $$,
  'an active grandchild still receives credit through a paused middle goal'
);

select lives_ok(
  $$ select public.unmark_goal_complete('c1197000-0000-4000-8000-000000000001', current_date) $$,
  'undoing the source removes only the credits this cascade wrote'
);

select is_empty(
  $$
    select 1
    from public.completions
    where goal_id in (
      'c1197000-0000-4000-8000-000000000001',
      'c1197000-0000-4000-8000-000000000005'
    )
      and completed_on = current_date
  $$,
  'the source and its cascade grandchild are cleared'
);

select results_eq(
  $$
    select source::text
    from public.completions
    where goal_id = 'c1197000-0000-4000-8000-000000000002'
      and completed_on = current_date
  $$,
  $$ select 'manual'::text $$,
  'undoing the source keeps the target completion the user made'
);

select * from finish();
rollback;
