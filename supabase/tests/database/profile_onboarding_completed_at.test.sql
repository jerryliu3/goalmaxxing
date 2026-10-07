begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;

select plan(3);

insert into auth.users (id, email, raw_user_meta_data)
values (
  '7c111111-1111-4111-8111-111111111111',
  'onboarding-pending@example.com',
  '{"username":"onboarding_pending","timezone":"Europe/Paris"}'::jsonb
)
on conflict (id) do nothing;

select is(
  (select onboarding_completed_at from public.profiles where id = '7c111111-1111-4111-8111-111111111111'),
  null,
  'new signups owe the required onboarding preferences step'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '7c111111-1111-4111-8111-111111111111', true);

update public.profiles
set onboarding_completed_at = now()
where id = '7c111111-1111-4111-8111-111111111111';

reset role;

select isnt(
  (select onboarding_completed_at from public.profiles where id = '7c111111-1111-4111-8111-111111111111'),
  null,
  'the owner can mark onboarding complete'
);

select is(
  (select timezone from public.profiles where id = '7c111111-1111-4111-8111-111111111111'),
  'Europe/Paris',
  'completing onboarding keeps the device timezone'
);

select * from finish();
rollback;
