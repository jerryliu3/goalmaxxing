begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, private, extensions, pg_catalog;
select plan(5);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select public.create_goal(
  'c4100000-0000-4000-8000-000000000001',
  'Async XP outbox goal',
  null,
  null,
  'health',
  'health',
  '#10b981',
  'recurring',
  'daily',
  null,
  null,
  current_date - 7,
  null,
  null,
  null
);

select public.mark_goal_complete(
  'c4100000-0000-4000-8000-000000000001',
  current_date
);

select is(
  (
    select coalesce(sum(l.xp_delta), 0)::integer
    from public.xp_ledger l
    where l.user_id = '11111111-1111-4111-8111-111111111111'
      and l.goal_id = 'c4100000-0000-4000-8000-000000000001'
  ),
  0,
  'completion write does not apply XP in the same statement'
);

reset role;

select is(
  (
    select count(*)::integer
    from private.xp_recompute_outbox q
    where q.user_id = '11111111-1111-4111-8111-111111111111'
      and q.goal_id = 'c4100000-0000-4000-8000-000000000001'
  ),
  1,
  'completion write enqueues XP recompute'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

create temp table xp_preview on commit drop as
  select public.preview_queued_xp_delta() as delta;

select is(
  public.drain_xp_recompute_outbox(10),
  1,
  'drain applies one queued XP recompute'
);

select is(
  (
    select coalesce(sum(l.xp_delta), 0)::integer
    from public.xp_ledger l
    where l.user_id = '11111111-1111-4111-8111-111111111111'
      and l.goal_id = 'c4100000-0000-4000-8000-000000000001'
  ),
  (select delta from xp_preview),
  'drain writes the previewed ledger delta'
);

select is(
  public.preview_queued_xp_delta(),
  0,
  'preview is empty after drain'
);

select * from finish();
rollback;
