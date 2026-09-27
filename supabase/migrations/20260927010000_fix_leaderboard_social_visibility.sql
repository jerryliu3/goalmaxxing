-- Keep private social profiles out of refreshed leaderboard data.
-- The original refresh and read functions predate the profile visibility
-- contract and can leave hidden rows in active standings.

alter function public.refresh_leaderboard_standings_service()
rename to refresh_leaderboard_standings_unfiltered;

create function public.refresh_leaderboard_standings_service()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows integer := 0;
begin
  perform public.refresh_leaderboard_standings_unfiltered();

  delete from public.leaderboard_standings standing
  where (
    standing.subject_kind = 'user'::public.social_subject_kind
    and not exists (
      select 1
      from public.profiles profile
      where profile.id = standing.subject_id
        and profile.social_activity_visible
    )
  )
  or (
    standing.subject_kind = 'team'::public.social_subject_kind
    and not exists (
      select 1
      from public.teams team
      join public.profiles member_a on member_a.id = team.user_a_id
      join public.profiles member_b on member_b.id = team.user_b_id
      where team.id = standing.subject_id
        and member_a.social_activity_visible
        and member_b.social_activity_visible
    )
  );

  with ranked as (
    select
      standing.season_id,
      standing.subject_kind,
      standing.subject_id,
      dense_rank() over (
        partition by standing.season_id, standing.subject_kind
        order by standing.score desc, standing.tie_break_at asc nulls last, standing.subject_id asc
      )::integer as next_rank
    from public.leaderboard_standings standing
  )
  update public.leaderboard_standings standing
  set rank = ranked.next_rank
  from ranked
  where standing.season_id = ranked.season_id
    and standing.subject_kind = ranked.subject_kind
    and standing.subject_id = ranked.subject_id;

  select count(*)::integer
  into v_rows
  from public.leaderboard_standings;
  return v_rows;
end;
$$;

revoke all on function public.refresh_leaderboard_standings_unfiltered()
from public, anon, authenticated;
revoke all on function public.refresh_leaderboard_standings_service()
from public, anon, authenticated;
grant execute on function public.refresh_leaderboard_standings_service()
to service_role;
