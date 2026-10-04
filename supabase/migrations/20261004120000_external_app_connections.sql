-- A separate account approval allows immediate API disconnection even while a
-- previously issued OAuth access JWT has not expired. Only direct sessions can
-- approve or revoke connections; an OAuth client cannot authorize itself.
create table public.external_app_connections (
  owner_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null,
  client_name text not null check (char_length(client_name) between 1 and 200),
  connected_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (owner_id, client_id)
);
alter table public.external_app_connections enable row level security;
create policy external_connections_read on public.external_app_connections
  for select to authenticated using (owner_id = (select auth.uid()));
create policy external_connections_insert on public.external_app_connections
  for insert to authenticated with check (
    owner_id = (select auth.uid()) and (select auth.jwt()->>'client_id') is null
  );
create policy external_connections_update on public.external_app_connections
  for update to authenticated using (
    owner_id = (select auth.uid()) and (select auth.jwt()->>'client_id') is null
  ) with check (
    owner_id = (select auth.uid()) and (select auth.jwt()->>'client_id') is null
  );
revoke all on public.external_app_connections from anon, authenticated;
grant select, insert, update on public.external_app_connections to authenticated;
grant all on public.external_app_connections to service_role;

-- Use the database clock on every approval, including ON CONFLICT updates.
-- This makes reconnection a new activation even when PostgREST only updates
-- the columns present in the consent upsert.
create function private.stamp_external_connection_approval()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.revoked_at is null then new.connected_at := pg_catalog.clock_timestamp(); end if;
  return new;
end;
$$;
revoke all on function private.stamp_external_connection_approval() from public, anon, authenticated;
create trigger stamp_external_connection_approval
  before insert or update on public.external_app_connections
  for each row execute function private.stamp_external_connection_approval();
