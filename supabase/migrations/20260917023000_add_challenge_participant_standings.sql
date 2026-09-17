create or replace function public.get_challenge_standings(
  p_challenge_id uuid,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  challenge_id uuid,
  subject_kind public.social_subject_kind,
  subject_id uuid,
  display_name text,
  avatar_url text,
  score numeric,
  rank integer,
  is_viewer boolean,
  total_count integer
)
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 100);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_subject_kind public.social_subject_kind;
  v_audience_kind public.social_audience_kind;
  v_cohort_id uuid;
  v_viewer_subject_id uuid;
begin
  if v_uid is null then
    raise exception using errcode = '28000', message = 'authentication_required';
  end if;
  if p_challenge_id is null then
    raise exception using errcode = '22023', message = 'challenge_id_required';
  end if;

  select challenge.subject_kind, challenge.audience_kind, challenge.cohort_id
  into v_subject_kind, v_audience_kind, v_cohort_id
  from public.challenges challenge
  where challenge.id = p_challenge_id;

  if not found then
    raise exception using errcode = '22023', message = 'challenge_not_found';
  end if;

  if v_audience_kind <> 'global'::public.social_audience_kind
    and not private.viewer_in_cohort(v_uid, v_cohort_id) then
    raise exception using errcode = '42501', message = 'cohort_membership_required';
  end if;

  if v_subject_kind = 'user'::public.social_subject_kind then
    v_viewer_subject_id := v_uid;
  else
    v_viewer_subject_id := private.active_team_for_user(v_uid);
  end if;

  if v_viewer_subject_id is null or not exists (
    select 1
    from public.challenge_participants participant
    where participant.challenge_id = p_challenge_id
      and participant.subject_kind = v_subject_kind
      and participant.subject_id = v_viewer_subject_id
  ) then
    raise exception using errcode = '42501', message = 'challenge_join_required';
  end if;

  return query
  with ranked as (
    select
      participant.challenge_id,
      participant.subject_kind,
      participant.subject_id,
      participant.progress_value,
      row_number() over (
        order by
          participant.progress_value desc,
          participant.progress_at asc nulls last,
          participant.joined_at asc,
          participant.subject_id asc
      )::integer as standing_rank
    from public.challenge_participants participant
    where participant.challenge_id = p_challenge_id
      and participant.subject_kind = v_subject_kind
  ),
  visible as (
    select
      ranked.challenge_id,
      ranked.subject_kind,
      ranked.subject_id,
      case
        when ranked.subject_kind = 'team'::public.social_subject_kind then
          private.team_display_name(ranked.subject_id)
        else
          coalesce(profile.display_name, profile.username, 'Unknown')
      end as display_name,
      case
        when ranked.subject_kind = 'user'::public.social_subject_kind then
          profile.avatar_url
        else
          null::text
      end as avatar_url,
      ranked.progress_value,
      ranked.standing_rank,
      ranked.subject_id = v_viewer_subject_id as is_viewer
    from ranked
    left join public.profiles profile
      on ranked.subject_kind = 'user'::public.social_subject_kind
      and profile.id = ranked.subject_id
    where ranked.subject_id = v_viewer_subject_id
      or (
        ranked.subject_kind = 'user'::public.social_subject_kind
        and coalesce(profile.social_activity_visible, false) = true
      )
      or (
        ranked.subject_kind = 'team'::public.social_subject_kind
        and private.team_all_members_socially_visible(ranked.subject_id)
      )
  )
  select
    visible.challenge_id,
    visible.subject_kind,
    visible.subject_id,
    visible.display_name,
    visible.avatar_url,
    visible.progress_value,
    visible.standing_rank,
    visible.is_viewer,
    count(*) over ()::integer
  from visible
  order by visible.standing_rank asc
  limit v_limit
  offset v_offset;
end;
$$;

revoke all on function public.get_challenge_standings(uuid, integer, integer)
from public, anon;
grant execute on function public.get_challenge_standings(uuid, integer, integer)
to authenticated;
