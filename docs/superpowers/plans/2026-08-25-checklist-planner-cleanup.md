# Checklist and Planner Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the audit’s Phase 0–5 cleanup as a behavior-preserving stacked
series that gives checklist, completion, planner, UI, and database boundaries
one canonical implementation each.

**Architecture:** Establish typed characterization contracts first, then add a
pure checklist projection and a pure completion-intent resolver. Make kernel
reconciliation the planner authority before extracting UI orchestration. Finish
with stored-column reads, documented validation ownership, typed wire contracts,
and explicit forward SQL function definitions.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Testing Library,
Supabase/PostgreSQL, pgTAP.

## Global Constraints

- Preserve selected-date lifecycle/fact scope and as-of-date progress scope.
- Preserve period-window facts, including later dates in the selected period.
- Keep exact-date checkbox, period satisfaction, lifetime achievement, and
  target-achieved hiding as independent facts.
- Route period-cadence completion toggles through exact-date semantics on every
  surface.
- Keep planner credit/classification owned by kernel reconciliation.
- Keep persisted goal definition fields immutable after creation.
- Retain API-side early validation and database-side invariant enforcement.
- Use existing utilities and components before introducing new abstractions.
- Add focused tests before each production behavior change.
- Stage only named files and keep each PR independently reviewable.

---

### Task 1: Phase 0 temporal and period-domain contracts

**Files:**
- Create: `docs/checklist-planner-cleanup-audit.md` temporal-contract section
- Create: `src/lib/goals/period-domain.ts`
- Create: `src/lib/goals/period-domain.test.ts`
- Create: `src/lib/goals/checklist-presentation-fixtures.ts`
- Test: `src/lib/goals/periods.parity.test.ts`
- Test: `src/lib/planner/completion-dispatch.test.ts`

**Interfaces:**
- Produce `ChecklistTemporalContext` with `selectedDate`, `asOfDate`, and
  `weeklyAnchor`.
- Produce branded aliases `PlannerCalendarPeriodKey`,
  `ProgressDisplayPeriodKey`, and `XPCreditPeriodKey`.
- Produce fixture rows that document aligned and intentionally different period
  domains without sharing their implementation helpers.

- [ ] Add table-driven vectors for weekly/monthly boundaries, profile-week
  anchors, planner cadence periods, and goal-anchored XP periods.
- [ ] Add characterization cases proving checklist facts use selected-period
  windows while progress outcomes use `asOfDate`.
- [ ] Add cross-surface completion route vectors that record the current
  Today/Insights/Calendar behavior before migration.
- [ ] Run `pnpm vitest run src/lib/goals/period-domain.test.ts src/lib/goals/periods.parity.test.ts src/lib/planner/completion-dispatch.test.ts`
  and confirm the new assertions fail only where the old surface divergence is
  intentional.
- [ ] Add the temporal contract to the audit and commit the Phase 0 contract
  branch as `test(cleanup): lock checklist and planner domain contracts`.

### Task 2: Canonical checklist presentation projection

**Files:**
- Create: `src/features/today/checklist-presentation.ts`
- Create: `src/features/today/checklist-presentation.test.ts`
- Modify: `src/features/today/checklist-selectors.ts`
- Modify: `src/features/today/checklist-selectors.test.ts`
- Modify: `src/features/today/goal-card.tsx`
- Modify: `src/features/today/goal-card.test.tsx`
- Modify: `src/features/today/today-tab.tsx`

**Interfaces:**
- `ChecklistGoalPresentation` returns `exactDateCompleted`,
  `periodCompletionCount`, `periodTarget`, `periodSatisfied`,
  `lifetimeCompletionCount`, `lifetimeAchieved`, `shouldSortToBottom`,
  `shouldHideWhenCompletedFilterOff`, and `completedOnDateForFilter`.
- `selectChecklistGoalPresentation({ goal, facts, progress, context })`
  consumes one goal’s normalized facts and returns the complete projection.
- `selectCompletedTargetGoalIds` delegates to the projection instead of
  recomputing achievement timing.

- [ ] Write the presentation matrix for period targets below/at/above target,
  exact-date checked versus unchecked, achieved-day visibility, post-achievement
  hiding, lifetime goals, milestones, and next-period reset.
- [ ] Run `pnpm vitest run src/features/today/checklist-presentation.test.ts`
  and confirm it fails because the selector does not exist.
- [ ] Implement the pure projection using existing admissible counting and
  target-basis helpers; keep later-in-period facts and as-of summaries distinct.
- [ ] Build projections once in `TodayTab`, use them for sorting/filtering, and
  pass the selected goal projection into `GoalCard`.
- [ ] Remove local green/count/hide derivations from the touched consumers while
  preserving markup and user-facing copy.
- [ ] Run checklist selector/card/presentation tests and commit
  `refactor(checklist): centralize presentation projection`.

### Task 3: Shared completion-intent resolver

**Files:**
- Create: `src/lib/planner/completion-intent.ts`
- Create: `src/lib/planner/completion-intent.test.ts`
- Modify: `src/lib/planner/completion-dispatch.ts`
- Modify: `src/lib/planner/completion-dispatch.test.ts`
- Modify: `src/features/planner/calendar-surface.types.ts`

**Interfaces:**
- `CompletionTemporalContext` contains `selectedDate` and `asOfDate`.
- `CompletionIntentSource` supports checklist, insights, and planner-entry
  adapters.
- `resolveCompletionIntent(source, temporal)` returns `allowed`,
  `disabledReason`, low-level dispatch decision, normalized goal/date/state,
  and optional planner expectations.

- [ ] Write resolver tests for period-cadence, lifetime recurring, milestone,
  future creation, past unmark, satisfied-elsewhere, historical, item-date,
  plan-goal-date, and exact-date routes.
- [ ] Run the focused test and confirm failures are due to the missing resolver.
- [ ] Implement shared targeted-goal classification, exact-date state, legacy
  period unmark date/state normalization, and planner disabled-reason mapping.
- [ ] Keep HTTP, toast, cache, and XP work in existing executor/hook layers.
- [ ] Run resolver and dispatch tests and commit
  `refactor(completions): add shared completion intent`.

### Task 4: Migrate Today completion actions

**Files:**
- Modify: `src/features/today/today-tab.tsx`
- Modify: `src/features/today/today-tab.test.tsx`
- Modify: `src/features/planner/use-completion-mutation.test.tsx`

**Interfaces:**
- Today adapts `goal`, completions, `viewDate`, and `todayLocalDate` into
  `resolveCompletionIntent`; it no longer computes route-specific date/state.

- [ ] Add a failing Today regression for period-cadence completion on a date
  without an existing exact fact and for unmarking the latest period fact.
- [ ] Replace inline `resolveCompletionDispatch`, legacy-period normalization,
  and duplicated goal classification with the resolver call.
- [ ] Preserve success/error toast text, scroll restoration, telemetry, and
  completion-refresh behavior.
- [ ] Run Today and mutation-hook tests and commit
  `refactor(checklist): use shared completion intent`.

### Task 5: Migrate Insights completion actions

**Files:**
- Modify: `src/features/insights/insights-tab.tsx`
- Modify: `src/features/insights/insights-tab.test.tsx`
- Modify: `src/lib/planner/completion-intent.test.ts`

- [ ] Add failing parity cases for recurring period, lifetime, milestone, and
  future-date heatmap actions.
- [ ] Adapt both recurring and milestone callbacks to the shared resolver and
  remove the surface-only targeted predicate/future guard once resolver output
  supplies the same disabled reason.
- [ ] Preserve heatmap refresh, optimistic UI, and existing copy.
- [ ] Run the Insights and resolver suites and commit
  `refactor(insights): use shared completion intent`.

### Task 6: Migrate Calendar and remove legacy-period product callers

**Files:**
- Modify: `src/features/planner/completion-entry-dispatch.ts`
- Modify: `src/features/planner/completion-entry-dispatch.test.ts`
- Modify: `src/features/planner/planner-day-entries-panel.tsx`
- Modify: `src/features/planner/use-planner-entry-mutations.ts`
- Modify: `src/features/planner/calendar-surface.characterization.test.tsx`
- Modify: `src/lib/planner/completion-dispatch.ts`
- Modify: `src/app/api/completions/route.test.ts`

- [ ] Add control-state parity tests for credited, satisfied-elsewhere,
  historical, future, draft-ghost, item-date, plan-goal-date, and exact-date
  planner entries.
- [ ] Make the Calendar adapter pass typed entry identity/credit state into the
  resolver and remove unit-key requirement inference.
- [ ] Remove `legacy_period` callers after all three surfaces use exact-date
  semantics; retain server guards needed for old stored requests only until
  route fixtures prove no product caller remains.
- [ ] Run planner dispatch, Calendar characterization, and completions route
  tests and commit `refactor(planner): unify completion intent callers`.

### Task 7: Make planner reconciliation authoritative

**Files:**
- Modify: `src/lib/planner/context-loader.ts`
- Modify: `src/lib/planner/context-loader.test.ts`
- Modify: `src/features/planner/calendar-entries.ts`
- Modify: `src/features/planner/calendar-entries.test.ts`
- Modify: `src/features/planner/calendar-store-selectors.ts`
- Modify: `src/features/planner/calendar-surface.types.ts`
- Create: `src/lib/planner/active-snapshot-reconciliation.parity.test.ts`

- [ ] Add failing parity vectors for off-schedule deadline credit, cadence
  window credit, historical classification, prior identity preservation,
  missing preview units, and preview-only units.
- [ ] Remove naive completion-derived credit/classification from the active
  snapshot while retaining identity, placement, locking, and revision fields.
- [ ] Overlay `preview.workUnits` reconciliation results onto active-plan items
  before exposing the context payload; rebuild completion-to-unit mappings from
  the same preview.
- [ ] Ensure entry projection and dispatch read one reconciled credit state
  without active-item fallback disagreement.
- [ ] Report an unexpected missing/mismatched reconciliation identity through
  the existing error reporter with machine code `reconciliation_mismatch`.
- [ ] Run planner kernel, reconciliation, context-loader, and calendar-entry
  tests and commit `refactor(planner): source active state from reconciliation`.

### Task 8: Consolidate recurrence labels

**Files:**
- Create: `src/lib/goals/recurrence-labels.ts`
- Create: `src/lib/goals/recurrence-labels.test.ts`
- Modify: `src/features/today/checklist-selectors.ts`
- Modify: `src/features/today/checklist-selectors.test.ts`
- Modify: `src/lib/goals/schedule.ts`
- Modify: `src/lib/goals/linked-goal-labels.ts`
- Modify: `src/lib/goals/linked-goal-labels.test.ts`
- Modify: `src/features/goals/goal-creation-fields.tsx`

- [ ] Add label-map tests for daily, weekly, monthly, fixed, and interval
  variants.
- [ ] Replace duplicate interval/group label maps with the canonical map while
  keeping sentence-level context-specific prose local.
- [ ] Run label, selector, schedule, and creation-field tests and commit
  `refactor(goals): centralize recurrence labels`.

### Task 9: Normalize checklist cache and load modes

**Files:**
- Modify: `src/features/today/use-checklist-data.ts`
- Create: `src/features/today/use-checklist-data.test.ts`
- Modify: `src/lib/cache/tab-data-cache.ts` only if the normalized cache
  operation requires it
- Modify: `src/features/today/today-tab.test.tsx`

**Interfaces:**
- `ChecklistLoadMode` is `"initial" | "viewDate" | "completionRefresh" | "force"`.
- Every successful mode writes the same `TodayData` cache shape under the same
  subject/date/partner scope.

- [ ] Add hook tests for cache hit/miss, view-date cache writes, completion-only
  preservation of goals/links/photos, stale response cancellation, aborts, and
  partner cache scope.
- [ ] Run the new tests and confirm the view-date cache assertion fails before
  implementation.
- [ ] Route all load operations through explicit modes, update the cache after
  successful view-date refreshes, and preserve request versioning.
- [ ] Run hook and Today tests and commit
  `fix(checklist): normalize cache update paths`.

### Task 10: Extract goal-form responsibilities

**Files:**
- Create: `src/features/today/use-goal-form-load.ts`
- Create: `src/features/today/use-goal-form-validation.ts`
- Create: `src/features/goals/build-goal-mutation-args.ts`
- Create: `src/features/goals/build-goal-mutation-args.test.ts`
- Create: `src/features/today/use-goal-form-submit.ts`
- Modify: `src/features/today/goal-form.tsx`
- Modify: `src/features/today/goal-form.test.tsx`

- [ ] Add builder tests for create/update, immutable definitions, milestones,
  planner-task exclusion, links, reward text, and normalized target basis.
- [ ] Run the builder test and confirm the missing module failure.
- [ ] Move load/hydrate, validation, mutation-argument construction, and submit
  recovery into focused hooks/modules without changing the shell’s visible
  fields or navigation.
- [ ] Keep planner-task, link-search UI, archive/delete controls, and recovery
  presentation in the composition shell.
- [ ] Run goal-form, creation-model, and builder tests and commit
  `refactor(goals): decompose goal form orchestration`.

### Task 11: Decompose Today orchestration

**Files:**
- Create: `src/features/today/use-checklist-filters.ts`
- Create: `src/features/today/checklist-filters-dialog.tsx`
- Create: `src/features/today/use-checklist-projection.ts`
- Create: `src/features/today/use-checklist-completion-actions.ts`
- Modify: `src/features/today/today-tab.tsx`
- Modify: `src/features/today/checklist-shell.tsx`
- Modify: `src/features/today/checklist-surface.tsx`
- Modify: `src/features/today/today-tab.test.tsx`
- Create: `src/features/today/use-checklist-projection.test.ts`
- Create: `src/features/today/use-checklist-completion-actions.test.ts`

- [ ] Add hook tests for filter state, dialog callbacks, projection sort/group,
  and completion action delegation.
- [ ] Move filter state/dialog markup first, preserving shared Duo filters.
- [ ] Move lifecycle/projection derivation into `useChecklistProjection` using
  the canonical presentation selector.
- [ ] Move completion action wiring into
  `useChecklistCompletionActions`, keeping toast and scroll behavior unchanged.
- [ ] Leave `TodayTab` as a thin composition shell and run focused tests.
- [ ] Commit `refactor(checklist): split Today orchestration`.

### Task 12: Decompose Calendar orchestration

**Files:**
- Create: `src/features/planner/use-calendar-completion-controls.ts`
- Create: `src/features/planner/planner-calendar-layout.tsx`
- Create: `src/features/planner/planner-calendar-overlays.tsx`
- Modify: `src/features/planner/calendar-surface.tsx`
- Modify: `src/features/planner/calendar-surface.characterization.test.tsx`

- [ ] Add characterization assertions around completion controls, day preview,
  DnD, draft ghosts, coach proposals, settings, overlays, and navigation.
- [ ] Extract completion-control orchestration while preserving mutation hook
  inputs and per-entry loading state.
- [ ] Extract existing calendar layout/overlay subtrees without moving kernel,
  DnD, or draft policy.
- [ ] Run Calendar characterization tests after each extraction and commit
  `refactor(planner): split calendar composition shell`.

### Task 13: Rename internal checklist filters

**Files:**
- Modify: `src/features/today/today-tab.tsx`
- Modify: `src/features/today/checklist-shell.tsx`
- Modify: `src/features/today/checklist-selectors.ts`
- Modify: `src/features/insights/insights-goal-stats-filters.tsx`
- Modify: associated tests

- [ ] Rename only internal state and parameter names:
  `completedOpen` → `pastPanelOpen`,
  `showCompletedGoals` → `showTargetAchievedGoals`,
  `showPastGoals` → `showEndedGoals`, and
  `completedTargetGoalIds` → `targetAchievedGoalIds`.
- [ ] Preserve all user-facing labels and run selector, Today, shell, and
  Insights filter tests.
- [ ] Commit `refactor(checklist): clarify lifecycle filter names`.

### Task 14: Remove target-basis inference from normal reads

**Files:**
- Modify: `src/lib/goals/target-basis.ts`
- Modify: `src/lib/goals/target-basis.test.ts`
- Modify: `src/lib/planner/requirements.ts`
- Modify: `src/lib/planner/requirements.test.ts`
- Modify: `src/lib/goals/types.ts`
- Modify: `packages/shared/src/supabase/database.types.ts` via the repository’s
  Supabase type-generation command
- Modify: normal goal read callers that currently infer a missing column
- Test: `supabase/tests/database/goal_target_basis_rpc.test.sql`

- [ ] Add tests separating write-input normalization from persisted-row reads.
- [ ] Make persisted `Goal.target_basis` required and have read helpers use the
  stored field directly; retain explicit input normalization for create/repair
  paths.
- [ ] Confirm all changed selects include `target_basis`, then run target-basis,
  requirement, selector, and goal-card tests plus the focused pgTAP fixture.
- [ ] Commit `refactor(goals): read canonical target basis`.

### Task 15: Document validation ownership and canonical paths

**Files:**
- Create: `docs/db/goals-completions-planner-canonical-paths.md`
- Modify: `docs/checklist-planner-cleanup-audit.md`

- [ ] Inventory goal definition, completion, exact-date planner, cascade, and
  service-role write paths.
- [ ] For each invariant list canonical enforcement layer, early check, stable
  machine code, test location, and cascade/service-role coverage.
- [ ] Link current planner functions, superseded migrations, and restore/PITR
  expectations; do not add a second implementation.
- [ ] Commit `docs(db): document canonical validation paths`.

### Task 16: Tighten planner wire contracts

**Files:**
- Modify: `packages/shared/src/planner/context.ts`
- Modify: `src/features/planner/calendar-surface.types.ts`
- Modify: `src/lib/planner/context-loader.ts`
- Modify: `src/lib/planner/work-units.ts`
- Create: `src/lib/planner/contracts/wire-schema.test.ts`
- Modify: affected planner projection/characterization tests

- [ ] Add schema tests for finite classification, credit-state, disabled-reason,
  and requirement-kind unions.
- [ ] Parse unions at the API boundary and carry them through entry projection;
  do not encode route or credit policy in the wire schema.
- [ ] Run planner contract, work-unit, calendar-entry, and characterization tests.
- [ ] Commit `refactor(planner): tighten wire state contracts`.

### Task 17: Replace substantial SQL string patches

**Files:**
- Create: one forward migration using the repository’s
  `supabase migration new <descriptive-name>` command
- Modify: affected SQL definitions only through the new migration
- Test: `supabase/tests/database/planner_prepare_boundary.test.sql`
- Test: `supabase/tests/database/planner_write_boundary_period_move.test.sql`
- Test: `supabase/tests/database/planner_write_boundary_target_cap.test.sql`
- Test: `supabase/tests/database/goals_write_boundary.test.sql`
- Test: `supabase/tests/database/goal_target_basis_rpc.test.sql`

- [ ] Add failing pgTAP assertions for the current canonical function bodies and
  target-basis/completion/planner invariants.
- [ ] Generate a forward migration with complete `CREATE OR REPLACE FUNCTION`
  bodies for substantial rewrites; leave narrow additive patches untouched.
- [ ] Preserve `search_path=''`, explicit ownership checks, grants, stable error
  codes, idempotency, and existing target-basis/planner semantics.
- [ ] Run the focused pgTAP fixtures through `pnpm test:sql` or the repository’s
  available SQL harness and commit
  `refactor(db): replace fragile canonical function patches`.

### Task 18: Stack review and handoff

**Files:**
- Modify: `docs/checklist-planner-cleanup-audit.md`

- [ ] Review every child branch against its immediate parent and ensure the
  PR body names the dependency and focused test commands.
- [ ] Run the touched Vitest suites, relevant SQL suites, `git diff --check`,
  and changed-file lint diagnostics.
- [ ] Inspect the full stacked diff for duplicated selectors/resolvers,
  stale legacy-period callers, active-plan credit fallbacks, inferred
  target-basis reads, accidental user-facing copy changes, generated secrets,
  and unrelated cleanup.
- [ ] Apply critical fixes to the owning branch, restack descendants, rerun only
  the affected focused tests, and update the relevant PR body.
- [ ] Mark completed audit phases and remaining non-goals accurately, then open
  or update all stacked PRs without changing the existing `#654` parent.
