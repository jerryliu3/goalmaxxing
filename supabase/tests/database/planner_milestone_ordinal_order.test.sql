begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(11);

insert into auth.users (id, email)
values (
  '11111111-1111-4111-8111-111111111111',
  'planner-milestone-order-owner@example.com'
)
on conflict (id) do nothing;

insert into public.profiles (id, username, timezone)
values (
  '11111111-1111-4111-8111-111111111111',
  'planner_milestone_order_owner',
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
  milestone_names,
  start_date,
  end_date
)
values (
  '91500000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  'Ordered milestone sessions',
  null,
  'test',
  null,
  'fixed_milestones',
  null,
  3,
  array['First', 'Second', 'Third'],
  date_trunc('month', current_date)::date,
  (date_trunc('month', current_date) + interval '2 months - 1 day')::date
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
    '11111111-1111-4111-8111-111111111111',
    '91500000-0000-4000-8000-000000000001',
    'milestone:1',
    (date_trunc('month', current_date) + interval '21 days')::date,
    (date_trunc('month', current_date) + interval '21 days')::date,
    false
  ),
  (
    '11111111-1111-4111-8111-111111111111',
    '91500000-0000-4000-8000-000000000001',
    'milestone:2',
    (date_trunc('month', current_date) + interval '22 days')::date,
    (date_trunc('month', current_date) + interval '22 days')::date,
    false
  ),
  (
    '11111111-1111-4111-8111-111111111111',
    '91500000-0000-4000-8000-000000000001',
    'milestone:3',
    (date_trunc('month', current_date) + interval '1 month 4 days')::date,
    (date_trunc('month', current_date) + interval '1 month 4 days')::date,
    false
  );

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $tap$
  do $$
  declare
    v_start date := date_trunc('month', current_date)::date;
    v_end date := (date_trunc('month', current_date) + interval '1 month - 1 day')::date;
    v_digest text;
  begin
    v_digest := public.get_planner_schedule_digest();
    perform *
    from public.set_planner_schedule(
      v_start,
      v_end,
      jsonb_build_array(
        jsonb_build_object(
          'goal_id', '91500000-0000-4000-8000-000000000001',
          'unit_key', 'milestone:1',
          'scheduled_date', (v_start + 21)::text,
          'original_scheduled_date', (v_start + 21)::text,
          'locked', false
        ),
        jsonb_build_object(
          'goal_id', '91500000-0000-4000-8000-000000000001',
          'unit_key', 'milestone:2',
          'scheduled_date', (v_start + 20)::text,
          'original_scheduled_date', (v_start + 22)::text,
          'locked', false
        )
      ),
      v_digest
    );
  end;
  $$;
  $tap$,
  'milestone schedule persistence succeeds when dates and incoming ordinals differ'
);

select is(
  (
    select unit_key
    from public.planner_items
    where goal_id = '91500000-0000-4000-8000-000000000001'
      and scheduled_date = date_trunc('month', current_date)::date + 20
  ),
  'milestone:1',
  'earliest scheduled milestone receives ordinal one'
);

select is(
  (
    select unit_key
    from public.planner_items
    where goal_id = '91500000-0000-4000-8000-000000000001'
      and scheduled_date = date_trunc('month', current_date)::date + 21
  ),
  'milestone:2',
  'next scheduled milestone receives ordinal two'
);

select is(
  (
    select unit_key
    from public.planner_items
    where goal_id = '91500000-0000-4000-8000-000000000001'
      and scheduled_date = date_trunc('month', current_date)::date
        + interval '1 month 4 days'
  ),
  'milestone:3',
  'milestone ordering includes sessions outside the persisted window'
);

select lives_ok(
  $tap$
  do $$
  declare
    v_start date := date_trunc('month', current_date)::date;
    v_end date := (date_trunc('month', current_date) + interval '1 month - 1 day')::date;
  begin
    perform *
    from public.set_planner_schedule(
      v_start,
      v_end,
      jsonb_build_array(
        jsonb_build_object(
          'goal_id', '91500000-0000-4000-8000-000000000001',
          'unit_key', 'milestone:1',
          'scheduled_date', (v_start + 21)::text,
          'original_scheduled_date', (v_start + 21)::text,
          'locked', false
        ),
        jsonb_build_object(
          'goal_id', '91500000-0000-4000-8000-000000000001',
          'unit_key', 'milestone:2',
          'scheduled_date', (v_start + 20)::text,
          'original_scheduled_date', (v_start + 22)::text,
          'locked', false
        )
      ),
      repeat('0', 64)
    );
  end;
  $$;
  $tap$,
  'semantic replay remains idempotent after ordinal normalization'
);

select is(
  (
    select upserted_count
    from public.set_planner_schedule(
      date_trunc('month', current_date)::date,
      (date_trunc('month', current_date) + interval '1 month - 1 day')::date,
      (
        select jsonb_agg(
          jsonb_build_object(
            'goal_id', item.goal_id,
            'unit_key',
              case item.unit_key
                when 'milestone:1' then 'milestone:2'
                else 'milestone:1'
              end,
            'scheduled_date', item.scheduled_date::text,
            'original_scheduled_date', item.original_scheduled_date::text,
            'locked', item.locked
          )
          order by item.scheduled_date
        )
        from public.planner_items item
        where item.goal_id = '91500000-0000-4000-8000-000000000001'
          and item.scheduled_date >= date_trunc('month', current_date)::date
          and item.scheduled_date < date_trunc('month', current_date) + interval '1 month'
      ),
      repeat('0', 64)
    )
  ),
  0,
  'replay equivalence ignores milestone unit-key permutations'
);

select lives_ok(
  $tap$
  do $$
  declare
    v_start date := date_trunc('month', current_date)::date;
    v_end date := (date_trunc('month', current_date) + interval '1 month - 1 day')::date;
    v_digest text;
  begin
    v_digest := public.get_planner_schedule_digest();
    perform *
    from public.set_planner_schedule(
      v_start,
      v_end,
      '[]'::jsonb,
      v_digest
    );
  end;
  $$;
  $tap$,
  'removing every in-window milestone still normalizes remaining sessions'
);

select is(
  (
    select unit_key
    from public.planner_items
    where goal_id = '91500000-0000-4000-8000-000000000001'
  ),
  'milestone:1',
  'the remaining out-of-window milestone closes the ordinal gap'
);

reset role;
set local role service_role;

update public.planner_items
set unit_key = 'milestone:2'
where goal_id = '91500000-0000-4000-8000-000000000001';

insert into public.planner_items (
  owner_id,
  goal_id,
  unit_key,
  scheduled_date,
  original_scheduled_date,
  locked
)
values (
  '11111111-1111-4111-8111-111111111111',
  '91500000-0000-4000-8000-000000000001',
  'milestone:1',
  date_trunc('month', current_date)::date + 10,
  date_trunc('month', current_date)::date + 10,
  false
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $tap$
  do $$
  declare
    v_start date := date_trunc('month', current_date)::date;
    v_end date := (date_trunc('month', current_date) + interval '1 month - 1 day')::date;
    v_digest text;
  begin
    v_digest := public.get_planner_schedule_digest();
    perform *
    from public.clear_planner_schedule_windows(
      jsonb_build_array(
        jsonb_build_object(
          'start_date', v_start::text,
          'end_date', v_end::text
        )
      ),
      v_digest
    );
  end;
  $$;
  $tap$,
  'clearing a window normalizes milestones that remain in other windows'
);

select is(
  (
    select unit_key
    from public.planner_items
    where goal_id = '91500000-0000-4000-8000-000000000001'
  ),
  'milestone:1',
  'window clearing reuses the canonical milestone normalizer'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'private.normalize_milestone_planner_ordinals(uuid,uuid[])',
    'EXECUTE'
  ),
  'authenticated callers cannot invoke milestone normalization directly'
);

reset role;
select * from finish();
rollback;
