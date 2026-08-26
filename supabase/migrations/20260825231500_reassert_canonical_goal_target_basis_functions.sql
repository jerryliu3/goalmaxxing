-- Reassert canonical goal target-basis helpers with explicit function bodies.
-- This migration replaces prior string-patch follow-ups for the resolver surface.

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

revoke all on function private.goal_period_target_max(
  public.recurrence_interval
) from public, anon, authenticated;
grant execute on function private.goal_period_target_max(
  public.recurrence_interval
) to service_role;

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
