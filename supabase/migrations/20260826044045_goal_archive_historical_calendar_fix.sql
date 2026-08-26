-- The archive migration treated archived goals like deleted goals when
-- prepare_planner_schedule_core purges planner_items. That removed completed
-- sessions that should stay visible. Keep archived goals excluded from new
-- schedule writes, but stop blanket row deletion during prepare.

do $migration$
declare
  v_definition text;
  v_replacement_count integer;
begin
  select pg_catalog.pg_get_functiondef(
    'public.prepare_planner_schedule_core(jsonb,jsonb,text)'::regprocedure
  )
  into v_definition;

  v_replacement_count := (
    pg_catalog.length(v_definition)
    - pg_catalog.length(
      pg_catalog.replace(
        v_definition,
        '(goal.is_deleted or goal.archived_at is not null)',
        ''
      )
    )
  ) / pg_catalog.length('(goal.is_deleted or goal.archived_at is not null)');

  if v_replacement_count < 1 then
    raise exception using
      errcode = '55000',
      message = 'unexpected_prepare_archived_delete_guard_count: ' || v_replacement_count;
  end if;

  v_definition := pg_catalog.replace(
    v_definition,
    '(goal.is_deleted or goal.archived_at is not null)',
    'goal.is_deleted'
  );

  execute v_definition;
end;
$migration$;
