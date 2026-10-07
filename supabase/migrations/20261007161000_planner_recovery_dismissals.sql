-- "Let it go" on a slipped session. Keyed by goal and missed date because
-- set_planner_schedule rewrites rows and may renumber unit keys; the goal-day
-- pair is unique for planner items and stays stable for a missed session.

create table public.planner_recovery_dismissals (
  goal_id uuid not null references public.goals (id) on delete cascade,
  missed_on date not null,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  primary key (goal_id, missed_on)
);

create index planner_recovery_dismissals_owner_idx
  on public.planner_recovery_dismissals (owner_id);

alter table public.planner_recovery_dismissals enable row level security;

create policy planner_recovery_dismissals_owner_select
  on public.planner_recovery_dismissals
  for select to authenticated
  using (owner_id = (select auth.uid()));

revoke all on public.planner_recovery_dismissals from anon, authenticated;
grant select on public.planner_recovery_dismissals to authenticated;

-- Recovery mode saves every let-go at once: all rows or none.
-- p_dismissals: [{ "goal_id": uuid, "missed_on": date }, ...]
create or replace function public.dismiss_planner_recovery_sessions(p_dismissals jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;
  if p_dismissals is null
    or jsonb_typeof(p_dismissals) <> 'array'
    or jsonb_array_length(p_dismissals) = 0
    or exists (
      select 1 from jsonb_to_recordset(p_dismissals) as d (goal_id uuid, missed_on date)
      where d.goal_id is null or d.missed_on is null
    )
  then
    raise exception using errcode = '22023', message = 'invalid_recovery_dismissal';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(p_dismissals) as d (goal_id uuid, missed_on date)
    where not exists (
      select 1 from public.goals g
      where g.id = d.goal_id and g.owner_id = v_uid and g.is_deleted = false
    )
  ) then
    raise exception using errcode = 'P0001', message = 'goal_not_found';
  end if;

  insert into public.planner_recovery_dismissals (goal_id, missed_on, owner_id)
  select distinct d.goal_id, d.missed_on, v_uid
  from jsonb_to_recordset(p_dismissals) as d (goal_id uuid, missed_on date)
  on conflict (goal_id, missed_on) do nothing;
end;
$$;

revoke all on function public.dismiss_planner_recovery_sessions(jsonb) from public, anon;
grant execute on function public.dismiss_planner_recovery_sessions(jsonb) to authenticated;
