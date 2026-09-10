begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, private, extensions, pg_catalog;
select plan(10);

select is(
  (
    select p.provolatile
    from pg_proc p
    where p.oid = 'private.goal_anchored_period_start(date, public.recurrence_interval, integer)'::regprocedure
  ),
  's',
  'goal_anchored_period_start remains STABLE'
);

select is(
  (
    select p.provolatile
    from pg_proc p
    where p.oid = 'private.goal_period_key(date, public.recurrence_interval, date)'::regprocedure
  ),
  's',
  'goal_period_key remains STABLE'
);

select is(
  (
    select p.provolatile
    from pg_proc p
    where p.oid = 'private.goal_xp_credited_units(uuid, uuid, date)'::regprocedure
  ),
  's',
  'goal_xp_credited_units remains STABLE'
);

-- Completion RPCs are the only remaining XP accrual entry point now that the
-- completions trigger is gone. They have been redefined by four separate
-- migrations, and two of those silently dropped the recompute call, which
-- surfaced only as unrelated XP totals reading zero. Assert the call directly
-- so the next redefinition fails here instead.

select ok(
  pg_catalog.pg_get_functiondef(
    'public.mark_goal_complete(uuid, date)'::regprocedure
  ) like '%enqueue_goal_xp_recompute%',
  'mark_goal_complete queues XP recompute'
);

select ok(
  pg_catalog.pg_get_functiondef(
    'public.unmark_goal_complete(uuid, date)'::regprocedure
  ) like '%enqueue_goal_xp_recompute%',
  'unmark_goal_complete queues XP recompute'
);

select ok(
  pg_catalog.pg_get_functiondef(
    'public.mark_goal_complete(uuid, date)'::regprocedure
  ) like '%owned_linked_target_ids%',
  'mark_goal_complete walks owned linked targets through one helper'
);

select ok(
  pg_catalog.pg_get_functiondef(
    'public.recompute_goal_xp_service(uuid, uuid, boolean)'::regprocedure
  ) like '%goal_xp_ledger_diffs%',
  'recompute applies the shared ledger diff'
);

select ok(
  pg_catalog.pg_get_functiondef(
    'private.goal_xp_pending_delta(uuid, uuid)'::regprocedure
  ) like '%goal_xp_ledger_diffs%',
  'pending delta sums the shared ledger diff'
);

-- Level progression is formula-only. IMMUTABLE is what lets it be inlined and
-- constant-folded; a redefinition that reads xp_levels again would have to
-- downgrade to STABLE, so assert the marker to catch that.

select is(
  (
    select p.provolatile
    from pg_proc p
    where p.oid = 'private.xp_min_total_for_level(integer)'::regprocedure
  ),
  'i',
  'xp_min_total_for_level remains IMMUTABLE'
);

select is(
  (
    select p.provolatile
    from pg_proc p
    where p.oid = 'private.xp_level_for_total(integer)'::regprocedure
  ),
  'i',
  'xp_level_for_total remains IMMUTABLE'
);

select * from finish();
rollback;
