-- Until the owner saves the card, the loader fills a blank bio, and any pin
-- category they have not saved. A bio they already wrote is left as-is.
-- Saving, including a cleared bio or an empty pin list, marks the card
-- configured so those defaults stay gone. Existing rows stay unconfigured:
-- a written bio is not the same as having saved this card.

alter table public.profiles
  add column profile_card_configured boolean not null default false;

create or replace function public.update_public_profile(
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
  v_bio text := pg_catalog.btrim(coalesce(p_bio, ''));
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
  if char_length(v_bio) > 140 then
    raise exception using errcode = '22023', message = 'bio_too_long';
  end if;
  if p_pins is null
    or pg_catalog.jsonb_typeof(p_pins) <> 'array'
    or (
      select pg_catalog.count(*) filter (where pin ->> 'kind' = 'record') > 3
        or pg_catalog.count(*) filter (where pin ->> 'kind' is distinct from 'record') > 3
      from pg_catalog.jsonb_array_elements(p_pins) as pins(pin)
    ) then
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

  update public.profiles
  set bio = v_bio, profile_card_configured = true
  where id = v_uid;

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
