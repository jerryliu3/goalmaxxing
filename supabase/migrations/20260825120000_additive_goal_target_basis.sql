-- Per-period cadence targets: discriminate lifetime vs per-period interpretation of target_count.

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'goal_target_basis'
  ) then
    create type public.goal_target_basis as enum ('period', 'lifetime');
  end if;
end;
$$;

alter table public.goals
  add column if not exists target_basis public.goal_target_basis;

update public.goals
set target_basis = case
  when frequency_type = 'fixed_milestones'::public.goal_frequency_type then
    'lifetime'::public.goal_target_basis
  when frequency_type = 'recurring'::public.goal_frequency_type
    and coalesce(target_count, 0) > 0 then
    'lifetime'::public.goal_target_basis
  else
    'period'::public.goal_target_basis
end
where target_basis is null;

alter table public.goals
  alter column target_basis set not null;

alter table public.goals
  drop constraint if exists goals_target_basis_shape;

alter table public.goals
  add constraint goals_target_basis_shape check (
  (
    frequency_type = 'fixed_milestones'::public.goal_frequency_type
    and target_basis = 'lifetime'::public.goal_target_basis
  )
  or (
    frequency_type = 'recurring'::public.goal_frequency_type
    and target_basis = 'period'::public.goal_target_basis
    and (
      recurrence_interval = 'daily'::public.recurrence_interval
      and (target_count is null or target_count = 1)
      or recurrence_interval = 'weekly'::public.recurrence_interval
      and coalesce(target_count, 1) between 1 and 7
      or recurrence_interval = 'monthly'::public.recurrence_interval
      and coalesce(target_count, 1) between 1 and 31
    )
  )
  or (
    frequency_type = 'recurring'::public.goal_frequency_type
    and target_basis = 'lifetime'::public.goal_target_basis
    and coalesce(target_count, 0) > 0
  )
);

create or replace function private.resolve_goal_target_basis(
  p_frequency_type public.goal_frequency_type,
  p_target_count integer,
  p_target_basis public.goal_target_basis default null
)
returns public.goal_target_basis
language sql
immutable
set search_path = ''
as $$
  select case
    when p_frequency_type = 'fixed_milestones'::public.goal_frequency_type then
      'lifetime'::public.goal_target_basis
    when p_target_basis is not null then
      p_target_basis
    when p_frequency_type = 'recurring'::public.goal_frequency_type
      and coalesce(p_target_count, 0) > 0 then
      'lifetime'::public.goal_target_basis
    else
      'period'::public.goal_target_basis
  end;
$$;

revoke all on function private.resolve_goal_target_basis(
  public.goal_frequency_type,
  integer,
  public.goal_target_basis
) from public, anon, authenticated;
grant execute on function private.resolve_goal_target_basis(
  public.goal_frequency_type,
  integer,
  public.goal_target_basis
) to service_role;

create or replace function private.planner_schedule_item_matches_requirement(
  p_frequency_type public.goal_frequency_type,
  p_recurrence_interval public.recurrence_interval,
  p_target_count integer,
  p_target_basis public.goal_target_basis,
  p_start_date date,
  p_end_date date,
  p_unit_key text,
  p_scheduled_date date,
  p_week_starts_on smallint
)
returns boolean
language sql
stable
set search_path = ''
as $$
  select
    p_frequency_type is not null
    and p_start_date is not null
    and p_unit_key is not null
    and p_scheduled_date is not null
    and p_scheduled_date >= p_start_date
    and (p_end_date is null or p_scheduled_date <= p_end_date)
    and (
      (
        p_frequency_type = 'fixed_milestones'::public.goal_frequency_type
        and coalesce(p_target_count, 0) > 0
        and p_unit_key ~ '^milestone:[1-9][0-9]*$'
        and substring(
          p_unit_key from '^milestone:([1-9][0-9]*)$'
        )::numeric <= p_target_count
      )
      or (
        p_frequency_type = 'recurring'::public.goal_frequency_type
        and p_target_basis = 'lifetime'::public.goal_target_basis
        and coalesce(p_target_count, 0) > 0
        and p_unit_key ~ '^total:[1-9][0-9]*$'
        and substring(
          p_unit_key from '^total:([1-9][0-9]*)$'
        )::numeric <= p_target_count
      )
      or (
        p_frequency_type = 'recurring'::public.goal_frequency_type
        and p_target_basis = 'period'::public.goal_target_basis
        and p_recurrence_interval is not null
        and p_unit_key ~ (
          '^cadence:' || private.planner_cadence_period_key(
            p_recurrence_interval,
            p_scheduled_date,
            p_week_starts_on
          ) || ':[1-9][0-9]*$'
        )
        and substring(p_unit_key from ':([1-9][0-9]*)$')::integer
          <= coalesce(p_target_count, 1)
      )
    );
$$;

revoke all on function private.planner_schedule_item_matches_requirement(
  public.goal_frequency_type,
  public.recurrence_interval,
  integer,
  public.goal_target_basis,
  date,
  date,
  text,
  date,
  smallint
) from public, anon, authenticated;

drop function if exists private.planner_schedule_item_matches_requirement(
  public.goal_frequency_type,
  public.recurrence_interval,
  integer,
  date,
  date,
  text,
  date,
  smallint
);

-- Patch prepare_planner_schedule_core: inject goal.target_basis into all 4
-- inlined planner_schedule_item_matches_requirement call sites.
do $migration$
declare
  v_definition text;
  v_old_pattern text := 'private.planner_schedule_item_matches_requirement(';
  v_call_count integer;
begin
  select pg_catalog.pg_get_functiondef(
    'public.prepare_planner_schedule_core(jsonb,jsonb,text)'::regprocedure
  )
  into v_definition;

  v_call_count := (
    pg_catalog.length(v_definition)
    - pg_catalog.length(pg_catalog.replace(v_definition, v_old_pattern, ''))
  ) / pg_catalog.length(v_old_pattern);

  if v_call_count <> 4 then
    raise exception using
      errcode = '55000',
      message = 'unexpected_prepare_requirement_call_count: expected 4, got ' || v_call_count;
  end if;

  v_definition := pg_catalog.replace(
    v_definition,
    'goal.target_count,',
    'goal.target_count, goal.target_basis,'
  );

  execute v_definition;
end;
$migration$;

revoke all
on function public.prepare_planner_schedule_core(jsonb, jsonb, text)
from public, anon;

grant execute
on function public.prepare_planner_schedule_core(jsonb, jsonb, text)
to service_role;

create or replace function private.goal_xp_credited_units(
  p_user_id uuid,
  p_goal_id uuid,
  p_as_of date default current_date
)
returns table (
  source_key text,
  track_key text,
  event_type text,
  earned_on date,
  completion_id uuid,
  completion_source public.completion_source,
  xp_amount integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_goal public.goals%rowtype;
  v_as_of date := coalesce(p_as_of, current_date);
  v_credit_end date;
  v_target integer;
  v_interval public.recurrence_interval;
  v_period_target integer;
begin
  select *
  into v_goal
  from public.goals g
  where g.id = p_goal_id;

  if not found then
    return;
  end if;

  v_credit_end := least(v_as_of, coalesce(v_goal.end_date, v_as_of));
  if v_credit_end < v_goal.start_date then
    return;
  end if;

  if v_goal.frequency_type = 'fixed_milestones'::public.goal_frequency_type then
    v_target := greatest(1, coalesce(v_goal.target_count, 1));

    return query
    with admissible as (
      select
        c.id as completion_id,
        c.completed_on,
        c.source as completion_source,
        pg_catalog.row_number() over (
          order by c.completed_on asc, c.id asc
        ) as ordinal
      from public.completions c
      where c.user_id = p_user_id
        and c.goal_id = p_goal_id
        and c.completed_on between v_goal.start_date and v_credit_end
    ),
    credited as (
      select *
      from admissible
      where ordinal <= v_target
    )
    select
      ('milestone:' || credited.ordinal::text)::text as source_key,
      v_goal.category_key::text as track_key,
      'completion_credit'::text as event_type,
      credited.completed_on as earned_on,
      credited.completion_id,
      credited.completion_source,
      private.xp_points_for_completion_source(
        credited.completion_source,
        v_goal.difficulty
      ) as xp_amount
    from credited
    order by credited.ordinal asc;

    return query
    with admissible as (
      select
        c.id as completion_id,
        c.completed_on,
        c.source as completion_source,
        pg_catalog.row_number() over (
          order by c.completed_on asc, c.id asc
        ) as ordinal
      from public.completions c
      where c.user_id = p_user_id
        and c.goal_id = p_goal_id
        and c.completed_on between v_goal.start_date and v_credit_end
    ),
    credited as (
      select *
      from admissible
      where ordinal <= v_target
    )
    select
      'achievement'::text as source_key,
      v_goal.category_key::text as track_key,
      'goal_achievement'::text as event_type,
      pg_catalog.max(credited.completed_on) as earned_on,
      null::uuid as completion_id,
      null::public.completion_source as completion_source,
      private.xp_goal_achievement_points(v_goal.difficulty) as xp_amount
    from credited
    having pg_catalog.count(*) >= v_target;

    return;
  end if;

  if (
    v_goal.frequency_type = 'recurring'::public.goal_frequency_type
    and v_goal.target_basis = 'lifetime'::public.goal_target_basis
  ) then
    v_target := greatest(1, coalesce(v_goal.target_count, 1));

    return query
    with admissible as (
      select
        c.id as completion_id,
        c.completed_on,
        c.source as completion_source,
        pg_catalog.row_number() over (
          order by c.completed_on asc, c.id asc
        ) as ordinal
      from public.completions c
      where c.user_id = p_user_id
        and c.goal_id = p_goal_id
        and c.completed_on between v_goal.start_date and v_credit_end
    ),
    credited as (
      select *
      from admissible
      where ordinal <= v_target
    )
    select
      ('total:' || credited.ordinal::text)::text as source_key,
      v_goal.category_key::text as track_key,
      'completion_credit'::text as event_type,
      credited.completed_on as earned_on,
      credited.completion_id,
      credited.completion_source,
      private.xp_points_for_completion_source(
        credited.completion_source,
        v_goal.difficulty
      ) as xp_amount
    from credited
    order by credited.ordinal asc;

    return query
    with admissible as (
      select
        c.id as completion_id,
        c.completed_on,
        c.source as completion_source,
        pg_catalog.row_number() over (
          order by c.completed_on asc, c.id asc
        ) as ordinal
      from public.completions c
      where c.user_id = p_user_id
        and c.goal_id = p_goal_id
        and c.completed_on between v_goal.start_date and v_credit_end
    ),
    credited as (
      select *
      from admissible
      where ordinal <= v_target
    )
    select
      'achievement'::text as source_key,
      v_goal.category_key::text as track_key,
      'goal_achievement'::text as event_type,
      pg_catalog.max(credited.completed_on) as earned_on,
      null::uuid as completion_id,
      null::public.completion_source as completion_source,
      private.xp_goal_achievement_points(v_goal.difficulty) as xp_amount
    from credited
    having pg_catalog.count(*) >= v_target;

    return;
  end if;

  v_interval := coalesce(v_goal.recurrence_interval, 'daily'::public.recurrence_interval);
  v_period_target := coalesce(v_goal.target_count, 1);

  return query
  with admissible as (
    select
      c.id as completion_id,
      c.completed_on,
      c.source as completion_source,
      private.goal_period_key(v_goal.start_date, v_interval, c.completed_on) as period_key
    from public.completions c
    where c.user_id = p_user_id
      and c.goal_id = p_goal_id
      and c.completed_on between v_goal.start_date and v_credit_end
  ),
  ranked as (
    select
      a.completion_id,
      a.completed_on,
      a.completion_source,
      a.period_key,
      pg_catalog.row_number() over (
        partition by a.period_key
        order by a.completed_on asc, a.completion_id asc
      ) as slot
    from admissible a
  ),
  credited as (
    select *
    from ranked
    where slot <= v_period_target
  )
  select
    ('cadence:' || credited.period_key || ':' || credited.slot::text)::text as source_key,
    v_goal.category_key::text as track_key,
    'completion_credit'::text as event_type,
    credited.completed_on as earned_on,
    credited.completion_id,
    credited.completion_source,
    private.xp_points_for_completion_source(
      credited.completion_source,
      v_goal.difficulty
    ) as xp_amount
  from credited
  order by credited.period_key asc, credited.slot asc;
end;
$$;

revoke all on function private.goal_xp_credited_units(uuid, uuid, date)
from public, anon, authenticated;
grant execute on function private.goal_xp_credited_units(uuid, uuid, date)
to service_role;

drop function if exists private.goal_xp_credited_units(uuid, uuid);

drop function if exists public.create_goal(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  public.goal_frequency_type,
  public.recurrence_interval,
  integer,
  text[],
  date,
  date,
  text,
  uuid,
  boolean,
  public.goal_difficulty
);

create function public.create_goal(
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
  p_target_basis public.goal_target_basis default null
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
    is_deleted
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
    p_target_count,
    v_target_basis,
    p_milestone_names,
    p_start_date,
    p_end_date,
    p_default_local_time,
    p_team_id,
    coalesce(p_is_private, false),
    v_difficulty,
    false
  );

  return v_id;
end;
$$;

drop function if exists public.update_goal(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  public.goal_frequency_type,
  public.recurrence_interval,
  integer,
  text[],
  date,
  date,
  text,
  uuid,
  boolean,
  public.goal_difficulty
);

create function public.update_goal(
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
  p_target_basis public.goal_target_basis default null
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

  if v_old.frequency_type is distinct from p_frequency_type
    or v_old.recurrence_interval is distinct from p_recurrence_interval
    or v_old.target_count is distinct from p_target_count
    or v_old.target_basis is distinct from private.resolve_goal_target_basis(
      p_frequency_type,
      p_target_count,
      p_target_basis
    )
    or v_old.start_date is distinct from p_start_date then
    raise exception using
      errcode = '22023',
      message = 'goal definition fields are immutable after creation';
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
    or v_old.category_key is distinct from v_category_key;

  update public.goals
  set
    title = p_title,
    description = p_description,
    reward_text = p_reward_text,
    category = v_category,
    category_key = v_category_key,
    color = p_color,
    milestone_names = p_milestone_names,
    end_date = p_end_date,
    default_local_time = p_default_local_time,
    team_id = p_team_id,
    is_private = v_is_private,
    difficulty = v_difficulty
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
      nullif(v_item->>'target_basis', '')::public.goal_target_basis
    );
    v_ids := array_append(v_ids, v_id);
  end loop;

  return v_ids;
end;
$$;

revoke execute on function public.create_goal(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  public.goal_frequency_type,
  public.recurrence_interval,
  integer,
  text[],
  date,
  date,
  text,
  uuid,
  boolean,
  public.goal_difficulty,
  public.goal_target_basis
) from public, anon;

grant execute on function public.create_goal(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  public.goal_frequency_type,
  public.recurrence_interval,
  integer,
  text[],
  date,
  date,
  text,
  uuid,
  boolean,
  public.goal_difficulty,
  public.goal_target_basis
) to authenticated, service_role;

revoke execute on function public.update_goal(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  public.goal_frequency_type,
  public.recurrence_interval,
  integer,
  text[],
  date,
  date,
  text,
  uuid,
  boolean,
  public.goal_difficulty,
  public.goal_target_basis
) from public, anon;

grant execute on function public.update_goal(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  public.goal_frequency_type,
  public.recurrence_interval,
  integer,
  text[],
  date,
  date,
  text,
  uuid,
  boolean,
  public.goal_difficulty,
  public.goal_target_basis
) to authenticated, service_role;

create or replace function private.goals_default_target_basis()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.target_basis is null then
    new.target_basis := private.resolve_goal_target_basis(
      new.frequency_type,
      new.target_count,
      null
    );
  end if;
  return new;
end;
$$;

revoke all on function private.goals_default_target_basis()
from public, anon, authenticated;
grant execute on function private.goals_default_target_basis()
to service_role;

drop trigger if exists goals_default_target_basis on public.goals;
create trigger goals_default_target_basis
  before insert on public.goals
  for each row
  execute function private.goals_default_target_basis();
