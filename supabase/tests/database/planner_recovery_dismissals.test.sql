begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(8);

insert into auth.users (id, email)
values
  ('b8111111-1111-4111-8111-111111111111', 'recovery-owner@example.com'),
  ('b8222222-2222-4222-8222-222222222222', 'recovery-other@example.com')
on conflict (id) do nothing;

insert into public.profiles (id, username)
values
  ('b8111111-1111-4111-8111-111111111111', 'recovery_owner'),
  ('b8222222-2222-4222-8222-222222222222', 'recovery_other')
on conflict (id) do nothing;

insert into public.goals (
  id, owner_id, title, category, category_key, frequency_type,
  recurrence_interval, target_count, start_date, end_date
)
values
  ('b8500000-0000-4000-8000-000000000001', 'b8111111-1111-4111-8111-111111111111',
    'Run', 'Health', 'health', 'recurring', 'weekly', 3,
    current_date - 14, current_date + 30),
  ('b8500000-0000-4000-8000-000000000002', 'b8222222-2222-4222-8222-222222222222',
    'Someone else', 'Health', 'health', 'recurring', 'weekly', 3,
    current_date - 14, current_date + 30)
on conflict (id) do nothing;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b8111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  format(
    $$select public.dismiss_planner_recovery_sessions(%L::jsonb)$$,
    jsonb_build_array(
      jsonb_build_object('goal_id', 'b8500000-0000-4000-8000-000000000001', 'missed_on', current_date - 2),
      jsonb_build_object('goal_id', 'b8500000-0000-4000-8000-000000000001', 'missed_on', current_date - 3)
    )
  ),
  'owner lets several slipped sessions go in one call'
);

select lives_ok(
  format(
    $$select public.dismiss_planner_recovery_sessions(%L::jsonb)$$,
    jsonb_build_array(
      jsonb_build_object('goal_id', 'b8500000-0000-4000-8000-000000000001', 'missed_on', current_date - 2)
    )
  ),
  'letting the same session go twice is a no-op'
);

select is(
  (select count(*)::integer from public.planner_recovery_dismissals
    where goal_id = 'b8500000-0000-4000-8000-000000000001'),
  2,
  'one dismissal row per goal and missed date'
);

select throws_ok(
  format(
    $$select public.dismiss_planner_recovery_sessions(%L::jsonb)$$,
    jsonb_build_array(
      jsonb_build_object('goal_id', 'b8500000-0000-4000-8000-000000000001', 'missed_on', current_date - 4),
      jsonb_build_object('goal_id', 'b8500000-0000-4000-8000-000000000002', 'missed_on', current_date - 2)
    )
  ),
  'P0001', 'goal_not_found',
  'another user''s goal cannot be dismissed'
);

select is(
  (select count(*)::integer from public.planner_recovery_dismissals
    where missed_on = current_date - 4),
  0,
  'a rejected batch writes nothing'
);

select throws_ok(
  $$select public.dismiss_planner_recovery_sessions('[]'::jsonb)$$,
  '22023', 'invalid_recovery_dismissal',
  'an empty batch is rejected'
);

select set_config('request.jwt.claim.sub', 'b8222222-2222-4222-8222-222222222222', true);

select is(
  (select count(*)::integer from public.planner_recovery_dismissals),
  0,
  'other users cannot read dismissals'
);

reset role;
set local role anon;

select throws_ok(
  format(
    $$select public.dismiss_planner_recovery_sessions(%L::jsonb)$$,
    jsonb_build_array(
      jsonb_build_object('goal_id', 'b8500000-0000-4000-8000-000000000001', 'missed_on', current_date)
    )
  ),
  '42501', null,
  'anon cannot call dismiss_planner_recovery_sessions'
);

select * from finish();
rollback;
