-- Daily Goal score snapshot per account, used to rank a live score against
-- every other real account. Accounts without a row rank as score 0.

create table if not exists public.grow_score_standings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  score double precision not null check (score >= 0),
  as_of_date date not null,
  updated_at timestamptz not null default pg_catalog.now()
);

create index if not exists grow_score_standings_score_idx
  on public.grow_score_standings (score desc);

alter table public.grow_score_standings enable row level security;
revoke all on public.grow_score_standings from anon, authenticated;

-- Rank 1 is the highest score. The subject is compared with their live score,
-- so their own stored row is excluded. Synthetic social accounts never count.
create or replace function public.grow_score_rank(p_user_id uuid, p_score double precision)
returns table (rank integer, total integer)
language sql
stable
security definer
set search_path = ''
as $$
  select
    1 + (
      select count(*)::integer
      from public.grow_score_standings standing
      where standing.user_id <> p_user_id
        and standing.score > coalesce(p_score, 0)
        and not exists (
          select 1 from public.synthetic_users synthetic where synthetic.user_id = standing.user_id
        )
    ) as rank,
    (
      select count(*)::integer
      from public.profiles profile
      where not exists (
        select 1 from public.synthetic_users synthetic where synthetic.user_id = profile.id
      )
    ) as total;
$$;

revoke all on function public.grow_score_rank(uuid, double precision) from public, anon, authenticated;
grant execute on function public.grow_score_rank(uuid, double precision) to service_role;

-- Refresh every account's snapshot daily through the app's standings route.
-- Requires vault secrets `grow_score_standings_url` and `push_cron_secret`.
select cron.unschedule(job.jobid)
from cron.job job
where job.jobname = 'refresh-grow-score-standings-daily';

select cron.schedule(
  'refresh-grow-score-standings-daily',
  '15 8 * * *',
  $$
    with standings_cron_secrets as (
      select
        (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'grow_score_standings_url'
        ) as standings_url,
        (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'push_cron_secret'
        ) as cron_secret
    )
    select net.http_post(
      url := standings_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || cron_secret
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 10000
    )
    from standings_cron_secrets
    where standings_url is not null
      and cron_secret is not null;
  $$
);
