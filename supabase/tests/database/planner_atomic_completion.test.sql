begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(7);

insert into auth.users (id, email)
values (
  'c1000000-0000-4000-8000-000000000001',
  'planner-atomic-completion@example.com'
)
on conflict (id) do nothing;

insert into public.profiles (id, username, timezone)
values (
  'c1000000-0000-4000-8000-000000000001',
  'planner_atomic_completion',
  'UTC'
)
on conflict (id) do update set timezone = excluded.timezone;

set local role service_role;

insert into public.goals (
  id,
  owner_id,
  title,
  category,
  frequency_type,
  recurrence_interval,
  target_count,
  target_basis,
  start_date,
  end_date
)
values (
  'c2000000-0000-4000-8000-000000000001',
  'c1000000-0000-4000-8000-000000000001',
  'Atomic planner completion',
  'test',
  'recurring',
  'weekly',
  2,
  'lifetime',
  current_date - 30,
  current_date + 30
);

insert into public.planner_items (
  owner_id,
  goal_id,
  unit_key,
  scheduled_date,
  original_scheduled_date,
  locked
)
values
  (
    'c1000000-0000-4000-8000-000000000001',
    'c2000000-0000-4000-8000-000000000001',
    'total:1',
    current_date - 2,
    current_date - 2,
    false
  ),
  (
    'c1000000-0000-4000-8000-000000000001',
    'c2000000-0000-4000-8000-000000000001',
    'total:2',
    current_date + 2,
    current_date + 2,
    true
  );

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'c1000000-0000-4000-8000-000000000001',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  format(
    $tap$select * from public.complete_planner_item_on_date_service(
      'c2000000-0000-4000-8000-000000000001',
      'total:1',
      current_date,
      %L
    )$tap$,
    public.get_planner_schedule_digest()
  ),
  'move and completion persist in one transaction'
);

select is(
  (
    select scheduled_date
    from public.planner_items
    where goal_id = 'c2000000-0000-4000-8000-000000000001'
      and unit_key = 'total:1'
  ),
  current_date,
  'the planner item moves to the completion date'
);

select is(
  (
    select original_scheduled_date
    from public.planner_items
    where goal_id = 'c2000000-0000-4000-8000-000000000001'
      and unit_key = 'total:1'
  ),
  current_date - 2,
  'the original scheduled date remains historical metadata'
);

select ok(
  exists (
    select 1
    from public.completions
    where goal_id = 'c2000000-0000-4000-8000-000000000001'
      and completed_on = current_date
      and planner_unit_key = 'total:1'
  ),
  'the completion is durably allocated to the moved unit'
);

select isnt(
  public.get_planner_schedule_digest(),
  repeat('0', 64),
  'the resulting schedule has a canonical digest'
);

select throws_ok(
  $tap$select * from public.complete_planner_item_on_date_service(
    'c2000000-0000-4000-8000-000000000001',
    'total:2',
    current_date - 1,
    repeat('0', 64)
  )$tap$,
  'P0001',
  'stale_schedule',
  'stale schedule writes are rejected before mutation'
);

select throws_ok(
  format(
    $tap$select * from public.complete_planner_item_on_date_service(
      'c2000000-0000-4000-8000-000000000001',
      'total:2',
      current_date - 1,
      %L
    )$tap$,
    public.get_planner_schedule_digest()
  ),
  '55000',
  'planner_item_locked',
  'locked sessions are not moved implicitly'
);

select * from finish();
rollback;
