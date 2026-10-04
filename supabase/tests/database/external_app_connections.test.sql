begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(4);
insert into auth.users(id,email) values
 ('11111111-1111-4111-8111-111111111111','external-connection-owner@example.com'),
 ('22222222-2222-4222-8222-222222222222','external-connection-other@example.com') on conflict(id) do nothing;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
select lives_ok($$insert into public.external_app_connections(owner_id,client_id,client_name) values ('11111111-1111-4111-8111-111111111111','ce000000-0000-4000-8000-000000000001','Approved app')$$,'direct account sessions can approve an app');
select set_config('test.original_connection_at',(select connected_at::text from public.external_app_connections where client_id='ce000000-0000-4000-8000-000000000001'),true);
update public.external_app_connections set revoked_at=now() where client_id='ce000000-0000-4000-8000-000000000001';
update public.external_app_connections set revoked_at=null where client_id='ce000000-0000-4000-8000-000000000001';
select ok((select connected_at > current_setting('test.original_connection_at')::timestamptz from public.external_app_connections where client_id='ce000000-0000-4000-8000-000000000001'),'reconnection advances the activation timestamp on the database clock');
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","client_id":"ce000000-0000-4000-8000-000000000001"}',true);
select throws_ok($$insert into public.external_app_connections(owner_id,client_id,client_name) values ('11111111-1111-4111-8111-111111111111','ce000000-0000-4000-8000-000000000002','Self approval')$$,'42501',null,'OAuth credentials cannot approve a connection');
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
select is((select count(*)::integer from public.external_app_connections where owner_id='11111111-1111-4111-8111-111111111111'),0,'connection records are isolated by owner');
select * from finish();
rollback;
