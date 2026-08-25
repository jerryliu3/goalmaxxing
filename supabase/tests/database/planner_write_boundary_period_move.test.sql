begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(1);

insert into auth.users (id, email)
values (
  '11111111-1111-4111-8111-111111111111',
  'planner-period-move-owner@example.com'
)
on conflict (id) do nothing;

insert into public.profiles (id, username, timezone)
values (
  '11111111-1111-4111-8111-111111111111',
  'planner_period_move_owner',
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
  target_basis,
  start_date,
  end_date
)
values (
  '91400000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  'Per-period weekly move goal',
  null,
  'test',
  null,
  'recurring',
  'weekly',
  4,
  'period'::public.goal_target_basis,
  date_trunc('month', current_date)::date,
  (date_trunc('month', current_date) + interval '1 month - 1 day')::date
);

insert into public.planner_items (
  owner_id,
  goal_id,
  unit_key,
  scheduled_date,
  locked
)
select
  '11111111-1111-4111-8111-111111111111',
  '91400000-0000-4000-8000-000000000001',
  'cadence:' || series.week_start::text || ':' || series.slot::text,
  series.week_start + (series.slot - 1),
  false
from (
  select
    (
      date_trunc('month', current_date)::date
      + (week_index * 7)
    )::date as week_start,
    slot
  from generate_series(0, 3) as week_index
  cross join generate_series(1, 4) as slot
) as series(week_start, slot);

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
    v_scope_month date := date_trunc('month', current_date)::date;
    v_digest text;
    v_payload jsonb;
  begin
    v_payload := (
      select jsonb_agg(
        jsonb_build_object(
          'goal_id', item.goal_id,
          'unit_key', item.unit_key,
          'scheduled_date', (item.scheduled_date + interval '1 day')::date::text,
          'original_scheduled_date', item.scheduled_date::text,
          'locked', item.locked
        )
        order by item.unit_key
      )
      from public.planner_items item
      where item.owner_id = '11111111-1111-4111-8111-111111111111'
        and item.goal_id = '91400000-0000-4000-8000-000000000001'
    );

    v_digest := public.get_planner_schedule_digest();
    perform *
    from public.set_planner_schedule(
      v_scope_month,
      (v_scope_month + interval '1 month - 1 day')::date,
      v_payload,
      v_digest
    );
  end;
  $$;
  $tap$,
  'per-period cadence move rewrite does not raise exceeds_target_count'
);

reset role;
select * from finish();
rollback;
