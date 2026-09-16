begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, private, extensions, pg_catalog;
select plan(8);

insert into auth.users (id, email)
values
  ('a1111111-1111-4111-8111-111111111111', 'digest-owner@example.com'),
  ('a2222222-2222-4222-8222-222222222222', 'digest-other@example.com')
on conflict (id) do nothing;

insert into public.profiles (id, username, timezone)
values
  ('a1111111-1111-4111-8111-111111111111', 'digest_owner', 'UTC'),
  ('a2222222-2222-4222-8222-222222222222', 'digest_other', 'UTC')
on conflict (id) do update
set timezone = excluded.timezone;

select is(
  (
    select digest_auto_show
    from public.profiles
    where id = 'a1111111-1111-4111-8111-111111111111'
  ),
  true,
  'new profiles default digest auto-show on'
);

select results_eq(
  $$
    select allowed, request_count, remaining
    from public.consume_planner_ai_quota(
      'a1111111-1111-4111-8111-111111111111',
      'digest',
      4,
      3
    )
  $$,
  $$ values (true, 1, 3) $$,
  'digest is a valid planner AI quota feature'
);

select throws_ok(
  $$
    select *
    from public.consume_planner_ai_quota(
      'a1111111-1111-4111-8111-111111111111',
      'not_a_feature',
      4,
      0
    )
  $$,
  '22023'::character(5),
  'unknown planner AI quota feature',
  'unknown quota features are still rejected'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'a1111111-1111-4111-8111-111111111111',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

insert into public.user_digests (owner_id, kind, period_key, facts)
values (
  'a1111111-1111-4111-8111-111111111111',
  'daily',
  '2026-09-06',
  '{"placed":1}'::jsonb
);

select is(
  (
    select count(*)::int
    from public.user_digests
    where owner_id = 'a1111111-1111-4111-8111-111111111111'
  ),
  1,
  'owners can insert their own digest rows'
);

update public.user_digests
set acknowledged_at = timezone('utc', now())
where owner_id = 'a1111111-1111-4111-8111-111111111111'
  and kind = 'daily'
  and period_key = '2026-09-06';

select ok(
  (
    select acknowledged_at is not null
    from public.user_digests
    where owner_id = 'a1111111-1111-4111-8111-111111111111'
      and kind = 'daily'
      and period_key = '2026-09-06'
  ),
  'owners can acknowledge their digest'
);

select is(
  (
    select count(*)::int
    from public.user_digests
    where owner_id = 'a2222222-2222-4222-8222-222222222222'
  ),
  0,
  'owners cannot read another user digest'
);

select throws_ok(
  $$
    insert into public.user_digests (owner_id, kind, period_key)
    values (
      'a2222222-2222-4222-8222-222222222222',
      'daily',
      '2026-09-06'
    )
  $$,
  '42501'::character(5),
  'new row violates row-level security policy for table "user_digests"',
  'owners cannot insert a digest for another user'
);

reset role;

select throws_ok(
  $$
    insert into public.user_digests (owner_id, kind, period_key)
    values (
      'a1111111-1111-4111-8111-111111111111',
      'monthly',
      '2026-09-01'
    )
  $$,
  '23514'::character(5),
  'new row for relation "user_digests" violates check constraint "user_digests_kind_check"',
  'digest kind is daily or weekly'
);

select * from finish();
rollback;
