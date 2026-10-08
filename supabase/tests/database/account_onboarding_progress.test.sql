begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(12);
insert into auth.users (id, email, raw_user_meta_data) values
('7c222222-2222-4222-8222-222222222222', 'setup-practice@example.com', '{"username":"setup_practice"}'::jsonb),
('7c333333-3333-4333-8333-333333333333', 'setup-other@example.com', '{"username":"setup_other"}'::jsonb);
set local role authenticated;
select set_config('request.jwt.claim.sub', '7c222222-2222-4222-8222-222222222222', true);
select throws_ok($$select public.update_onboarding_progress('complete')$$, 'P0001', 'ONBOARDING_SETUP_INCOMPLETE', 'cannot finish before practice');
select throws_ok($$select public.update_onboarding_progress('advance', 3)$$, 'P0001', 'ONBOARDING_SETUP_INCOMPLETE', 'cannot skip practice steps');
select is(public.update_onboarding_progress('advance', 1)->>'setup_step', '1', 'preferences advance to hold practice');
select is(public.update_onboarding_progress('advance', 2)->>'setup_step', '2', 'hold advances to movement');
select is(public.update_onboarding_progress('advance', 1)->>'setup_step', '2', 'stale advance never regresses');
select throws_ok($$select public.update_onboarding_progress('tour', null, 'app.tabs', 'skipped')$$, 'P0001', 'ONBOARDING_SETUP_INCOMPLETE', 'tours cannot bypass setup');
select public.update_onboarding_progress('advance', 3);
select isnt(public.update_onboarding_progress('complete')->>'completed_at', null, 'Done persists completion');
-- Compare timestamps, independent of the JSON/text timezone serialization.
select is((public.update_onboarding_progress('complete')->>'completed_at')::timestamptz,
  (select onboarding_completed_at from public.profiles where id = auth.uid()), 'repeated Done retains the original completion');
select public.update_onboarding_progress('tour', null, 'app.tabs', 'complete');
select is(public.update_onboarding_progress('skip-tours')->'tours'->>'app.tabs', 'complete', 'skip-all preserves completed tours');
select is(public.update_onboarding_progress('skip-tours')->'tours'->>'planner.calendar', 'skipped', 'skip-all acknowledges pending tours');
select throws_ok($$update public.user_onboarding_progress set setup_step = 0$$, '42501', 'permission denied for table user_onboarding_progress', 'no direct reset or parallel write surface');
select set_config('request.jwt.claim.sub', '7c333333-3333-4333-8333-333333333333', true);
select is((select count(*) from public.user_onboarding_progress), 0::bigint, 'another account cannot read practice or tour progress');
reset role;
select * from finish();
rollback;
