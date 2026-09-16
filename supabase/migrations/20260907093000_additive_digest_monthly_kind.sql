-- Check-ins gain a monthly cadence alongside daily and weekly. The unique key
-- on (owner_id, kind, period_key) already keeps a month's row distinct from the
-- day and week rows that share its date, so only the kind check widens.

alter table public.user_digests
  drop constraint if exists user_digests_kind_check;

alter table public.user_digests
  add constraint user_digests_kind_check
    check (kind in ('daily', 'weekly', 'monthly'));
