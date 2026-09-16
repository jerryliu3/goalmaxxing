-- Daily / weekly first-open digest: owner-scoped rows, opt-out, and AI quota feature.

alter table public.profiles
  add column if not exists digest_auto_show boolean;

update public.profiles
set digest_auto_show = true
where digest_auto_show is null;

alter table public.profiles
  alter column digest_auto_show set default true;

alter table public.profiles
  alter column digest_auto_show set not null;

create table if not exists public.user_digests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  period_key date not null,
  facts jsonb not null default '{}'::jsonb,
  suggestions jsonb,
  acknowledged_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint user_digests_kind_check
    check (kind in ('daily', 'weekly')),
  constraint user_digests_owner_period_key
    unique (owner_id, kind, period_key)
);

create index if not exists user_digests_owner_period_idx
on public.user_digests (owner_id, period_key desc);

drop trigger if exists user_digests_set_updated_at on public.user_digests;
create trigger user_digests_set_updated_at
before update on public.user_digests
for each row execute function public.set_updated_at();

alter table public.user_digests enable row level security;

drop policy if exists user_digests_select_own on public.user_digests;
create policy user_digests_select_own
on public.user_digests
for select
to authenticated
using (auth.uid() = owner_id);

drop policy if exists user_digests_insert_own on public.user_digests;
create policy user_digests_insert_own
on public.user_digests
for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists user_digests_update_own on public.user_digests;
create policy user_digests_update_own
on public.user_digests
for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

revoke all on table public.user_digests from public, anon;
grant select, insert, update on table public.user_digests to authenticated;

alter table public.planner_ai_usage_daily
  drop constraint if exists planner_ai_usage_daily_feature;

alter table public.planner_ai_usage_daily
  add constraint planner_ai_usage_daily_feature
    check (feature in ('planner_coach', 'bulk_parser', 'digest'));

create or replace function public.consume_planner_ai_quota(
  p_owner uuid,
  p_feature text,
  p_limit integer default 20,
  p_input_tokens bigint default 0
)
returns table (
  quota_usage_date date,
  allowed boolean,
  request_count integer,
  remaining integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_usage_date date := (v_now at time zone 'UTC')::date;
  v_retry_after integer :=
    greatest(
      1,
      pg_catalog.ceil(
        extract(
          epoch from (
            ((v_usage_date + 1)::timestamp) - (v_now at time zone 'UTC')
          )
        )
      )::integer
    );
begin
  if p_owner is null then
    raise exception using
      errcode = '22023',
      message = 'quota owner is required';
  end if;

  if p_feature not in ('planner_coach', 'bulk_parser', 'digest') then
    raise exception using
      errcode = '22023',
      message = 'unknown planner AI quota feature';
  end if;

  if p_limit < 1 or p_limit > 100 then
    raise exception using
      errcode = '22023',
      message = 'planner AI quota limit must be between 1 and 100';
  end if;

  if p_input_tokens < 0 or p_input_tokens > 1000000000000 then
    raise exception using
      errcode = '22023',
      message = 'invalid planner AI input token count';
  end if;

  return query
  insert into public.planner_ai_usage_daily (
    owner_id,
    usage_date,
    feature,
    request_count,
    input_tokens,
    output_tokens,
    updated_at
  )
  values (
    p_owner,
    v_usage_date,
    p_feature,
    1,
    p_input_tokens,
    0,
    pg_catalog.now()
  )
  on conflict (owner_id, usage_date, feature) do update
  set request_count =
        public.planner_ai_usage_daily.request_count + 1,
      input_tokens =
        public.planner_ai_usage_daily.input_tokens + excluded.input_tokens,
      updated_at = pg_catalog.now()
  where public.planner_ai_usage_daily.request_count < p_limit
  returning
    public.planner_ai_usage_daily.usage_date,
    true,
    public.planner_ai_usage_daily.request_count,
    p_limit - public.planner_ai_usage_daily.request_count,
    0;

  if found then
    return;
  end if;

  return query
  select
    usage.usage_date,
    false,
    usage.request_count,
    greatest(p_limit - usage.request_count, 0),
    v_retry_after
  from public.planner_ai_usage_daily usage
  where usage.owner_id = p_owner
    and usage.usage_date = v_usage_date
    and usage.feature = p_feature;
end;
$$;

create or replace function public.record_planner_ai_output_tokens(
  p_owner uuid,
  p_usage_date date,
  p_feature text,
  p_output_tokens bigint
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total bigint;
begin
  if p_owner is null
    or p_usage_date is null
    or p_feature not in ('planner_coach', 'bulk_parser', 'digest')
    or p_output_tokens < 0
    or p_output_tokens > 1000000000000 then
    raise exception using
      errcode = '22023',
      message = 'invalid planner AI token telemetry';
  end if;

  update public.planner_ai_usage_daily
  set output_tokens = output_tokens + p_output_tokens,
      updated_at = pg_catalog.now()
  where owner_id = p_owner
    and usage_date = p_usage_date
    and feature = p_feature
  returning output_tokens into v_total;

  if v_total is null then
    raise exception using
      errcode = '55000',
      message = 'quota must be consumed before recording output tokens';
  end if;

  return v_total;
end;
$$;
