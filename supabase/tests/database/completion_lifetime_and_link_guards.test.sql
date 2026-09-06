begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(17);

insert into auth.users (id, email)
values ('11111111-1111-4111-8111-111111111111', 'completion-invariants-alice@example.com')
on conflict (id) do nothing;

insert into public.profiles (id, username, timezone)
values ('11111111-1111-4111-8111-111111111111', 'completion_invariants_alice', 'UTC')
on conflict (id) do update
set timezone = excluded.timezone;

set local role service_role;

insert into public.goals (
  id,
  owner_id,
  title,
  description,
  category,
  color,
  frequency_type,
  recurrence_interval,
  target_count,
  start_date,
  end_date
)
values
  (
    'c0500000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'Invariant source',
    null,
    'health',
    '#10b981',
    'recurring',
    'weekly',
    3,
    current_date - 30,
    current_date + 30
  ),
  (
    'c0500000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    'Invariant target',
    null,
    'health',
    '#10b981',
    'recurring',
    'weekly',
    3,
    current_date - 30,
    current_date + 30
  ),
  (
    'c0500000-0000-4000-8000-000000000003',
    '11111111-1111-4111-8111-111111111111',
    'Ended source',
    null,
    'health',
    '#10b981',
    'recurring',
    'weekly',
    3,
    current_date - 30,
    current_date - 1
  ),
  (
    'c0500000-0000-4000-8000-000000000004',
    '11111111-1111-4111-8111-111111111111',
    'Resumed target',
    null,
    'health',
    '#10b981',
    'recurring',
    'weekly',
    3,
    current_date - 30,
    current_date + 30
  ),
  (
    'c0500000-0000-4000-8000-000000000005',
    '11111111-1111-4111-8111-111111111111',
    'Lifetime window',
    null,
    'health',
    '#10b981',
    'recurring',
    'weekly',
    3,
    current_date - 7,
    current_date - 1
  ),
  (
    'c0500000-0000-4000-8000-000000000006',
    '11111111-1111-4111-8111-111111111111',
    'Grandparent source',
    null,
    'health',
    '#10b981',
    'recurring',
    'weekly',
    3,
    current_date - 30,
    current_date + 30
  ),
  (
    'c0500000-0000-4000-8000-000000000007',
    '11111111-1111-4111-8111-111111111111',
    'Deleted intermediate',
    null,
    'health',
    '#10b981',
    'recurring',
    'weekly',
    3,
    current_date - 30,
    current_date + 30
  ),
  (
    'c0500000-0000-4000-8000-000000000008',
    '11111111-1111-4111-8111-111111111111',
    'Transitive leaf',
    null,
    'health',
    '#10b981',
    'recurring',
    'weekly',
    3,
    current_date - 30,
    current_date + 30
  ),
  (
    'c0500000-0000-4000-8000-000000000009',
    '11111111-1111-4111-8111-111111111111',
    'Indefinite source',
    null,
    'health',
    '#10b981',
    'recurring',
    'weekly',
    3,
    current_date - 30,
    null
  ),
  (
    'c0500000-0000-4000-8000-00000000000a',
    '11111111-1111-4111-8111-111111111111',
    'Indefinite target',
    null,
    'health',
    '#10b981',
    'recurring',
    'weekly',
    3,
    current_date - 30,
    current_date + 30
  ),
  (
    'c0500000-0000-4000-8000-00000000000c',
    '11111111-1111-4111-8111-111111111111',
    'External source',
    null,
    'health',
    '#10b981',
    'recurring',
    'weekly',
    3,
    current_date - 30,
    current_date + 30
  ),
  (
    'c0500000-0000-4000-8000-00000000000d',
    '11111111-1111-4111-8111-111111111111',
    'External target',
    null,
    'health',
    '#10b981',
    'recurring',
    'weekly',
    3,
    current_date - 30,
    current_date + 30
  )
on conflict (id) do update
set
  owner_id = excluded.owner_id,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  is_deleted = false,
  archived_at = null;

update public.goals
set is_deleted = true
where id = 'c0500000-0000-4000-8000-000000000007';

insert into public.goal_links (id, owner_id, source_goal_id, target_goal_id)
values
  (
    'c0510000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'c0500000-0000-4000-8000-000000000001',
    'c0500000-0000-4000-8000-000000000002'
  ),
  (
    'c0510000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    'c0500000-0000-4000-8000-000000000003',
    'c0500000-0000-4000-8000-000000000004'
  ),
  (
    'c0510000-0000-4000-8000-000000000003',
    '11111111-1111-4111-8111-111111111111',
    'c0500000-0000-4000-8000-000000000006',
    'c0500000-0000-4000-8000-000000000007'
  ),
  (
    'c0510000-0000-4000-8000-000000000004',
    '11111111-1111-4111-8111-111111111111',
    'c0500000-0000-4000-8000-000000000007',
    'c0500000-0000-4000-8000-000000000008'
  ),
  (
    'c0510000-0000-4000-8000-000000000005',
    '11111111-1111-4111-8111-111111111111',
    'c0500000-0000-4000-8000-000000000009',
    'c0500000-0000-4000-8000-00000000000a'
  ),
  (
    'c0510000-0000-4000-8000-000000000006',
    '11111111-1111-4111-8111-111111111111',
    'c0500000-0000-4000-8000-00000000000c',
    'c0500000-0000-4000-8000-00000000000d'
  )
on conflict (source_goal_id, target_goal_id) do update
set
  id = excluded.id,
  owner_id = excluded.owner_id;

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select ok(
  not exists (
    select 1
    from pg_proc as proc
    inner join pg_namespace as nsp on nsp.oid = proc.pronamespace
    where nsp.nspname = 'private'
      and proc.proname = 'raise_if_linked_target_completion_disallowed'
  ),
  'linked-target completion write guard is not installed'
);

select lives_ok(
  $tap$
    select public.mark_goal_complete(
      'c0500000-0000-4000-8000-000000000002',
      current_date
    );
  $tap$,
  'direct completion of a linked target is allowed'
);

select is(
  (
    select count(*)
    from public.completions
    where goal_id = 'c0500000-0000-4000-8000-000000000002'
      and user_id = '11111111-1111-4111-8111-111111111111'
      and completed_on = current_date
      and source = 'manual'
  ),
  1::bigint,
  'direct linked-target completion writes a manual completion fact'
);

select lives_ok(
  $tap$
    select public.mark_goal_complete(
      'c0500000-0000-4000-8000-000000000001',
      current_date
    );
  $tap$,
  'source completion remains allowed'
);

select is(
  (
    select count(*)
    from public.completions
    where goal_id = 'c0500000-0000-4000-8000-000000000002'
      and user_id = '11111111-1111-4111-8111-111111111111'
      and completed_on = current_date
      and source in ('manual', 'linked_cascade')
  ),
  1::bigint,
  'linked target has one completion fact after direct and cascaded writes'
);

select lives_ok(
  $tap$
    select public.unmark_goal_complete(
      'c0500000-0000-4000-8000-000000000002',
      current_date
    );
  $tap$,
  'unmark remains allowed on a suppressed linked target'
);

select throws_ok(
  $tap$
    select public.mark_goal_complete(
      'c0500000-0000-4000-8000-000000000005',
      current_date - 8
    );
  $tap$,
  '23514',
  'completion_outside_goal_lifetime',
  'completions before start_date are rejected'
);

select throws_ok(
  $tap$
    select public.mark_goal_complete(
      'c0500000-0000-4000-8000-000000000005',
      current_date
    );
  $tap$,
  '23514',
  'completion_outside_goal_lifetime',
  'completions after stored end_date are rejected'
);

select lives_ok(
  $tap$
    select public.mark_goal_complete(
      'c0500000-0000-4000-8000-000000000005',
      current_date - 7
    );
  $tap$,
  'completions on start_date remain allowed'
);

select lives_ok(
  $tap$
    select public.mark_goal_complete(
      'c0500000-0000-4000-8000-000000000004',
      current_date
    );
  $tap$,
  'linked targets are completable after the source end_date'
);

select lives_ok(
  $tap$
    select public.mark_goal_complete(
      'c0500000-0000-4000-8000-000000000008',
      current_date
    );
  $tap$,
  'transitive ancestry no longer blocks direct linked-target completion'
);

select lives_ok(
  $tap$
    select public.mark_goal_complete(
      'c0500000-0000-4000-8000-00000000000a',
      current_date
    );
  $tap$,
  'indefinite ancestry no longer blocks direct linked-target completion'
);

select ok(
  public.apply_external_completion_service(
    'c0500000-0000-4000-8000-00000000000d',
    current_date - 1,
    current_date,
    'invariant:suppressed-target'
  ),
  'external sync can complete linked targets directly when date is allowed'
);

select is(
  (
    select count(*)
    from public.completions
    where goal_id = 'c0500000-0000-4000-8000-00000000000d'
      and user_id = '11111111-1111-4111-8111-111111111111'
      and completed_on = current_date - 1
      and source = 'external_sync'
  ),
  1::bigint,
  'direct external sync write for linked target is recorded'
);

select ok(
  public.apply_external_completion_service(
    'c0500000-0000-4000-8000-00000000000d',
    current_date,
    current_date,
    'invariant:suppressed-target-duplicate'
  ),
  'external sync can also write linked target on local today'
);

select ok(
  public.apply_external_completion_service(
    'c0500000-0000-4000-8000-00000000000c',
    current_date,
    current_date,
    'invariant:source'
  ),
  'external sync still completes a source and cascades'
);

select is(
  (
    select count(*)
    from public.completions
    where goal_id = 'c0500000-0000-4000-8000-00000000000d'
      and user_id = '11111111-1111-4111-8111-111111111111'
      and completed_on = current_date
      and source = 'linked_cascade'
  ),
  1::bigint,
  'external source completion still cascades onto the linked target'
);

reset role;
select * from finish();
rollback;
