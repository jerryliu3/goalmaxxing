begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(6);

insert into auth.users (id, email)
values (
  'b1000000-0000-4000-8000-000000000001',
  'planner-prepare-ordinals-owner@example.com'
)
on conflict (id) do nothing;

insert into public.profiles (id, username, timezone)
values (
  'b1000000-0000-4000-8000-000000000001',
  'planner_prepare_ordinals_owner',
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
values (
  'b2000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000001',
  'Prepared milestone sessions',
  'test',
  'fixed_milestones',
  null,
  3,
  (date_trunc('month', current_date) - interval '1 month')::date,
  (date_trunc('month', current_date) + interval '3 month - 1 day')::date
);

-- A credited historical session holds a later ordinal than the next upcoming
-- session, as a planner write that skipped normalization would leave it.
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
    'b1000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000001',
    'milestone:2',
    current_date - 1,
    current_date - 1,
    false
  ),
  (
    'b1000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000001',
    'milestone:1',
    (date_trunc('month', current_date) + interval '1 month 20 days')::date,
    (date_trunc('month', current_date) + interval '1 month 20 days')::date,
    false
  );

insert into public.completions (goal_id, user_id, completed_on, planner_unit_key)
values (
  'b2000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000001',
  current_date - 1,
  'milestone:2'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'b1000000-0000-4000-8000-000000000001',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

-- Preparation fills the missing ordinal on a free date earlier than the
-- existing upcoming session.
select lives_ok(
  $tap$
  do $$
  declare
    v_start date := (date_trunc('month', current_date) + interval '1 month')::date;
    v_end date := (date_trunc('month', current_date) + interval '2 month - 1 day')::date;
  begin
    perform *
    from public.prepare_planner_schedule(
      jsonb_build_array(
        jsonb_build_object('start_date', v_start::text, 'end_date', v_end::text)
      ),
      jsonb_build_array(
        jsonb_build_object(
          'goal_id', 'b2000000-0000-4000-8000-000000000001',
          'unit_key', 'milestone:1',
          'scheduled_date', (v_start + 20)::text,
          'original_scheduled_date', (v_start + 20)::text,
          'locked', false
        ),
        jsonb_build_object(
          'goal_id', 'b2000000-0000-4000-8000-000000000001',
          'unit_key', 'milestone:3',
          'scheduled_date', (v_start + 5)::text,
          'original_scheduled_date', (v_start + 5)::text,
          'locked', false
        )
      ),
      public.get_planner_schedule_digest()
    );
  end;
  $$;
  $tap$,
  'preparation succeeds when generated ordinals are out of date order'
);

select results_eq(
  $$
    select unit_key, scheduled_date
    from public.planner_items
    where goal_id = 'b2000000-0000-4000-8000-000000000001'
    order by scheduled_date
  $$,
  $$
    values
      ('milestone:1'::text, current_date - 1),
      ('milestone:2'::text, (date_trunc('month', current_date) + interval '1 month 5 days')::date),
      ('milestone:3'::text, (date_trunc('month', current_date) + interval '1 month 20 days')::date)
  $$,
  'preparation renumbers milestones chronologically across windows'
);

select is(
  (
    select planner_unit_key
    from public.completions
    where goal_id = 'b2000000-0000-4000-8000-000000000001'
      and completed_on = current_date - 1
  ),
  'milestone:1',
  'completion bindings follow their session through renumbering'
);

select is(
  (
    select replayed
    from public.prepare_planner_schedule(
      jsonb_build_array(
        jsonb_build_object(
          'start_date', (date_trunc('month', current_date) + interval '1 month')::date,
          'end_date', (date_trunc('month', current_date) + interval '2 month - 1 day')::date
        )
      ),
      (
        select jsonb_agg(
          jsonb_build_object(
            'goal_id', item.goal_id,
            'unit_key', item.unit_key,
            'scheduled_date', item.scheduled_date::text,
            'original_scheduled_date', item.original_scheduled_date::text,
            'locked', item.locked
          )
          order by item.scheduled_date
        )
        from public.planner_items item
        where item.goal_id = 'b2000000-0000-4000-8000-000000000001'
          and item.scheduled_date >= date_trunc('month', current_date) + interval '1 month'
      ),
      public.get_planner_schedule_digest()
    )
  ),
  true,
  'reopening the normalized calendar is a replay'
);

select is(
  (
    select count(*)::integer
    from public.planner_items
    where goal_id = 'b2000000-0000-4000-8000-000000000001'
  ),
  3,
  'replay leaves the normalized sessions in place'
);

reset role;
set local role service_role;

select ok(
  not has_function_privilege(
    'authenticated',
    'private.prepare_planner_schedule_unnormalized(jsonb,jsonb,text,jsonb)',
    'EXECUTE'
  ),
  'authenticated callers cannot bypass normalization through the private writer'
);

reset role;
select * from finish();
rollback;
