begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(6);

insert into auth.users (id, email)
values
  ('af111111-1111-4111-8111-111111111111', 'challenge-rank-viewer@example.com'),
  ('af222222-2222-4222-8222-222222222222', 'challenge-rank-leader@example.com'),
  ('af333333-3333-4333-8333-333333333333', 'challenge-rank-hidden@example.com'),
  ('af444444-4444-4444-8444-444444444444', 'challenge-rank-outsider@example.com')
on conflict (id) do nothing;

insert into public.profiles (
  id,
  username,
  display_name,
  social_activity_visible
)
values
  (
    'af111111-1111-4111-8111-111111111111',
    'challenge_rank_viewer',
    'Viewer',
    true
  ),
  (
    'af222222-2222-4222-8222-222222222222',
    'challenge_rank_leader',
    'Leader',
    true
  ),
  (
    'af333333-3333-4333-8333-333333333333',
    'challenge_rank_hidden',
    'Hidden',
    false
  ),
  (
    'af444444-4444-4444-8444-444444444444',
    'challenge_rank_outsider',
    'Outsider',
    true
  )
on conflict (id) do update
set
  display_name = excluded.display_name,
  social_activity_visible = excluded.social_activity_visible;

set local role service_role;

insert into public.challenges (
  id,
  slug,
  title,
  status,
  subject_kind,
  metric,
  target_value,
  starts_at,
  ends_at,
  reward_xp,
  audience_kind
)
values (
  'af500000-0000-4000-8000-000000000001',
  'challenge-standings-test',
  'Challenge standings test',
  'active',
  'user',
  'completions_count',
  10,
  pg_catalog.now() - interval '1 day',
  pg_catalog.now() + interval '7 days',
  25,
  'global'
)
on conflict (id) do nothing;

insert into public.challenge_participants (
  challenge_id,
  subject_kind,
  subject_id,
  joined_at,
  progress_value,
  progress_at
)
values
  (
    'af500000-0000-4000-8000-000000000001',
    'user',
    'af111111-1111-4111-8111-111111111111',
    pg_catalog.now() - interval '3 hours',
    5,
    pg_catalog.now() - interval '1 hour'
  ),
  (
    'af500000-0000-4000-8000-000000000001',
    'user',
    'af222222-2222-4222-8222-222222222222',
    pg_catalog.now() - interval '4 hours',
    8,
    pg_catalog.now() - interval '2 hours'
  ),
  (
    'af500000-0000-4000-8000-000000000001',
    'user',
    'af333333-3333-4333-8333-333333333333',
    pg_catalog.now() - interval '2 hours',
    2,
    pg_catalog.now() - interval '30 minutes'
  )
on conflict (challenge_id, subject_kind, subject_id) do update
set
  progress_value = excluded.progress_value,
  progress_at = excluded.progress_at;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claim.sub',
  'af444444-4444-4444-8444-444444444444',
  true
);

select throws_ok(
  $$
    select * from public.get_challenge_standings(
      'af500000-0000-4000-8000-000000000001'
    );
  $$,
  '42501',
  'challenge_join_required',
  'a non-participant cannot inspect challenge standings'
);

select set_config(
  'request.jwt.claim.sub',
  'af111111-1111-4111-8111-111111111111',
  true
);

select is(
  (
    select count(*)::integer
    from public.get_challenge_standings(
      'af500000-0000-4000-8000-000000000001'
    )
  ),
  2,
  'standings include visible participants and exclude hidden participants'
);

select is(
  (
    select display_name
    from public.get_challenge_standings(
      'af500000-0000-4000-8000-000000000001'
    )
    order by rank
    limit 1
  ),
  'Leader',
  'standings are sorted by descending challenge progress'
);

select is(
  (
    select rank
    from public.get_challenge_standings(
      'af500000-0000-4000-8000-000000000001'
    )
    where is_viewer
  ),
  2,
  'the viewer row carries its real rank'
);

select is(
  (
    select total_count
    from public.get_challenge_standings(
      'af500000-0000-4000-8000-000000000001'
    )
    limit 1
  ),
  2,
  'each page reports the visible participant count'
);

select is(
  (
    select display_name
    from public.get_challenge_standings(
      'af500000-0000-4000-8000-000000000001',
      1,
      1
    )
  ),
  'Viewer',
  'standings support loading later pages'
);

select * from finish();
rollback;
