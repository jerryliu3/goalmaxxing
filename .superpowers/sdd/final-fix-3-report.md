# Final Whole-Branch Review Fix Report

Date: 2026-08-25
Branch: `feat/bulk-goal-create-editor`

## Outcome

Implemented the remaining critical and important review fixes while preserving
the approved editor workflow, planner/checklist semantics, ownership checks, and
persisted-goal definition immutability.

- Coach link recovery now retains the original link rows across repeated
  failures. The proposal remains uncreated and the editor remains frozen until
  link persistence succeeds.
- Single-goal create/update/link failures now retain retryable recovery state.
  Create retries reuse the deterministic goal ID, update retries reuse the exact
  saved arguments, and link failures do not report success, refresh XP, or
  navigate.
- Planner/goal caches invalidate immediately after a successful goal
  create/update RPC, including partial-link outcomes. Success UI, XP refresh,
  and navigation remain gated on successful link persistence.
- Lifetime weekly/monthly target fields now use the global target maximum;
  period-basis fields retain their interval-specific limits.
- Added a forward-only target-basis migration. Omitted basis resolution now uses
  daily/weekly/monthly interval thresholds, explicit recurring bases are
  preserved, fixed milestones remain lifetime-based, and recurring period null
  targets normalize to `1` at the goal write trigger.
- Capacity validation now uses the canonical target-basis resolver and compares
  period targets against the minimum available days in any recurrence period,
  while lifetime targets use the full available-day window.
- Link loading failures preserve an existing persisted target and block saving
  until candidates load successfully. Link errors without a usable message use
  stable actionable fallback text.
- Updated the cleanup audit and implementation plan to reflect required
  lifetime targets, enforced edit-mode immutability, post-migration pgTAP
  behavior, and authoritative deterministic parser route tests with no live
  Gemini semantic E2E assertion.

## Files changed in this fix

### Frontend recovery and validation

- `src/features/today/goal-form.tsx`
- `src/features/today/goal-form.test.tsx`
- `src/features/goals/goal-creation-fields.tsx`
- `src/features/goals/goal-creation-fields.test.tsx`
- `src/features/planner/coach/use-planner-coach.ts`
- `src/features/planner/coach/use-planner-coach.test.tsx`
- `src/lib/goals/definition-validation.ts`
- `src/lib/goals/definition-validation.test.ts`

### Database and pgTAP

- `supabase/migrations/20260825202559_align_goal_target_basis_rpc_semantics.sql`
- `supabase/tests/database/goal_target_basis_rpc.test.sql`
- `supabase/tests/database/goal_period_target_backfill.test.sql`

The new migration recreates the dependent public goal functions after adding
the recurrence-aware private resolver, retains `set search_path = ''` on
security-sensitive functions, keeps explicit auth/ownership checks in the
existing public functions, and grants private helpers only to `service_role`.

## Verification

### Focused Vitest coverage

Command:

```text
pnpm vitest run \
  src/features/goals/goal-creation-model.test.ts \
  src/features/goals/goal-creation-fields.test.tsx \
  src/features/goals/bulk-goal-drafts.test.ts \
  src/features/goals/bulk-goal-draft-review.test.tsx \
  src/features/goals/bulk-goal-persistence.test.ts \
  src/features/today/bulk-goal-form.test.tsx \
  src/features/today/goal-form.test.tsx \
  src/features/planner/coach/coach-goal-draft-service.test.ts \
  src/features/planner/coach/planner-coach-panel.test.tsx \
  src/features/planner/coach/use-planner-coach.test.tsx \
  src/app/api/bulk-goals/parse/route.test.ts
```

Result: 11 test files passed, 158 tests passed.

### Database replay and pgTAP

Command:

```text
pnpm supabase db reset
```

Result: passed. All migrations replayed, including
`20260825202559_align_goal_target_basis_rpc_semantics.sql`.

The focused changed fixtures passed during the full run:

- `goal_period_target_backfill.test.sql`: 7 assertions
- `goal_target_basis_rpc.test.sql`: 14 assertions
- `goal_write_idempotency.test.sql`: 7 assertions

The backfill fixture documents that pgTAP runs after migrations. It temporarily
disables the current-row default trigger to establish a known legacy-shaped
null period row, verifies normalization to `1`, and verifies the immutable
update boundary. It cannot replay the migration against a pre-migration row.

### Required full SQL attempt

Command:

```text
pnpm test:sql
```

Result: failed only at the existing
`goals_write_boundary.test.sql` assertion:

```text
not ok 22 - soft_delete_goal recomputes XP to a zero balance
have: 20
want: 0
```

All SQL files before that assertion passed, including the changed backfill,
target-basis, and idempotency fixtures.

### Typecheck, lint, and whitespace

```text
pnpm typecheck
```

Result: passed with exit code 0.

```text
pnpm lint
```

Result: exit code 0, with 9 existing warnings in unrelated planner/XP/
checklist files plus the pre-existing unused photo state in `goal-form.tsx`.
No lint errors were introduced.

```text
git diff --check
```

Result: passed with no output.

IDE diagnostics for the edited TypeScript files: no linter errors.

## SQL failure isolation

The failing soft-delete assertion is unrelated to this branch's changes.
Evidence:

```text
git merge-base HEAD main
fb9aebfcbd5343705aceeb27916f97f48aefa3b0
```

The comparison:

```text
git diff fb9aebfcbd5343705aceeb27916f97f48aefa3b0..HEAD -- \
  supabase/tests/database/goals_write_boundary.test.sql \
  supabase/migrations/011_soft_delete_goals.sql \
  supabase/migrations/20260809185837_additive_xp_phase3_xp_foundation.sql
```

contains no changes to `011_soft_delete_goals.sql`,
`20260809185837_additive_xp_phase3_xp_foundation.sql`, or the failing
soft-delete assertion. The only branch change in that test is the later
target-count immutability case, which changes its expected post-rejection
balance from `20` to `120`.

The failing assertion and `soft_delete_goal` implementation are both inherited
from earlier commits (`67428d5a8` for the test and `f27ccea3` for the original
soft-delete migration). The current full replay reproduces the same `20` versus
`0` result after every relevant migration succeeds. No unrelated XP behavior
was changed.

## Residual concerns

- The full SQL command remains red because of the pre-existing XP assertion
  above; it should be triaged separately.
- `pnpm lint` retains the repository's 9 warnings, but exits successfully.
- The backfill test necessarily simulates pre-migration data after migrations
  have already run; it cannot validate replay of the historical migration
  itself.
