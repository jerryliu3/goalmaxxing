begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(9);

insert into auth.users (id, email)
values (
  'c1000000-0000-4000-8000-000000000001',
  'linked-cascade-claim-owner@example.com'
)
on conflict (id) do nothing;

insert into public.profiles (id, username, timezone)
values (
  'c1000000-0000-4000-8000-000000000001',
  'linked_cascade_claim_owner',
  'UTC'
)
on conflict (id) do update
set timezone = excluded.timezone;

set local role service_role;

insert into public.goals (
  id,
  owner_id,
  title,
  category,
  frequency_type,
  recurrence_interval,
  target_count,
  start_date,
  end_date
)
values
  (
    'c2000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000001',
    'Linked source',
    'test',
    'recurring',
    'weekly',
    3,
    (date_trunc('month', current_date) - interval '1 month')::date,
    (date_trunc('month', current_date) + interval '3 month - 1 day')::date
  ),
  (
    'c2000000-0000-4000-8000-000000000002',
    'c1000000-0000-4000-8000-000000000001',
    'Linked milestone target',
    'test',
    'fixed_milestones',
    null,
    3,
    (date_trunc('month', current_date) - interval '1 month')::date,
    (date_trunc('month', current_date) + interval '3 month - 1 day')::date
  );

insert into public.goal_links (owner_id, source_goal_id, target_goal_id)
values (
  'c1000000-0000-4000-8000-000000000001',
  'c2000000-0000-4000-8000-000000000001',
  'c2000000-0000-4000-8000-000000000002'
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
    'c2000000-0000-4000-8000-000000000002',
    'milestone:1',
    current_date - 3,
    null,
    false
  ),
  (
    'c1000000-0000-4000-8000-000000000001',
    'c2000000-0000-4000-8000-000000000002',
    'milestone:2',
    current_date + 10,
    null,
    false
  ),
  (
    'c1000000-0000-4000-8000-000000000001',
    'c2000000-0000-4000-8000-000000000002',
    'milestone:3',
    current_date + 20,
    null,
    false
  );

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'c1000000-0000-4000-8000-000000000001',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

-- A cascade on a date that already holds a target session claims it in place.
select lives_ok(
  $$ select public.mark_goal_complete('c2000000-0000-4000-8000-000000000001', current_date - 3) $$,
  'completing the source on a planned target date succeeds'
);

select results_eq(
  $$
    select completion.planner_unit_key, item.scheduled_date, item.original_scheduled_date
    from public.completions completion
    join public.planner_items item
      on item.goal_id = completion.goal_id
     and item.unit_key = completion.planner_unit_key
    where completion.goal_id = 'c2000000-0000-4000-8000-000000000002'
      and completion.completed_on = current_date - 3
  $$,
  $$ values ('milestone:1'::text, current_date - 3, null::date) $$,
  'the cascade claims the target session already on that date without moving it'
);

-- A cascade on an unplanned date pulls the earliest uncredited session onto it.
select lives_ok(
  $$ select public.mark_goal_complete('c2000000-0000-4000-8000-000000000001', current_date) $$,
  'completing the source on an unplanned target date succeeds'
);

select results_eq(
  $$
    select completion.planner_unit_key, item.scheduled_date, item.original_scheduled_date
    from public.completions completion
    join public.planner_items item
      on item.goal_id = completion.goal_id
     and item.unit_key = completion.planner_unit_key
    where completion.goal_id = 'c2000000-0000-4000-8000-000000000002'
      and completion.completed_on = current_date
  $$,
  $$ values ('milestone:2'::text, current_date, current_date + 10) $$,
  'the cascade moves the earliest uncredited session onto the completion date'
);

select is(
  (
    select count(*)::integer
    from public.planner_items
    where goal_id = 'c2000000-0000-4000-8000-000000000002'
      and scheduled_date = current_date + 10
  ),
  0,
  'the claimed session no longer occupies its old future date'
);

-- A later-dated session claimed earlier in time is renumbered with its credit.
select lives_ok(
  $$ select public.mark_goal_complete('c2000000-0000-4000-8000-000000000001', current_date - 1) $$,
  'completing the source on an earlier unplanned date succeeds'
);

select results_eq(
  $$
    select completion.completed_on, completion.planner_unit_key
    from public.completions completion
    join public.planner_items item
      on item.goal_id = completion.goal_id
     and item.unit_key = completion.planner_unit_key
     and item.scheduled_date = completion.completed_on
    where completion.goal_id = 'c2000000-0000-4000-8000-000000000002'
    order by completion.completed_on
  $$,
  $$
    values
      (current_date - 3, 'milestone:1'::text),
      (current_date - 1, 'milestone:2'::text),
      (current_date, 'milestone:3'::text)
  $$,
  'credited sessions sit on their completion dates in chronological ordinal order'
);

-- Undoing the source restores the session moved for that cascade.
select lives_ok(
  $$ select public.unmark_goal_complete('c2000000-0000-4000-8000-000000000001', current_date) $$,
  'uncompleting the source succeeds'
);

select results_eq(
  $$
    select unit_key, scheduled_date, original_scheduled_date
    from public.planner_items
    where goal_id = 'c2000000-0000-4000-8000-000000000002'
    order by scheduled_date
  $$,
  $$
    values
      ('milestone:1'::text, current_date - 3, null::date),
      ('milestone:2'::text, current_date - 1, current_date + 20),
      ('milestone:3'::text, current_date + 10, null::date)
  $$,
  'undo moves the released session back to its original date and renumbers'
);

select * from finish();
rollback;
