alter table public.profiles
  drop constraint if exists profiles_avatar_url_storage_public_prefix;

alter table public.profiles
  add constraint profiles_avatar_url_allowed_origin
  check (
    avatar_url is null
    or avatar_url ~ '^https?://[^/]+/storage/v1/object/public/avatars/[^[:space:]]+$'
    or avatar_url ~ '^https://randomuser\.me/api/portraits/(men|women)/[0-9]+\.jpg$'
    or avatar_url ~ '^https://api\.dicebear\.com/[0-9]+\.x/[a-z0-9-]+/png\?seed=[A-Za-z0-9_-]+$'
    or avatar_url ~ '^https://placedog\.net/[0-9]+/[0-9]+\?id=[0-9]+$'
  ) not valid;

create or replace function private.synthetic_avatar_url(p_user_id uuid)
returns text
language sql
immutable
set search_path = ''
as $$
  select case (
    (('x' || substr(md5(p_user_id::text), 1, 8))::bit(32)::int & 2147483647) % 5
  )
    when 0 then null::text
    when 1 then format(
      'https://randomuser.me/api/portraits/men/%s.jpg',
      (array[3,8,16,21,29,37,42,51,58,66,73,84,91,96])[
        1 + ((('x' || substr(md5(p_user_id::text), 9, 8))::bit(32)::int & 2147483647) % 14)
      ]
    )
    when 2 then format(
      'https://randomuser.me/api/portraits/women/%s.jpg',
      (array[4,9,17,23,31,38,43,52,59,67,74,85,92,97])[
        1 + ((('x' || substr(md5(p_user_id::text), 9, 8))::bit(32)::int & 2147483647) % 14)
      ]
    )
    when 3 then format(
      'https://api.dicebear.com/9.x/%s/png?seed=syn%s',
      (array['adventurer','lorelei','croodles','notionists','fun-emoji'])[
        1 + ((('x' || substr(md5(p_user_id::text), 17, 8))::bit(32)::int & 2147483647) % 5)
      ],
      replace(p_user_id::text, '-', '')
    )
    else format(
      'https://placedog.net/200/200?id=%s',
      1 + ((('x' || substr(md5(p_user_id::text), 25, 7) || '0')::bit(32)::int & 2147483647) % 50)
    )
  end;
$$;

revoke all on function private.synthetic_avatar_url(uuid)
  from public, anon, authenticated;
grant execute on function private.synthetic_avatar_url(uuid)
  to postgres, service_role;

create or replace function private.sync_synthetic_avatar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set avatar_url = private.synthetic_avatar_url(new.user_id)
  where id = new.user_id;
  return new;
end;
$$;

revoke all on function private.sync_synthetic_avatar()
  from public, anon, authenticated;
grant execute on function private.sync_synthetic_avatar()
  to postgres, service_role;

drop trigger if exists sync_synthetic_avatar on public.synthetic_users;
create trigger sync_synthetic_avatar
after insert or update of user_id on public.synthetic_users
for each row
execute function private.sync_synthetic_avatar();

update public.profiles as profile
set avatar_url = private.synthetic_avatar_url(profile.id)
from public.synthetic_users as synthetic
where synthetic.user_id = profile.id;
