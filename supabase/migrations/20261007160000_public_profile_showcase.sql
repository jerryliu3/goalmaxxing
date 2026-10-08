-- Public profile: a short bio, up to three showcase pins, and which current
-- goals visitors see. Visitors read through the server loader; the owner
-- writes everything through update_public_profile in one transaction.

alter table public.profiles
  add column bio text,
  add constraint profiles_bio_length
    check (bio is null or char_length(bio) <= 140);

alter table public.goals
  add column featured_on_profile boolean not null default true;

create table public.profile_showcase_pins (
  user_id uuid not null references public.profiles(id) on delete cascade,
  slot smallint not null check (slot between 1 and 3),
  kind text not null check (kind in ('medal', 'goal', 'record')),
  ref text not null check (char_length(ref) between 1 and 64),
  created_at timestamptz not null default pg_catalog.now(),
  primary key (user_id, slot),
  unique (user_id, kind, ref)
);

alter table public.profile_showcase_pins enable row level security;

create policy profile_showcase_pins_owner_select
  on public.profile_showcase_pins
  for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.profile_showcase_pins from anon, authenticated;
grant select on public.profile_showcase_pins to authenticated;

create function public.update_public_profile(
  p_bio text,
  p_pins jsonb,
  p_featured_goal_ids uuid[],
  p_hidden_goal_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_bio text := nullif(pg_catalog.btrim(coalesce(p_bio, '')), '');
  v_featured uuid[] := coalesce(p_featured_goal_ids, '{}');
  v_hidden uuid[] := coalesce(p_hidden_goal_ids, '{}');
  v_pin jsonb;
  v_kind text;
  v_ref text;
  v_slot smallint := 0;
  v_uuid_pattern constant text :=
    '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;
  if v_bio is not null and char_length(v_bio) > 140 then
    raise exception using errcode = '22023', message = 'bio_too_long';
  end if;
  if p_pins is null
    or pg_catalog.jsonb_typeof(p_pins) <> 'array'
    or pg_catalog.jsonb_array_length(p_pins) > 3 then
    raise exception using errcode = '22023', message = 'invalid_showcase_pins';
  end if;
  if v_featured && v_hidden then
    raise exception using errcode = '22023', message = 'invalid_featured_goals';
  end if;
  if exists (
    select 1
    from pg_catalog.unnest(v_featured || v_hidden) as requested(goal_id)
    where not exists (
      select 1 from public.goals g
      where g.id = requested.goal_id and g.owner_id = v_uid and not g.is_deleted
    )
  ) then
    raise exception using errcode = 'P0001', message = 'goal_not_found';
  end if;
  if exists (
    select 1 from public.goals g
    where g.id = any(v_featured) and g.is_private
  ) then
    raise exception using errcode = '22023', message = 'private_goal_not_featurable';
  end if;

  update public.profiles set bio = v_bio where id = v_uid;

  delete from public.profile_showcase_pins where user_id = v_uid;
  for v_pin in select value from pg_catalog.jsonb_array_elements(p_pins) loop
    v_slot := v_slot + 1;
    v_kind := v_pin ->> 'kind';
    v_ref := v_pin ->> 'ref';
    if v_ref is null or not (
      (v_kind = 'medal' and v_ref ~ v_uuid_pattern and exists (
        select 1 from public.user_awards a
        where a.id = v_ref::uuid and a.user_id = v_uid and a.revoked_at is null
      ))
      or (v_kind = 'goal' and v_ref ~ v_uuid_pattern and exists (
        select 1 from public.goals g
        where g.id = v_ref::uuid and g.owner_id = v_uid
          and not g.is_deleted and not g.is_private
      ))
      or (v_kind = 'record' and v_ref ~ '^rec-[a-z]{1,32}$')
    ) then
      raise exception using errcode = '22023', message = 'invalid_showcase_pin';
    end if;
    begin
      insert into public.profile_showcase_pins (user_id, slot, kind, ref)
      values (v_uid, v_slot, v_kind, v_ref);
    exception when unique_violation then
      raise exception using errcode = '22023', message = 'invalid_showcase_pins';
    end;
  end loop;

  update public.goals set featured_on_profile = true
  where owner_id = v_uid and id = any(v_featured) and not featured_on_profile;
  update public.goals set featured_on_profile = false
  where owner_id = v_uid and id = any(v_hidden) and featured_on_profile;
end;
$$;

revoke all on function public.update_public_profile(text, jsonb, uuid[], uuid[])
  from public, anon;
grant execute on function public.update_public_profile(text, jsonb, uuid[], uuid[])
  to authenticated;
