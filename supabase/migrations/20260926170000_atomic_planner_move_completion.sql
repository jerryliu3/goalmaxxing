-- Manual planner completion is one atomic schedule mutation: move the selected
-- unit to the factual completion date, persist the allocation, then apply the
-- canonical completion cascade. Linked and external completions remain
-- unallocated unless a later explicit repair assigns them.

alter table public.completions
add column if not exists planner_unit_key text;

alter table public.completions
drop constraint if exists completions_planner_unit_key_length;

alter table public.completions
add constraint completions_planner_unit_key_length
check (
  planner_unit_key is null
  or pg_catalog.char_length(planner_unit_key) between 1 and 200
);

create unique index if not exists completions_goal_user_planner_unit_unique
on public.completions (goal_id, user_id, planner_unit_key)
where planner_unit_key is not null;

create or replace function public.complete_planner_item_on_date_service(
  p_goal_id uuid,
  p_unit_key text,
  p_date date,
  p_expected_digest text
)
returns table (
  schedule_digest text,
  moved_from date,
  moved_to date
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
  v_item public.planner_items%rowtype;
  v_current_digest text;
begin
  if v_owner is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  if not public.can_complete_goal(p_goal_id, v_owner) then
    raise exception using errcode = '42501', message = 'completion_not_allowed';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    private.planner_owner_lock_key(v_owner)
  );

  v_current_digest := public.get_planner_schedule_digest(v_owner);
  if coalesce(p_expected_digest, '') <> coalesce(v_current_digest, '') then
    raise exception using errcode = 'P0001', message = 'stale_schedule';
  end if;

  select item.*
  into v_item
  from public.planner_items item
  where item.owner_id = v_owner
    and item.goal_id = p_goal_id
    and item.unit_key = pg_catalog.btrim(p_unit_key)
  for update;

  if v_item.id is null then
    raise exception using errcode = 'P0002', message = 'planner_item_not_found';
  end if;

  if v_item.locked and v_item.scheduled_date is distinct from p_date then
    raise exception using errcode = '55000', message = 'planner_item_locked';
  end if;

  if exists (
    select 1
    from public.planner_items other_item
    where other_item.goal_id = p_goal_id
      and other_item.scheduled_date = p_date
      and other_item.id <> v_item.id
  ) then
    raise exception using errcode = '23505', message = 'planner_destination_conflict';
  end if;

  update public.planner_items item
  set
    scheduled_date = p_date,
    original_scheduled_date = coalesce(
      item.original_scheduled_date,
      item.scheduled_date
    ),
    updated_at = pg_catalog.now()
  where item.id = v_item.id;

  perform public.mark_goal_complete(p_goal_id, p_date);

  update public.completions completion
  set planner_unit_key = pg_catalog.btrim(p_unit_key)
  where completion.goal_id = p_goal_id
    and completion.user_id = v_owner
    and completion.completed_on = p_date;

  return query
  select
    public.get_planner_schedule_digest(v_owner),
    v_item.scheduled_date,
    p_date;
end;
$$;

revoke all on function public.complete_planner_item_on_date_service(
  uuid,
  text,
  date,
  text
) from public, anon;

grant execute on function public.complete_planner_item_on_date_service(
  uuid,
  text,
  date,
  text
) to authenticated;
