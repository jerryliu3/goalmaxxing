-- Leaving a challenge is permitted until the challenge is over.
--
-- `leave_challenge_service` previously refused to remove a participant whose
-- row already had `completed_at` set: the DELETE filtered on
-- `completed_at is null`, and the surviving row then tripped an explicit
-- `challenge_not_leaveable` guard. That fires for anyone who reached the
-- target, because the progress refresh cron stamps `completed_at` while the
-- challenge is still running, so finishers were permanently enrolled.
--
-- Membership is the member's own choice while a challenge is live, so
-- completion no longer blocks leaving. A finished challenge is a historical
-- record rather than a membership, so leaving is refused once the challenge is
-- over. "Over" is the end of the window or a terminal status, checked together
-- so the answer does not depend on whether the status refresh cron has caught
-- up with `ends_at` yet. This matches the join window in
-- `join_challenge_service`.
--
-- Reward XP lives in `public.xp_ledger` keyed by
-- (user_id, event_type, source_key), so dropping the participant row neither
-- revokes XP already granted nor lets a re-join award it a second time.

create or replace function public.leave_challenge_service(
  p_challenge_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_status public.challenge_status;
  v_ends_at timestamptz;
  v_subject_kind public.social_subject_kind;
  v_subject_id uuid;
begin
  if v_uid is null then
    raise exception using errcode = '28000', message = 'authentication_required';
  end if;
  if p_challenge_id is null then
    raise exception using errcode = '22023', message = 'challenge_id_required';
  end if;

  select challenge.status, challenge.ends_at, challenge.subject_kind
  into v_status, v_ends_at, v_subject_kind
  from public.challenges challenge
  where challenge.id = p_challenge_id;

  if not found then
    raise exception using errcode = '22023', message = 'challenge_not_found';
  end if;

  if v_status in ('closed', 'archived') or v_ends_at <= pg_catalog.now() then
    raise exception using errcode = '22023', message = 'challenge_already_ended';
  end if;

  if v_subject_kind = 'user'::public.social_subject_kind then
    v_subject_id := v_uid;
  else
    v_subject_id := private.active_team_for_user(v_uid);
    if v_subject_id is null then
      raise exception using errcode = '22023', message = 'team_required';
    end if;
  end if;

  delete from public.challenge_participants participant
  where participant.challenge_id = p_challenge_id
    and participant.subject_kind = v_subject_kind
    and participant.subject_id = v_subject_id;

  return true;
end;
$$;

revoke all on function public.leave_challenge_service(uuid)
  from public, anon;
grant execute on function public.leave_challenge_service(uuid)
  to authenticated;
