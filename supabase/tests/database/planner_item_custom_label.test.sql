begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(6);

insert into auth.users (id, email)
values (
  '11111111-1111-4111-8111-111111111111',
  'planner-item-custom-label-owner@example.com'
)
on conflict (id) do nothing;

insert into public.profiles (id, username, timezone)
values (
  '11111111-1111-4111-8111-111111111111',
  'planner_item_custom_label_owner',
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
    '91300000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'Run',
    null,
    'test',
    null,
    'recurring',
    'weekly',
    2,
    date_trunc('month', current_date)::date,
    (date_trunc('month', current_date) + interval '1 month - 1 day')::date
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
          'goal_id', '91300000-0000-4000-8000-000000000001',
          'unit_key', 'unit:1',
          'scheduled_date', (v_start + 2)::text,
          'locked', false,
          'label', 'Tempo run'
        ),
        jsonb_build_object(
          'goal_id', '91300000-0000-4000-8000-000000000001',
          'unit_key', 'unit:2',
          'scheduled_date', (v_start + 4)::text,
          'locked', false
        )
      ),
      v_digest
    );
  end;
  $$;
  $tap$,
  'labeled schedule writes succeed'
);

select is(
  (
    select item.label
    from public.planner_items item
    where item.unit_key = 'unit:1'
  ),
  'Tempo run',
  'custom label persists for the renamed item'
);

select is(
  (
    select item.label
    from public.planner_items item
    where item.unit_key = 'unit:2'
  ),
  null,
  'sibling items keep a null label'
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
      jsonb_build_array(
        jsonb_build_object(
          'goal_id', '91300000-0000-4000-8000-000000000001',
          'unit_key', 'unit:1',
          'scheduled_date', (v_start + 2)::text,
          'locked', false,
          'label', 'Hill repeats'
        ),
        jsonb_build_object(
          'goal_id', '91300000-0000-4000-8000-000000000001',
          'unit_key', 'unit:2',
          'scheduled_date', (v_start + 4)::text,
          'locked', false
        )
      ),
      v_digest
    );
  end;
  $$;
  $tap$,
  'relabeling an existing session succeeds'
);

select is(
  (
    select item.label
    from public.planner_items item
    where item.unit_key = 'unit:1'
  ),
  'Hill repeats',
  'saving a new title replaces the previous custom label'
);

select lives_ok(
  $tap$
  do $$
  declare
    v_start date := date_trunc('month', current_date)::date;
    v_end date := (date_trunc('month', current_date) + interval '1 month - 1 day')::date;
    v_digest text;
    v_upserted integer;
  begin
    v_digest := public.get_planner_schedule_digest();
    select upserted_count
    into v_upserted
    from public.set_planner_schedule(
      v_start,
      v_end,
      jsonb_build_array(
        jsonb_build_object(
          'goal_id', '91300000-0000-4000-8000-000000000001',
          'unit_key', 'unit:1',
          'scheduled_date', (v_start + 2)::text,
          'locked', false,
          'label', 'Hill repeats'
        ),
        jsonb_build_object(
          'goal_id', '91300000-0000-4000-8000-000000000001',
          'unit_key', 'unit:2',
          'scheduled_date', (v_start + 4)::text,
          'locked', false
        )
      ),
      v_digest
    );
    if v_upserted <> 0 then
      raise exception 'expected labeled replay to upsert 0 rows, got %', v_upserted;
    end if;
  end;
  $$;
  $tap$,
  'identical labeled payload is treated as replay'
);

select * from finish();
rollback;
