begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(15);

insert into auth.users (id, email)
values
  ('b7111111-1111-4111-8111-111111111111', 'showcase-owner@example.com'),
  ('b7222222-2222-4222-8222-222222222222', 'showcase-other@example.com')
on conflict (id) do nothing;

insert into public.profiles (id, username)
values
  ('b7111111-1111-4111-8111-111111111111', 'showcase_owner'),
  ('b7222222-2222-4222-8222-222222222222', 'showcase_other')
on conflict (id) do nothing;

insert into public.goals (
  id, owner_id, title, category, category_key, frequency_type,
  recurrence_interval, target_count, start_date, end_date, is_private
)
values
  ('b7500000-0000-4000-8000-000000000001', 'b7111111-1111-4111-8111-111111111111',
    'Public run', 'Health', 'health', 'recurring', 'weekly', 2,
    current_date - 7, current_date + 30, false),
  ('b7500000-0000-4000-8000-000000000002', 'b7111111-1111-4111-8111-111111111111',
    'Private journal', 'Health', 'health', 'recurring', 'weekly', 2,
    current_date - 7, current_date + 30, true),
  ('b7500000-0000-4000-8000-000000000003', 'b7222222-2222-4222-8222-222222222222',
    'Someone else', 'Health', 'health', 'recurring', 'weekly', 2,
    current_date - 7, current_date + 30, false)
on conflict (id) do nothing;

insert into public.user_awards (id, user_id, reward_id)
select 'b7600000-0000-4000-8000-000000000001',
  'b7111111-1111-4111-8111-111111111111',
  reward.id
from public.xp_rewards reward
order by reward.level
limit 1
on conflict do nothing;

select is(
  (select featured_on_profile from public.goals
    where id = 'b7500000-0000-4000-8000-000000000001'),
  true,
  'goals are featured on the profile by default'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b7111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$select public.update_public_profile(
    '  Running toward a spring half.  ',
    '[{"kind":"goal","ref":"b7500000-0000-4000-8000-000000000001"},
      {"kind":"medal","ref":"b7600000-0000-4000-8000-000000000001"},
      {"kind":"record","ref":"rec-streak"}]'::jsonb,
    '{}'::uuid[],
    array['b7500000-0000-4000-8000-000000000001']::uuid[]
  )$$,
  'owner saves bio, pins, and featured goals in one call'
);

select is(
  (select bio from public.profiles where id = 'b7111111-1111-4111-8111-111111111111'),
  'Running toward a spring half.',
  'bio is trimmed'
);

select results_eq(
  $$select slot::integer, kind, ref from public.profile_showcase_pins order by slot$$,
  $$values
    (1, 'goal', 'b7500000-0000-4000-8000-000000000001'),
    (2, 'medal', 'b7600000-0000-4000-8000-000000000001'),
    (3, 'record', 'rec-streak')$$,
  'pins keep the order they were given'
);

select is(
  (select featured_on_profile from public.goals
    where id = 'b7500000-0000-4000-8000-000000000001'),
  false,
  'hidden goals stop being featured'
);

select throws_ok(
  $$select public.update_public_profile(repeat('a', 141), '[]'::jsonb, '{}', '{}')$$,
  '22023', 'bio_too_long',
  'bio longer than 140 characters is rejected'
);

select throws_ok(
  $$select public.update_public_profile(null,
    '[{"kind":"record","ref":"rec-streak"},{"kind":"record","ref":"rec-week"},
      {"kind":"record","ref":"rec-goals"},{"kind":"record","ref":"rec-level"}]'::jsonb,
    '{}', '{}')$$,
  '22023', 'invalid_showcase_pins',
  'more than three records is rejected'
);

select throws_ok(
  $$select public.update_public_profile(null,
    '[{"kind":"goal","ref":"b7500000-0000-4000-8000-0000000000a1"},
      {"kind":"goal","ref":"b7500000-0000-4000-8000-0000000000a2"},
      {"kind":"goal","ref":"b7500000-0000-4000-8000-0000000000a3"},
      {"kind":"medal","ref":"b7600000-0000-4000-8000-000000000001"}]'::jsonb,
    '{}', '{}')$$,
  '22023', 'invalid_showcase_pins',
  'more than three medals or goals is rejected'
);

select lives_ok(
  $$select public.update_public_profile(null,
    '[{"kind":"record","ref":"rec-streak"},{"kind":"record","ref":"rec-week"},
      {"kind":"record","ref":"rec-goals"},
      {"kind":"goal","ref":"b7500000-0000-4000-8000-000000000001"},
      {"kind":"medal","ref":"b7600000-0000-4000-8000-000000000001"}]'::jsonb,
    '{}', '{}')$$,
  'three card records save alongside the showcase pins'
);

select throws_ok(
  $$select public.update_public_profile(null,
    '[{"kind":"goal","ref":"b7500000-0000-4000-8000-000000000002"}]'::jsonb, '{}', '{}')$$,
  '22023', 'invalid_showcase_pin',
  'a private goal cannot be pinned'
);

select throws_ok(
  $$select public.update_public_profile(null,
    '[{"kind":"goal","ref":"b7500000-0000-4000-8000-000000000003"}]'::jsonb, '{}', '{}')$$,
  '22023', 'invalid_showcase_pin',
  'another user''s goal cannot be pinned'
);

select throws_ok(
  $$select public.update_public_profile(null, '[]'::jsonb,
    array['b7500000-0000-4000-8000-000000000002']::uuid[], '{}')$$,
  '22023', 'private_goal_not_featurable',
  'a private goal cannot be featured'
);

select throws_ok(
  $$select public.update_public_profile(null, '[]'::jsonb,
    '{}', array['b7500000-0000-4000-8000-000000000003']::uuid[])$$,
  'P0001', 'goal_not_found',
  'another user''s goal cannot be hidden'
);

select set_config('request.jwt.claim.sub', 'b7222222-2222-4222-8222-222222222222', true);

select is(
  (select count(*)::integer from public.profile_showcase_pins
    where user_id = 'b7111111-1111-4111-8111-111111111111'),
  0,
  'other users cannot read pins directly'
);

reset role;
set local role anon;

select throws_ok(
  $$select public.update_public_profile(null, '[]'::jsonb, '{}', '{}')$$,
  '42501', null,
  'anon cannot call update_public_profile'
);

select * from finish();
rollback;
