begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(4);

insert into auth.users (id, email)
values (
  '11111111-1111-4111-8111-111111111111',
  'planner-write-boundary-clear-goal-owner@example.com'
)
on conflict (id) do nothing;

insert into public.profiles (id, username, timezone)
values (
  '11111111-1111-4111-8111-111111111111',
  'planner_write_boundary_clear_goal_owner',
  'UTC'
)
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
    '91700000-0000-4000-8000-000000000011',
    '11111111-1111-4111-8111-111111111111',
    'Planner clear goal scope A',
    null,
    'test',
    null,
    'recurring',
    'weekly',
    6,
    date_trunc('month', current_date)::date,
    (date_trunc('month', current_date) + interval '3 month - 1 day')::date
  ),
  (
    '91700000-0000-4000-8000-000000000012',
    '11111111-1111-4111-8111-111111111111',
    'Planner clear goal scope B',
    null,
    'test',
    null,
    'recurring',
    'weekly',
    6,
    date_trunc('month', current_date)::date,
    (date_trunc('month', current_date) + interval '3 month - 1 day')::date
  );

insert into public.planner_items (
  owner_id,
  goal_id,
  unit_key,
  requirement_kind,
  scheduled_date,
  original_scheduled_date,
  classification,
  credit_state,
  locked,
  revision
)
values
  (
    '11111111-1111-4111-8111-111111111111',
    '91700000-0000-4000-8000-000000000011',
    '2026-08-01',
    'cadence',
    date_trunc('month', current_date)::date,
    date_trunc('month', current_date)::date,
    'open',
    'uncredited',
    false,
    1
  ),
  (
    '11111111-1111-4111-8111-111111111111',
    '91700000-0000-4000-8000-000000000011',
    '2026-08-08',
    'cadence',
    (date_trunc('month', current_date) + interval '7 day')::date,
    (date_trunc('month', current_date) + interval '7 day')::date,
    'open',
    'uncredited',
    false,
    1
  ),
  (
    '11111111-1111-4111-8111-111111111111',
    '91700000-0000-4000-8000-000000000012',
    '2026-08-02',
    'cadence',
    (date_trunc('month', current_date) + interval '1 day')::date,
    (date_trunc('month', current_date) + interval '1 day')::date,
    'open',
    'uncredited',
    false,
    1
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '11111111-1111-4111-8111-111111111111')::text,
  true
);

select is(
  (
    select deleted_count::int
    from public.clear_planner_schedule_for_goal(
      '91700000-0000-4000-8000-000000000011',
      jsonb_build_array(
        jsonb_build_object(
          'start_date', date_trunc('month', current_date)::date,
          'end_date', (date_trunc('month', current_date) + interval '1 month - 1 day')::date
        )
      ),
      public.get_planner_schedule_digest('11111111-1111-4111-8111-111111111111')
    )
  ),
  2,
  'clear_planner_schedule_for_goal deletes only the targeted goal items'
);

select is(
  (
    select count(*)::int
    from public.planner_items item
    where item.owner_id = '11111111-1111-4111-8111-111111111111'
      and item.goal_id = '91700000-0000-4000-8000-000000000012'
  ),
  1,
  'clear_planner_schedule_for_goal leaves other goals untouched'
);

select is(
  (
    select deleted_count::int
    from public.clear_planner_schedule_for_goal(
      '91700000-0000-4000-8000-000000000011',
      jsonb_build_array(
        jsonb_build_object(
          'start_date', date_trunc('month', current_date)::date,
          'end_date', (date_trunc('month', current_date) + interval '1 month - 1 day')::date
        )
      ),
      public.get_planner_schedule_digest('11111111-1111-4111-8111-111111111111')
    )
  ),
  0,
  'clear_planner_schedule_for_goal replays when the goal window is already empty'
);

select throws_ok(
  $sql$
    select *
    from public.clear_planner_schedule_for_goal(
      '91700000-0000-4000-8000-000000000012',
      jsonb_build_array(
        jsonb_build_object(
          'start_date', date_trunc('month', current_date)::date,
          'end_date', (date_trunc('month', current_date) + interval '1 month - 1 day')::date
        )
      ),
      repeat('a', 64)
    );
  $sql$,
  'P0001',
  'stale_schedule',
  'clear_planner_schedule_for_goal rejects stale digests when work remains'
);

select * from finish();
rollback;
