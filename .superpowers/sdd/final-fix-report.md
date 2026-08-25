# Bulk Goal Create Editor Final Fix Report

Date: 2026-08-25
Branch: `feat/bulk-goal-create-editor`

## Status

Implemented all eight requested whole-branch review fixes while preserving
planner/checklist completion semantics and persisted-goal definition
immutability.

## Files changed

- `src/features/goals/goal-creation-model.ts`
- `src/features/goals/goal-creation-model.test.ts`
- `src/features/goals/goal-creation-fields.test.tsx`
- `src/features/goals/bulk-goal-drafts.ts`
- `src/features/goals/bulk-goal-drafts.test.ts`
- `src/features/goals/bulk-goal-persistence.ts`
- `src/features/goals/bulk-goal-persistence.test.ts`
- `src/features/today/bulk-goal-form.tsx`
- `src/features/today/bulk-goal-form.test.tsx`
- `src/features/today/goal-form.tsx`
- `src/features/today/goal-form.test.tsx`
- `src/features/planner/coach/coach-goal-draft-service.ts`
- `src/features/planner/coach/coach-goal-draft-service.test.ts`
- `src/features/planner/coach/coach-types.ts`
- `src/features/planner/coach/use-planner-coach.ts`
- `src/features/planner/coach/use-planner-coach.test.tsx`
- `src/features/planner/coach/planner-coach-panel.tsx`
- `src/features/planner/coach/planner-coach-panel.test.tsx`
- `supabase/migrations/20260825192855_additive_goal_period_target_backfill.sql`
- `supabase/tests/database/goal_period_target_backfill.test.sql`
- `docs/superpowers/plans/2026-08-25-bulk-goal-create-editor.md`
- `docs/checklist-planner-cleanup-audit.md`

## Fix coverage

1. Prepared bulk rows now include `difficulty` and `is_private`; bulk and
   coach payload tests assert the edited values.
2. Fixed-milestone to recurring transitions reset the recurring period target
   to `1` and clear milestone names.
3. Daily recurring period transitions and prepared rows normalize the hidden
   target to `1`.
4. Goal hydration preserves valid persisted six-digit hex colors and falls back
   to the category swatch only for missing or invalid values.
5. Goal/link persistence now has explicit `created` and `partial_success`
   results. Link failures retain the selected link and draft/proposal state,
   prevent success navigation or created marking, and expose retry actions
   without recreating goals.
6. A forward-only migration backfills legacy recurring period goals with
   `target_count IS NULL` to `1`, making the locked edit path safe after
   rollout.
7. GoalForm uses the strict shared target parser and explicitly blocks empty
   lifetime recurring targets.
8. The implementation plan now identifies deterministic parser route tests as
   authoritative and documents that no provider-dependent Gemini E2E semantic
   assertion is required. The cleanup audit records the bulk-editor
   duplication/semantic-drift finding as resolved.

## Verification

- `pnpm vitest run src/features/goals/goal-creation-model.test.ts src/features/goals/bulk-goal-drafts.test.ts src/features/goals/bulk-goal-persistence.test.ts src/features/goals/bulk-goal-draft-review.test.tsx src/features/today/bulk-goal-form.test.tsx src/features/today/goal-form.test.tsx src/features/planner/coach/coach-goal-draft-service.test.ts src/features/planner/coach/use-planner-coach.test.tsx`
  - PASS: 8 files, 94 tests.
- `pnpm typecheck`
  - PASS.
- `pnpm lint`
  - PASS with 0 errors and 9 pre-existing warnings.
- `pnpm test:sql`
  - The new `goal_period_target_backfill.test.sql` passed all 4 assertions.
  - The repository-wide run then stopped at the pre-existing
    `goals_write_boundary.test.sql` assertion
    `"soft_delete_goal recomputes XP to a zero balance"` (`have: 20`, `want:
    0`), so the complete SQL suite did not pass.
- `git diff --check`
  - PASS.

## Residual concerns

The repository SQL suite remains blocked by the unrelated
`goals_write_boundary.test.sql` XP-balance assertion. The added migration
coverage itself passes. Lint still reports nine warnings, including two
existing unused photo state values in `goal-form.tsx`; there are no lint
errors.
