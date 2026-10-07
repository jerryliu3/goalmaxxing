begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;

select plan(4);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '7b111111-1111-4111-8111-111111111111',
    'device-timezone@example.com',
    '{"username":"device_tz","timezone":"America/New_York"}'::jsonb
  ),
  (
    '7b222222-2222-4222-8222-222222222222',
    'missing-timezone@example.com',
    '{"username":"missing_tz"}'::jsonb
  )
on conflict (id) do nothing;

select is(
  (select timezone from public.profiles where id = '7b111111-1111-4111-8111-111111111111'),
  'America/New_York',
  'signup stores the device timezone'
);

select isnt(
  (select timezone_confirmed_at from public.profiles where id = '7b111111-1111-4111-8111-111111111111'),
  null,
  'signup confirms the device timezone without a separate save'
);

select is(
  (select timezone from public.profiles where id = '7b222222-2222-4222-8222-222222222222'),
  'UTC',
  'signup without a device timezone falls back to UTC'
);

select isnt(
  (select timezone_confirmed_at from public.profiles where id = '7b222222-2222-4222-8222-222222222222'),
  null,
  'the UTC fallback is confirmed and remains editable in preferences'
);

select * from finish();
rollback;
