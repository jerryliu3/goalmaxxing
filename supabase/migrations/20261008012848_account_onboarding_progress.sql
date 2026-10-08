create table public.user_onboarding_progress (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  setup_step smallint not null default 0 check (setup_step between 0 and 3),
  tours jsonb not null default '{}'::jsonb check (jsonb_typeof(tours) = 'object')
);
alter table public.user_onboarding_progress enable row level security;
create policy onboarding_read_own on public.user_onboarding_progress for select to authenticated
  using ((select auth.uid()) = user_id);
revoke all on public.user_onboarding_progress from public, anon, authenticated;
grant select on public.user_onboarding_progress to authenticated;

-- This is the sole write boundary. Completion and progress never move backwards,
-- including when two devices finish or advance concurrently.
create function public.update_onboarding_progress(p_action text, p_step integer default null, p_guide text default null, p_status text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_row public.user_onboarding_progress%rowtype;
  v_key text;
  v_completed_at timestamptz;
begin
  if v_user is null then raise exception 'UNAUTHORIZED' using errcode = '42501'; end if;
  if p_action is null or p_action not in ('advance', 'complete', 'tour', 'skip-tours') then
    raise exception 'INVALID_ONBOARDING_ACTION' using errcode = '22023';
  end if;
  insert into public.user_onboarding_progress(user_id) values (v_user) on conflict (user_id) do nothing;
  select * into strict v_row from public.user_onboarding_progress where user_id = v_user for update;
  select onboarding_completed_at into strict v_completed_at from public.profiles where id = v_user for update;
  if v_completed_at is not null then v_row.setup_step := 3; end if;
  if p_action = 'advance' then
    if p_step is null or p_step not between 1 and 3 then raise exception 'INVALID_ONBOARDING_STEP' using errcode = '22023'; end if;
    -- Sequential advancement prevents a stale request from bypassing a step.
    if p_step > v_row.setup_step + 1 then raise exception 'ONBOARDING_SETUP_INCOMPLETE'; end if;
    v_row.setup_step := greatest(v_row.setup_step, p_step);
  elsif p_action = 'complete' then
    if v_row.setup_step <> 3 then raise exception 'ONBOARDING_SETUP_INCOMPLETE'; end if;
    v_completed_at := coalesce(v_completed_at, now());
    update public.profiles set onboarding_completed_at = v_completed_at where id = v_user;
  else
    if v_completed_at is null then raise exception 'ONBOARDING_SETUP_INCOMPLETE'; end if;
    if p_action = 'tour' then
      if p_guide is null or p_guide not in ('app.tabs', 'planner.calendar', 'insights.main', 'social.main')
        or p_status is null or p_status not in ('complete', 'skipped') then
        raise exception 'INVALID_ONBOARDING_TOUR' using errcode = '22023';
      end if;
      v_row.tours := v_row.tours || jsonb_build_object(p_guide, p_status);
    else
      foreach v_key in array array['app.tabs', 'planner.calendar', 'insights.main', 'social.main'] loop
        if not (v_row.tours ? v_key) then v_row.tours := v_row.tours || jsonb_build_object(v_key, 'skipped'); end if;
      end loop;
    end if;
  end if;
  update public.user_onboarding_progress set setup_step = v_row.setup_step, tours = v_row.tours where user_id = v_user;
  return jsonb_build_object('setup_step', v_row.setup_step, 'completed_at', v_completed_at, 'tours', v_row.tours);
end;
$$;
revoke all on function public.update_onboarding_progress(text, integer, text, text) from public, anon;
grant execute on function public.update_onboarding_progress(text, integer, text, text) to authenticated;
