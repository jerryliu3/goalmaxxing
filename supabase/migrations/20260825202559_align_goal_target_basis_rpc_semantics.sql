-- Align direct goal RPC defaults with the client target-basis contract.
-- This is forward-only: the earlier resolver signature is retired after all
-- dependent public functions have been recreated.

create or replace function private.goal_period_target_max(
  p_recurrence_interval public.recurrence_interval
)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_recurrence_interval
    when 'weekly'::public.recurrence_interval then 7
    when 'monthly'::public.recurrence_interval then 31
    else 1
  end;
$$;

revoke all on function private.goal_period_target_max(
  public.recurrence_interval
) from public, anon, authenticated;
grant execute on function private.goal_period_target_max(
  public.recurrence_interval
) to service_role;

create or replace function private.resolve_goal_target_basis(
  p_frequency_type public.goal_frequency_type,
  p_recurrence_interval public.recurrence_interval,
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
      and p_target_count > private.goal_period_target_max(p_recurrence_interval) then
      'lifetime'::public.goal_target_basis
    else
      'period'::public.goal_target_basis
  end;
$$;

revoke all on function private.resolve_goal_target_basis(
  public.goal_frequency_type,
  public.recurrence_interval,
  integer,
  public.goal_target_basis
) from public, anon, authenticated;
grant execute on function private.resolve_goal_target_basis(
  public.goal_frequency_type,
  public.recurrence_interval,
  integer,
  public.goal_target_basis
) to service_role;

create or replace function private.normalize_goal_target_count(
  p_frequency_type public.goal_frequency_type,
  p_recurrence_interval public.recurrence_interval,
  p_target_count integer,
  p_target_basis public.goal_target_basis
)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case
    when p_frequency_type = 'recurring'::public.goal_frequency_type
      and private.resolve_goal_target_basis(
        p_frequency_type,
        p_recurrence_interval,
        p_target_count,
        p_target_basis
      ) = 'period'::public.goal_target_basis
      then coalesce(p_target_count, 1)
    else p_target_count
  end;
$$;

revoke all on function private.normalize_goal_target_count(
  public.goal_frequency_type,
  public.recurrence_interval,
  integer,
  public.goal_target_basis
) from public, anon, authenticated;
grant execute on function private.normalize_goal_target_count(
  public.goal_frequency_type,
  public.recurrence_interval,
  integer,
  public.goal_target_basis
) to service_role;

-- The public functions were created by the preceding target-basis migration
-- and then made idempotent by the latest recovery migration. Recreate their
-- stored bodies in place so no caller can resolve the retired three-argument
-- helper at runtime.
do $migration$
declare
  v_definition text;
begin
  select pg_catalog.pg_get_functiondef(
    'public.create_goal(uuid,text,text,text,text,text,text,public.goal_frequency_type,public.recurrence_interval,integer,text[],date,date,text,uuid,boolean,public.goal_difficulty,public.goal_target_basis)'::regprocedure
  )
  into v_definition;

  v_definition := pg_catalog.regexp_replace(
    v_definition,
    'private[.]resolve_goal_target_basis[(][[:space:]]*p_frequency_type,[[:space:]]*p_target_count,[[:space:]]*p_target_basis[[:space:]]*[)]',
    'private.resolve_goal_target_basis(p_frequency_type, p_recurrence_interval, p_target_count, p_target_basis)',
    1,
    0,
    'n'
  );
  v_definition := pg_catalog.regexp_replace(
    v_definition,
    'private[.]resolve_goal_target_basis[(][[:space:]]*p_frequency_type,[[:space:]]*p_recurrence_interval,[[:space:]]*p_target_count,[[:space:]]*p_target_basis[[:space:]]*[)]',
    'private.resolve_goal_target_basis(p_frequency_type, p_recurrence_interval, p_target_count, p_target_basis)',
    1,
    0,
    'n'
  );
  if pg_catalog.strpos(
    v_definition,
    'private.resolve_goal_target_basis(p_frequency_type, p_recurrence_interval, p_target_count, p_target_basis)'
  ) = 0 then
    raise exception using
      errcode = '55000',
      message = 'create_goal target-basis resolver rewrite did not match';
  end if;
  execute v_definition;

  select pg_catalog.pg_get_functiondef(
    'public.update_goal(uuid,text,text,text,text,text,text,public.goal_frequency_type,public.recurrence_interval,integer,text[],date,date,text,uuid,boolean,public.goal_difficulty,public.goal_target_basis)'::regprocedure
  )
  into v_definition;

  v_definition := pg_catalog.regexp_replace(
    v_definition,
    'private[.]resolve_goal_target_basis[(][[:space:]]*p_frequency_type,[[:space:]]*p_target_count,[[:space:]]*p_target_basis[[:space:]]*[)]',
    'private.resolve_goal_target_basis(p_frequency_type, p_recurrence_interval, p_target_count, p_target_basis)',
    1,
    0,
    'n'
  );
  v_definition := pg_catalog.regexp_replace(
    v_definition,
    'private[.]resolve_goal_target_basis[(][[:space:]]*p_frequency_type,[[:space:]]*p_recurrence_interval,[[:space:]]*p_target_count,[[:space:]]*p_target_basis[[:space:]]*[)]',
    'private.resolve_goal_target_basis(p_frequency_type, p_recurrence_interval, p_target_count, p_target_basis)',
    1,
    0,
    'n'
  );
  v_definition := pg_catalog.replace(
    v_definition,
    'v_old.target_count is distinct from p_target_count',
    'v_old.target_count is distinct from private.normalize_goal_target_count(' ||
      'p_frequency_type, p_recurrence_interval, p_target_count, p_target_basis)'
  );
  if pg_catalog.strpos(
    v_definition,
    'private.resolve_goal_target_basis(p_frequency_type, p_recurrence_interval, p_target_count, p_target_basis)'
  ) = 0
    or pg_catalog.strpos(
      v_definition,
      'private.normalize_goal_target_count('
    ) = 0 then
    raise exception using
      errcode = '55000',
      message = 'update_goal target-basis resolver rewrite did not match';
  end if;
  execute v_definition;
end;
$migration$;

drop function if exists private.resolve_goal_target_basis(
  public.goal_frequency_type,
  integer,
  public.goal_target_basis
);

-- Raw service-role inserts and the public create RPC both pass this boundary.
-- Period goals therefore cannot retain a null target, while fixed milestones
-- remain lifetime-based and explicit recurring bases remain untouched.
create or replace function private.goals_default_target_basis()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.target_basis is null then
    new.target_basis := private.resolve_goal_target_basis(
      new.frequency_type,
      new.recurrence_interval,
      new.target_count,
      null
    );
  end if;
  new.target_count := private.normalize_goal_target_count(
    new.frequency_type,
    new.recurrence_interval,
    new.target_count,
    new.target_basis
  );
  return new;
end;
$$;

revoke all on function private.goals_default_target_basis()
from public, anon, authenticated;
grant execute on function private.goals_default_target_basis()
to service_role;

drop trigger if exists goals_default_target_basis on public.goals;
create trigger goals_default_target_basis
  before insert or update on public.goals
  for each row
  execute function private.goals_default_target_basis();
