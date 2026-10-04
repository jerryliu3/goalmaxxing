-- Durable, transactional replay around canonical goal/task write functions.
-- No alternate business rules: existing RPCs still own invariants and cascades.
create table private.external_mutation_receipts (
  owner_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  operation text not null,
  payload jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (owner_id, request_id)
);
revoke all on private.external_mutation_receipts from public, anon, authenticated;

create function public.external_account_mutation(p_request_id uuid, p_operation text, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_receipt private.external_mutation_receipts%rowtype;
  v_goal public.goals%rowtype;
  v_goal_id uuid;
  v_result jsonb;
  v_milestones text[];
begin
  if v_uid is null then raise exception using errcode = '42501', message = 'authentication_required'; end if;
  if p_request_id is null or p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception using errcode = '22023', message = 'invalid_external_mutation';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text || ':' || p_request_id::text, 0));
  select * into v_receipt from private.external_mutation_receipts where owner_id = v_uid and request_id = p_request_id;
  if found then
    if v_receipt.operation <> p_operation or v_receipt.payload <> p_payload then
      raise exception using errcode = '22023', message = 'idempotency_conflict';
    end if;
    return v_receipt.result;
  end if;

  if p_operation = 'create_task' then
    select to_jsonb(t) into v_result from public.create_planner_task(
      p_title => p_payload->>'title',
      p_scheduled_date => (p_payload->>'scheduled_date')::date,
      p_scheduled_time => p_payload->>'scheduled_time'
    ) t;
  elsif p_operation in ('create_goal', 'update_goal', 'set_goal_archived', 'set_goal_link') then
    v_goal_id := case when p_operation = 'create_goal' then p_request_id else (p_payload->>'goal_id')::uuid end;
    if p_operation = 'create_goal' then
      if exists (select 1 from public.goals where id = v_goal_id) then
        raise exception using errcode = '22023', message = 'idempotency_conflict';
      end if;
    else
      select * into v_goal from public.goals where id = v_goal_id and owner_id = v_uid and not is_deleted for update;
      if not found then raise exception using errcode = 'P0002', message = 'goal_not_found'; end if;
      if p_payload->>'expected_updated_at' is null or v_goal.updated_at is distinct from (p_payload->>'expected_updated_at')::timestamptz then
        raise exception using errcode = '40001', message = 'stale_goal';
      end if;
    end if;

    if p_operation in ('create_goal', 'update_goal') then
      if jsonb_typeof(p_payload->'milestone_names') = 'array' then
        select array_agg(x.value order by x.ordinality) into v_milestones
          from jsonb_array_elements_text(p_payload->'milestone_names') with ordinality x(value, ordinality);
      end if;
      if p_operation = 'create_goal' then
        perform public.create_goal(
          p_id => v_goal_id, p_title => p_payload->>'title', p_description => p_payload->>'description',
          p_reward_text => p_payload->>'reward_text', p_category => p_payload->>'category',
          p_category_key => p_payload->>'category_key', p_color => p_payload->>'color',
          p_frequency_type => (p_payload->>'frequency_type')::public.goal_frequency_type,
          p_recurrence_interval => (p_payload->>'recurrence_interval')::public.recurrence_interval,
          p_target_count => (p_payload->>'target_count')::integer, p_milestone_names => v_milestones,
          p_start_date => (p_payload->>'start_date')::date, p_end_date => (p_payload->>'end_date')::date,
          p_default_local_time => p_payload->>'default_local_time', p_team_id => (p_payload->>'team_id')::uuid,
          p_is_private => (p_payload->>'is_private')::boolean,
          p_difficulty => (p_payload->>'difficulty')::public.goal_difficulty,
          p_target_basis => (p_payload->>'target_basis')::public.goal_target_basis,
          p_plaque_target => (p_payload->>'plaque_target')::integer
        );
      else
        perform public.update_goal(
          p_id => v_goal_id, p_title => p_payload->>'title', p_description => p_payload->>'description',
          p_reward_text => p_payload->>'reward_text', p_category => p_payload->>'category',
          p_category_key => p_payload->>'category_key', p_color => p_payload->>'color',
          p_frequency_type => (p_payload->>'frequency_type')::public.goal_frequency_type,
          p_recurrence_interval => (p_payload->>'recurrence_interval')::public.recurrence_interval,
          p_target_count => (p_payload->>'target_count')::integer, p_milestone_names => v_milestones,
          p_start_date => (p_payload->>'start_date')::date, p_end_date => (p_payload->>'end_date')::date,
          p_default_local_time => p_payload->>'default_local_time', p_team_id => (p_payload->>'team_id')::uuid,
          p_is_private => (p_payload->>'is_private')::boolean,
          p_difficulty => (p_payload->>'difficulty')::public.goal_difficulty,
          p_target_basis => (p_payload->>'target_basis')::public.goal_target_basis,
          p_plaque_target => (p_payload->>'plaque_target')::integer
        );
      end if;
    elsif p_operation = 'set_goal_archived' then
      perform public.set_goal_archived(p_goal_id => v_goal_id, p_archived => (p_payload->>'archived')::boolean);
    else
      perform public.replace_goal_source_link(p_source_goal_id => v_goal_id, p_target_goal_id => (p_payload->>'target_goal_id')::uuid);
    end if;
    select to_jsonb(g) into v_result from public.goals g where g.id = v_goal_id;
  else
    raise exception using errcode = '22023', message = 'unknown_external_operation';
  end if;
  if v_result is null then raise exception using errcode = 'P0001', message = 'external_mutation_result_missing'; end if;
  insert into private.external_mutation_receipts(owner_id, request_id, operation, payload, result)
    values (v_uid, p_request_id, p_operation, p_payload, v_result);
  return v_result;
end;
$$;
revoke all on function public.external_account_mutation(uuid, text, jsonb) from public, anon;
grant execute on function public.external_account_mutation(uuid, text, jsonb) to authenticated;
