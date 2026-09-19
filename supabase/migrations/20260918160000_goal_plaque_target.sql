-- Persist the recurring plaque milestone through the canonical goal writes.
-- Finite goals retain target_count as their sole earning target.
alter table public.goals add column plaque_target integer;
alter table public.goals add constraint goals_plaque_target_valid
  check (plaque_target is null or (target_basis = 'period'::public.goal_target_basis and plaque_target between 1 and 20));
comment on column public.goals.plaque_target is 'Successful cadence periods required for the decorative plaque; does not terminate the goal or grant XP.';

-- Replace signatures rather than leaving ambiguous PostgREST overloads.
drop function public.create_goals(jsonb);
drop function public.create_goal(uuid, text, text, text, text, text, text, public.goal_frequency_type, public.recurrence_interval, integer, text[], date, date, text, uuid, boolean, public.goal_difficulty, public.goal_target_basis);
drop function public.update_goal(uuid, text, text, text, text, text, text, public.goal_frequency_type, public.recurrence_interval, integer, text[], date, date, text, uuid, boolean, public.goal_difficulty, public.goal_target_basis);

create or replace function public.create_goal(
  p_id uuid,
  p_title text,
  p_description text default null,
  p_reward_text text default null,
  p_category text default 'general',
  p_category_key text default null,
  p_color text default null,
  p_frequency_type public.goal_frequency_type default 'recurring',
  p_recurrence_interval public.recurrence_interval default null,
  p_target_count integer default null,
  p_milestone_names text[] default null,
  p_start_date date default current_date,
  p_end_date date default null,
  p_default_local_time text default null,
  p_team_id uuid default null,
  p_is_private boolean default false,
  p_difficulty public.goal_difficulty default null,
  p_target_basis public.goal_target_basis default null,
  p_plaque_target integer default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_category text;
  v_category_key text;
  v_id uuid := coalesce(p_id, gen_random_uuid());
  v_difficulty public.goal_difficulty := coalesce(
    p_difficulty,
    'medium'::public.goal_difficulty
  );
  v_target_basis public.goal_target_basis := private.resolve_goal_target_basis(
    p_frequency_type,
    p_recurrence_interval,
    p_target_count,
    p_target_basis
  );
begin
  if v_uid is null then
    raise exception using
      errcode = '42501',
      message = 'authentication required';
  end if;

  if p_team_id is not null
    and not private.is_active_team_member(p_team_id, v_uid) then
    raise exception using
      errcode = '42501',
      message = 'not a member of team';
  end if;

  select n.category, n.category_key
  into v_category, v_category_key
  from private.normalize_goal_category_pair(p_category, p_category_key) n;

  insert into public.goals (
    id,
    owner_id,
    title,
    description,
    reward_text,
    category,
    category_key,
    color,
    frequency_type,
    recurrence_interval,
    target_count,
    target_basis,
    milestone_names,
    start_date,
    end_date,
    default_local_time,
    team_id,
    is_private,
    difficulty,
    is_deleted,
    plaque_target
  )
  values (
    v_id,
    v_uid,
    p_title,
    p_description,
    p_reward_text,
    v_category,
    v_category_key,
    p_color,
    p_frequency_type,
    p_recurrence_interval,
    private.normalize_goal_target_count(
      p_frequency_type,
      p_recurrence_interval,
      p_target_count,
      v_target_basis
    ),
    v_target_basis,
    p_milestone_names,
    p_start_date,
    p_end_date,
    p_default_local_time,
    p_team_id,
    coalesce(p_is_private, false),
    v_difficulty,
    false,
    case when v_target_basis = 'period'::public.goal_target_basis then p_plaque_target else null end
  )
  on conflict (id) do nothing;

  if not found then
    perform private.assert_goal_owner(v_id, v_uid);
  end if;

  return v_id;
end;
$$;

create or replace function public.update_goal(
  p_id uuid,
  p_title text,
  p_description text default null,
  p_reward_text text default null,
  p_category text default 'general',
  p_category_key text default null,
  p_color text default null,
  p_frequency_type public.goal_frequency_type default 'recurring',
  p_recurrence_interval public.recurrence_interval default null,
  p_target_count integer default null,
  p_milestone_names text[] default null,
  p_start_date date default current_date,
  p_end_date date default null,
  p_default_local_time text default null,
  p_team_id uuid default null,
  p_is_private boolean default false,
  p_difficulty public.goal_difficulty default null,
  p_target_basis public.goal_target_basis default null,
  p_plaque_target integer default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_old public.goals%rowtype;
  v_category text;
  v_category_key text;
  v_needs_xp boolean := false;
  v_is_private boolean := coalesce(p_is_private, false);
  v_difficulty public.goal_difficulty;
  v_new_target_count integer;
  v_completed_count integer := 0;
  v_effective_basis public.goal_target_basis;
begin
  perform private.assert_goal_owner(p_id, v_uid);

  if p_team_id is not null
    and not private.is_active_team_member(p_team_id, v_uid) then
    raise exception using
      errcode = '42501',
      message = 'not a member of team';
  end if;

  select *
  into v_old
  from public.goals
  where id = p_id
  for update;

  v_effective_basis := coalesce(p_target_basis, v_old.target_basis);

  if v_old.frequency_type is distinct from p_frequency_type
    or v_old.recurrence_interval is distinct from p_recurrence_interval
    or v_old.target_basis is distinct from private.resolve_goal_target_basis(
      p_frequency_type,
      p_recurrence_interval,
      p_target_count,
      v_effective_basis
    )
    or v_old.start_date is distinct from p_start_date then
    raise exception using
      errcode = '22023',
      message = 'goal definition fields are immutable after creation';
  end if;

  v_new_target_count := private.normalize_goal_target_count(
    p_frequency_type,
    p_recurrence_interval,
    p_target_count,
    v_effective_basis
  );

  if v_old.frequency_type = 'fixed_milestones'::public.goal_frequency_type
    or v_old.target_basis = 'lifetime'::public.goal_target_basis then
    select count(*)::integer
    into v_completed_count
    from public.completions
    where goal_id = p_id;

    if v_new_target_count is not null
      and v_new_target_count < v_completed_count then
      raise exception using
        errcode = '22023',
        message = 'target count cannot be below existing completions';
    end if;
  end if;

  select n.category, n.category_key
  into v_category, v_category_key
  from private.normalize_goal_category_pair(p_category, p_category_key) n;

  v_difficulty := coalesce(
    p_difficulty,
    v_old.difficulty,
    'medium'::public.goal_difficulty
  );

  v_needs_xp :=
    v_old.end_date is distinct from p_end_date
    or v_old.category_key is distinct from v_category_key
    or v_old.target_count is distinct from v_new_target_count;

  update public.goals
  set
    title = p_title,
    description = p_description,
    reward_text = p_reward_text,
    category = v_category,
    category_key = v_category_key,
    color = p_color,
    target_count = v_new_target_count,
    milestone_names = p_milestone_names,
    end_date = p_end_date,
    default_local_time = p_default_local_time,
    team_id = p_team_id,
    is_private = v_is_private,
    difficulty = v_difficulty,
    plaque_target = case when v_old.target_basis = 'period'::public.goal_target_basis
      then coalesce(p_plaque_target, v_old.plaque_target) else null end
  where id = p_id
    and owner_id = v_uid;

  if v_is_private then
    delete from public.goal_shares
    where goal_id = p_id;
  end if;

  if v_needs_xp then
    perform private.recompute_xp_for_goal_users(p_id);
  end if;
end;
$$;

create or replace function public.create_goals(
  p_goals jsonb
)
returns uuid[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_item jsonb;
  v_ids uuid[] := '{}'::uuid[];
  v_id uuid;
begin
  if v_uid is null then
    raise exception using
      errcode = '42501',
      message = 'authentication required';
  end if;

  if p_goals is null or jsonb_typeof(p_goals) <> 'array' then
    raise exception using
      errcode = '22023',
      message = 'p_goals must be a json array';
  end if;

  for v_item in
    select value
    from jsonb_array_elements(p_goals)
  loop
    v_id := public.create_goal(
      coalesce((v_item->>'id')::uuid, gen_random_uuid()),
      v_item->>'title',
      nullif(v_item->>'description', ''),
      nullif(v_item->>'reward_text', ''),
      coalesce(v_item->>'category', 'general'),
      nullif(v_item->>'category_key', ''),
      nullif(v_item->>'color', ''),
      coalesce(
        (v_item->>'frequency_type')::public.goal_frequency_type,
        'recurring'::public.goal_frequency_type
      ),
      nullif(v_item->>'recurrence_interval', '')::public.recurrence_interval,
      nullif(v_item->>'target_count', '')::integer,
      case
        when v_item ? 'milestone_names'
          and jsonb_typeof(v_item->'milestone_names') = 'array'
        then array(
          select jsonb_array_elements_text(v_item->'milestone_names')
        )
        else null
      end,
      coalesce((v_item->>'start_date')::date, current_date),
      nullif(v_item->>'end_date', '')::date,
      nullif(v_item->>'default_local_time', ''),
      nullif(v_item->>'team_id', '')::uuid,
      coalesce((v_item->>'is_private')::boolean, false),
      coalesce(
        nullif(v_item->>'difficulty', '')::public.goal_difficulty,
        'medium'::public.goal_difficulty
      ),
      nullif(v_item->>'target_basis', '')::public.goal_target_basis,
      nullif(v_item->>'plaque_target', '')::integer
    );
    v_ids := array_append(v_ids, v_id);
  end loop;

  return v_ids;
end;
$$;

revoke all on function public.create_goal(uuid, text, text, text, text, text, text, public.goal_frequency_type, public.recurrence_interval, integer, text[], date, date, text, uuid, boolean, public.goal_difficulty, public.goal_target_basis, integer) from public, anon;
revoke all on function public.update_goal(uuid, text, text, text, text, text, text, public.goal_frequency_type, public.recurrence_interval, integer, text[], date, date, text, uuid, boolean, public.goal_difficulty, public.goal_target_basis, integer) from public, anon;
grant execute on function public.create_goal(uuid, text, text, text, text, text, text, public.goal_frequency_type, public.recurrence_interval, integer, text[], date, date, text, uuid, boolean, public.goal_difficulty, public.goal_target_basis, integer) to authenticated, service_role;
grant execute on function public.update_goal(uuid, text, text, text, text, text, text, public.goal_frequency_type, public.recurrence_interval, integer, text[], date, date, text, uuid, boolean, public.goal_difficulty, public.goal_target_basis, integer) to authenticated, service_role;
revoke execute on function public.create_goals(jsonb) from public, anon;
grant execute on function public.create_goals(jsonb) to authenticated, service_role;
