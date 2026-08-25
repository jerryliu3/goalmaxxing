# Final Whole-Branch Review Fix Report

Date: 2026-08-25
Branch: `feat/bulk-goal-create-editor`

## Outcome

Implemented the Critical and Important review fixes and the requested minor
coverage/documentation items without changing planner/checklist completion
semantics or persisted-goal definition immutability.

- Single-goal create/edit now retains a saved goal and selected link in an
  explicit retryable recovery state when `replace_goal_source_link` fails.
  Success toast, XP refresh, cache invalidation, and navigation occur only
  after link completion is confirmed.
- Single, bulk, and coach create retries preserve deterministic prepared IDs.
  The new forward-only migration makes same-owner goal replay and exact
  source/target link replay idempotent while retaining ownership and validation
  checks.
- Bulk and coach editors freeze draft and input editing during create/link
  recovery. Recovery retries use the exact prepared rows/link rows from the
  original request.
- Goal/planner caches are invalidated immediately after `create_goals`
  succeeds, including the partial-link path, without marking the workflow
  complete or invoking the coach full-success refresh path.
- Target-basis inference is centralized in
  `src/lib/goals/target-basis.ts`; API, CSV, XLSX, LLM, and transition coverage
  use the same period thresholds and invalid-basis handling.
- Lifetime-to-period transitions preserve valid counts that fit the destination
  interval and normalize only invalid, empty, over-limit, or daily values.
- The backfill test now creates a legacy-shaped fixture, verifies normalization,
  and verifies that later definition edits remain immutable.
- The implementation plan identifies deterministic parser route tests as
  authoritative, and the cleanup audit records bulk-editor duplication and
  semantic drift as resolved.

## Files changed

### Persistence and recovery

- `src/features/today/goal-form.tsx`
- `src/features/today/goal-form.test.tsx`
- `src/features/today/bulk-goal-form.tsx`
- `src/features/today/bulk-goal-form.test.tsx`
- `src/features/today/bulk-goal-input-card.tsx`
- `src/features/goals/bulk-goal-persistence.ts`
- `src/features/goals/bulk-goal-persistence.test.ts`
- `src/features/planner/coach/coach-goal-draft-service.ts`
- `src/features/planner/coach/coach-goal-draft-service.test.ts`
- `src/features/planner/coach/coach-types.ts`
- `src/features/planner/coach/planner-coach-panel.tsx`
- `src/features/planner/coach/use-planner-coach.ts`
- `src/features/planner/coach/use-planner-coach.test.tsx`

### Shared editor and target semantics

- `src/features/goals/goal-creation-model.ts`
- `src/features/goals/goal-creation-model.test.ts`
- `src/features/goals/goal-creation-fields.tsx`
- `src/features/goals/goal-field-kit.tsx`
- `src/features/goals/goal-link-target-select.tsx`
- `src/features/goals/bulk-goal-draft-review.tsx`
- `src/features/goals/bulk-goal-draft-review.test.tsx`
- `src/features/goals/bulk-goal-drafts.ts`
- `src/features/goals/bulk-goal-drafts.test.ts`
- `src/lib/goals/target-basis.ts`
- `src/app/api/bulk-goals/parse/route.ts`
- `src/app/api/bulk-goals/parse/route.test.ts`

### Database and documentation

- `supabase/migrations/20260825194500_additive_goal_write_idempotency.sql`
- `supabase/tests/database/goal_write_idempotency.test.sql`
- `supabase/tests/database/goal_period_target_backfill.test.sql`
- `docs/superpowers/plans/2026-08-25-bulk-goal-create-editor.md`
- `docs/checklist-planner-cleanup-audit.md`

## Verification

Commands run:

```text
pnpm vitest run \
  src/features/goals/goal-creation-model.test.ts \
  src/features/goals/bulk-goal-drafts.test.ts \
  src/features/goals/bulk-goal-persistence.test.ts \
  src/features/goals/bulk-goal-draft-review.test.tsx \
  src/features/today/bulk-goal-form.test.tsx \
  src/features/today/goal-form.test.tsx \
  src/features/planner/coach/coach-goal-draft-service.test.ts \
  src/features/planner/coach/planner-coach-panel.test.tsx \
  src/features/planner/coach/use-planner-coach.test.tsx \
  src/app/api/bulk-goals/parse/route.test.ts
```

Result: 10 test files passed, 143 tests passed.

```text
pnpm typecheck
```

Result: passed with exit code 0.

```text
pnpm lint
```

Result: exit code 0, 0 errors, 9 pre-existing repository warnings. The
warnings are in unrelated planner/XP/checklist files plus the existing unused
photo state in `goal-form.tsx`; no new lint error was introduced.

```text
git diff --check
```

Result: passed with no output.

```text
pnpm supabase:reset
pnpm test:sql
```

The local database was reset to replay all migrations, including the new
idempotency migration. The focused migration assertions passed:

- `goal_period_target_backfill.test.sql`: 7 assertions
- `goal_write_idempotency.test.sql`: 7 assertions

The complete SQL runner then stopped at the unrelated existing
`goals_write_boundary.test.sql` assertion
`soft_delete_goal recomputes XP to a zero balance` (actual `20`, expected `0`).
All SQL files before that failure, including both changed migration tests,
passed. The initial sandboxed SQL invocation also hit the environment's
`tsx` IPC `EPERM`; the rerun with local database permissions was used for the
results above.

## SQL limitations and residual concerns

- pgTAP runs after migrations, so the backfill test cannot replay the migration
  against a truly pre-migration schema. It now inserts a row matching the exact
  legacy predicate, verifies the normalized value, and verifies the immutable
  update boundary; the replay limitation is documented in the test.
- The full SQL suite remains blocked by the unrelated XP assertion described
  above and should be triaged separately.
- Lint completes successfully but retains the repository's existing warnings.
- Ambiguous create recovery intentionally freezes editing until the request is
  reconciled. Users can retry the exact original payload, then edit the
  persisted goal afterward.
