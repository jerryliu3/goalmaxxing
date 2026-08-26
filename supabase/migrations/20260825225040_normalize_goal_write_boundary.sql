-- Soft-deleted goals must not retain credited XP. The write-boundary helper is
-- also used by archive and editable-goal updates, so derive force-zero from
-- the canonical goal row instead of changing those callers.
create or replace function private.recompute_xp_for_goal_users(
  p_goal_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  v_force_zero boolean := false;
begin
  select coalesce(g.is_deleted, false)
  into v_force_zero
  from public.goals g
  where g.id = p_goal_id;

  for r in
    select distinct c.user_id
    from public.completions c
    where c.goal_id = p_goal_id
  loop
    if private.xp_skip_for_profile_delete(r.user_id) then
      continue;
    end if;

    perform public.recompute_goal_xp_service(
      r.user_id,
      p_goal_id,
      v_force_zero
    );
  end loop;
end;
$$;

revoke all on function private.recompute_xp_for_goal_users(uuid)
from public, anon, authenticated;
grant execute on function private.recompute_xp_for_goal_users(uuid)
to service_role;
