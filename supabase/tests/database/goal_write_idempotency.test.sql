begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(7);

insert into auth.users (id, email)
values
  ('11111111-1111-4111-8111-111111111111', 'goal-idempotency-owner@example.com'),
  ('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeee2', 'goal-idempotency-other@example.com')
on conflict (id) do nothing;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select public.create_goal(
  p_id => '98000000-0000-4000-8000-000000000001',
  p_title => 'Deterministic goal',
  p_category => 'health',
  p_category_key => 'health',
  p_frequency_type => 'recurring',
  p_recurrence_interval => 'weekly',
  p_target_count => 2,
  p_start_date => current_date,
  p_target_basis => 'period'::public.goal_target_basis
);

select lives_ok(
  $$
    select public.create_goal(
      p_id => '98000000-0000-4000-8000-000000000001',
      p_title => 'Deterministic goal replay',
      p_category => 'health',
      p_category_key => 'health',
      p_frequency_type => 'recurring',
      p_recurrence_interval => 'weekly',
      p_target_count => 2,
      p_start_date => current_date,
      p_target_basis => 'period'::public.goal_target_basis
    )
  $$,
  'same-owner deterministic goal replay succeeds'
);

select is(
  (
    select count(*)::integer
    from public.goals
    where id = '98000000-0000-4000-8000-000000000001'
  ),
  1,
  'same-owner deterministic goal replay does not duplicate'
);

select is(
  (
    select title
    from public.goals
    where id = '98000000-0000-4000-8000-000000000001'
  ),
  'Deterministic goal',
  'same-owner deterministic goal replay does not overwrite'
);

reset role;
set local role service_role;
insert into public.goals (
  id,
  owner_id,
  title,
  category,
  category_key,
  frequency_type,
  recurrence_interval,
  target_count,
  target_basis,
  start_date
)
values (
  '98000000-0000-4000-8000-000000000002',
  'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeee2',
  'Another owner goal',
  'health',
  'health',
  'recurring',
  'weekly',
  1,
  'period'::public.goal_target_basis,
  current_date
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);
select throws_ok(
  $$
    select public.create_goal(
      p_id => '98000000-0000-4000-8000-000000000002',
      p_title => 'Unauthorized overwrite',
      p_frequency_type => 'recurring',
      p_recurrence_interval => 'weekly',
      p_target_count => 1,
      p_target_basis => 'period'::public.goal_target_basis,
      p_start_date => current_date
    )
  $$,
  '42501',
  'not authorized for goal',
  'cross-owner deterministic retry is rejected'
);

select public.create_goal(
  p_id => '98000000-0000-4000-8000-000000000003',
  p_title => 'Link source',
  p_category => 'health',
  p_category_key => 'health',
  p_frequency_type => 'recurring',
  p_recurrence_interval => 'weekly',
  p_target_count => 1,
  p_target_basis => 'period'::public.goal_target_basis,
  p_start_date => current_date
);
select public.create_goal(
  p_id => '98000000-0000-4000-8000-000000000004',
  p_title => 'Link target',
  p_category => 'health',
  p_category_key => 'health',
  p_frequency_type => 'recurring',
  p_recurrence_interval => 'weekly',
  p_target_count => 1,
  p_target_basis => 'period'::public.goal_target_basis,
  p_start_date => current_date
);

select lives_ok(
  $$
    select public.create_goal_links(
      jsonb_build_array(
        jsonb_build_object(
          'source_goal_id', '98000000-0000-4000-8000-000000000003',
          'target_goal_id', '98000000-0000-4000-8000-000000000004'
        )
      )
    )
  $$,
  'first deterministic link write succeeds'
);

select lives_ok(
  $$
    select public.create_goal_links(
      jsonb_build_array(
        jsonb_build_object(
          'source_goal_id', '98000000-0000-4000-8000-000000000003',
          'target_goal_id', '98000000-0000-4000-8000-000000000004'
        )
      )
    )
  $$,
  'exact deterministic link replay succeeds'
);

select is(
  (
    select count(*)::integer
    from public.goal_links
    where source_goal_id = '98000000-0000-4000-8000-000000000003'
      and target_goal_id = '98000000-0000-4000-8000-000000000004'
  ),
  1,
  'exact deterministic link replay does not duplicate'
);

reset role;
select * from finish();
rollback;
