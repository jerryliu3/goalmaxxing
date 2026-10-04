begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(9);
insert into auth.users(id, email) values
 ('11111111-1111-4111-8111-111111111111', 'external-owner@example.com'),
 ('22222222-2222-4222-8222-222222222222', 'external-other@example.com') on conflict(id) do nothing;
insert into public.profiles(id, username) values ('11111111-1111-4111-8111-111111111111', 'external_mutation_owner') on conflict(id) do nothing;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select set_config('test.goal_payload', jsonb_build_object('title','External goal','category','Personal','category_key','personal','frequency_type','recurring','recurrence_interval','weekly','target_count',2,'target_basis','period','start_date',current_date,'is_private',true,'difficulty','medium')::text, true);
select lives_ok($$select public.external_account_mutation('ee000000-0000-4000-8000-000000000001','create_goal',current_setting('test.goal_payload')::jsonb)$$, 'canonical creation succeeds');
select is(
 public.external_account_mutation('ee000000-0000-4000-8000-000000000001','create_goal',current_setting('test.goal_payload')::jsonb),
 public.external_account_mutation('ee000000-0000-4000-8000-000000000001','create_goal',current_setting('test.goal_payload')::jsonb),
 'an identical retry returns the original receipt');
select is((select count(*)::integer from public.goals where id='ee000000-0000-4000-8000-000000000001'),1,'retries do not duplicate goals');
select throws_ok($$select public.external_account_mutation('ee000000-0000-4000-8000-000000000001','create_goal',current_setting('test.goal_payload')::jsonb || '{"title":"Changed"}')$$,'22023','idempotency_conflict','changed input cannot reuse a receipt');
select throws_ok($$select public.external_account_mutation('ee000000-0000-4000-8000-000000000002','set_goal_archived','{"goal_id":"ee000000-0000-4000-8000-000000000001","expected_updated_at":"1970-01-01T00:00:00Z","archived":true}')$$,'40001','stale_goal','stale edits cannot archive a goal');
select set_config('test.task_payload',jsonb_build_object('title','External retry task','scheduled_date',current_date)::text,true);
select is(public.external_account_mutation('ee000000-0000-4000-8000-000000000003','create_task',current_setting('test.task_payload')::jsonb),public.external_account_mutation('ee000000-0000-4000-8000-000000000003','create_task',current_setting('test.task_payload')::jsonb),'task retries return the same task');
select is((select count(*)::integer from public.planner_tasks where title='External retry task' and owner_id='11111111-1111-4111-8111-111111111111'),1,'task retries do not duplicate tasks');
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select throws_ok($$select public.external_account_mutation('ee000000-0000-4000-8000-000000000004','set_goal_archived','{"goal_id":"ee000000-0000-4000-8000-000000000001","expected_updated_at":"1970-01-01T00:00:00Z","archived":true}')$$,'P0002','goal_not_found','cross-account writes do not reveal or edit goals');
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","client_id":"33333333-3333-4333-8333-333333333333"}', true);
select throws_ok($$insert into public.external_app_connections(owner_id,client_id,client_name) values ('11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333','Self approval')$$,'42501',null,'an OAuth app cannot approve its own account connection');
select * from finish();
rollback;
