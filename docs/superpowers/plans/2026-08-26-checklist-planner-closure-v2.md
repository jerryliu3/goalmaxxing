# Checklist and Planner Closure v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining gaps in the checklist-planner cleanup definition of success after stack #655–#685: one presentation hide path, one completion-intent surface for Calendar, strict stored `target_basis` reads, reconciliation observability, naming consistency, calendar shell decomposition, and audit closure.

**Architecture:** Extend existing canonical modules only — do not add parallel policy layers:
- `src/lib/goals/checklist-presentation.ts` + `src/features/today/use-checklist-projection.ts`
- `src/lib/planner/completion-intent.ts` (add planner adapter; thin `src/features/planner/completion-entry-dispatch.ts`)
- `src/lib/planner/active-plan-reconciliation.ts` + `src/lib/planner/context-loader.ts`
- `src/lib/goals/target-basis.ts`

**Tech Stack:** Next.js, React, TypeScript, Vitest, Supabase/pgTAP (focused slice only).

**Prerequisite (stack hygiene, no verification gate):** Restack P6 (#681–#685) onto current `stack/checklist-planner-cleanup-p5-strict` tip; close conflicting #680. Cherry-pick P6 commits onto fresh tip, force-push descendants.

**Out of scope:** CI workflow fixes, e2e triage, full-repo typecheck/lint gates, planner kernel rewrite, persistence-shape collapse, full audit P3 pgTAP matrix.

## Global Constraints

- Preserve selected-date lifecycle/fact scope and as-of-date progress scope.
- Preserve period-window facts, including later dates in the selected period.
- Keep exact-date checkbox, period satisfaction, lifetime achievement, and target-achieved hiding as independent facts.
- Route period-cadence completion toggles through exact-date semantics on every surface.
- Keep planner credit/classification owned by kernel reconciliation.
- Observability-only reconciliation mismatch reporting — no user-facing blocking.
- Stage only named files and keep each PR independently reviewable.

## Scorecard

| Criterion | Before v2 | After v2 target |
|-----------|-----------|-----------------|
| One checklist presentation selector | Mostly — hook still computes redundant `targetAchievedGoalIds` | Done |
| One completion resolver (all surfaces) | Partial — Calendar uses `completion-entry-dispatch.ts` | Done |
| One reconciliation authority | Mostly — no `reconciliation_mismatch` | Done |
| Canonical `target_basis` reads | No — `inferLegacyGoalTargetBasis` on read path | Done |
| Visible temporal semantics | Yes for count/green; hide undocumented | Done + documented |
| Thin UI shells | Partial — calendar ~1507 LOC | Calendar ≤800 LOC orchestration |
| Cross-surface + DB tests | Partial | Parity matrix + hydration test + pgTAP slice |

## Stacked delivery

Branch naming: `stack/checklist-planner-closure-v2-p{N}-{slug}`

```
tip (#685) → p1-dedup-docs → p5-insights-naming → p2-calendar-intent → p3-strict-basis → p4-reconciliation-obs → p6-calendar-shell → p7-tests-closure → [p8-mobile optional]
```

## Overlap deduplication

| Theme | Owner task | Not duplicated in |
|-------|------------|-------------------|
| Hook `targetAchievedGoalIds` removal | Task 1 | — |
| Hide temporal docs/tests | Task 1 | — |
| Calendar intent | Task 3 | Task 6 |
| Strict `target_basis` | Task 4 | — |
| `reconciliation_mismatch` | Task 5 | — |
| Insights naming | Task 2 | — |
| Calendar LOC | Task 6 | — |
| Cross-surface tests | Task 3 + Task 7 | — |
| P6 restack | Prerequisite only | All tasks |

---

### Task 1: Phase 1 — Presentation dedup + temporal docs (`closure-v2-p1-dedup-docs`)

**Files:**
- Modify: `src/features/today/use-checklist-projection.ts`
- Modify: `src/features/today/today-tab.tsx` (only if still consuming hook export)
- Modify: `src/lib/goals/checklist-presentation.ts` (comment at hide assignment)
- Modify: `docs/checklist-temporal-context.md`
- Test: `src/lib/goals/checklist-presentation.test.ts`

- [ ] Remove `targetAchievedGoalIds` computation and export from `useChecklistProjection`; return only `presentationByGoalId` and `greenGoalIds`.
- [ ] Confirm `today-tab.tsx` uses `selectTargetAchievedGoalIdsFromPresentations(presentationByGoalId)` exclusively.
- [ ] Grep for hook `targetAchievedGoalIds` consumers; update any stragglers.
- [ ] Document hide semantics in `checklist-temporal-context.md`: hide uses **browsed** `selectedDate`; green/outcome use `asOfDate`; achieved day visible; period reset per period.
- [ ] Add comment at `shouldHideWhenCompletedFilterOff` assignment noting `asOfDate: selectedDate` is intentional.
- [ ] Extend presentation tests: achieved-day visible, hide after day passes, next-period reset, `selectedDate` vs `asOfDate` divergence case.

**Acceptance:** Zero hook hide derivation; docs + tests lock hide temporal contract.

---

### Task 2: Phase 5 — Insights naming (`closure-v2-p5-insights-naming`)

**Files:**
- Modify: `src/features/insights/insights-goal-stats-filters.tsx`
- Modify: `src/features/insights/insights-tab.tsx`
- Test: `src/features/insights/insights-goal-stats-filters.test.tsx`

- [ ] Rename `showPastGoals` prop → `showEndedGoals` (align with Today lifecycle naming from #662); keep user-facing label unchanged.
- [ ] Update `insights-tab.tsx` wiring (`showHistoricalGoals` state).
- [ ] Update tests.

**Acceptance:** No `showPastGoals` in insights feature folder.

---

### Task 3: Phase 2 — Calendar completion-intent unification (`closure-v2-p2-calendar-intent`)

**Files:**
- Modify: `src/lib/planner/completion-intent.ts`
- Modify: `src/features/planner/completion-entry-dispatch.ts`
- Modify: `src/features/planner/use-calendar-completion-controls.ts`
- Test: `src/lib/planner/completion-intent.test.ts`
- Test: `src/features/planner/completion-entry-dispatch.test.ts`
- Create: `src/lib/planner/completion-intent-parity.test.ts`

- [ ] Add `resolvePlannerEntryCompletionIntent` delegating to `resolveCompletionDispatch` via `buildCompletionIntent`.
- [ ] Requirement kind: prefer `entry.activeItem?.requirement_kind`; use reconciled metadata when present; `unitKey` prefix inference only as documented legacy fallback.
- [ ] Fix `targetedRecurring` derivation: use goal/requirement helpers when `activeGoal` present (not `!entry.activeGoal`).
- [ ] Map `classification` → dispatch `matchingItemState` (preserve current mapping from `completion-entry-dispatch.ts`).
- [ ] Thin `completion-entry-dispatch.ts` to wrappers projecting intent → `CompletionControlState`.
- [ ] Wire `use-calendar-completion-controls.ts` through intent module only.
- [ ] Extend `completion-intent.test.ts` with planner routes: cadence, milestone, deadline_total, satisfied_elsewhere, future_creation, item_date, plan_goal_date.
- [ ] Add cross-surface parity test: same goal/date/fact → same `decision.route` and `mutation.date` across checklist, insights, planner adapters.
- [ ] Keep `completion-entry-dispatch.test.ts` green (behavior-preserving).

**Acceptance:** No direct `resolveCompletionDispatch` from calendar UI layer; parity matrix passes.

---

### Task 4: Phase 3 — Strict `target_basis` reads (`closure-v2-p3-strict-basis`)

**Files:**
- Modify: `src/lib/goals/target-basis.ts`
- Modify: `src/lib/goals/types.ts`
- Modify: `docs/db/goals-completions-planner-canonical-paths.md`
- Test: `src/lib/goals/target-basis.test.ts`
- Test: `supabase/tests/database/goal_write_idempotency.test.sql` (or new focused pgTAP)

- [ ] Make `target_basis` required on persisted `Goal` type (`"period" | "lifetime"`).
- [ ] `resolveGoalTargetBasis`: return stored value or structural `lifetime` for fixed milestones; **do not** call `inferLegacyGoalTargetBasis` on product read path.
- [ ] Move inference to `inferLegacyGoalTargetBasisForRepair` (repair/migration-only module).
- [ ] Audit call sites: planner kernel, presentation, goal-form hydrate, context-loader selects.
- [ ] pgTAP: persisted recurring goals have non-null `target_basis`; `private.resolve_goal_target_basis` boundary behavior.
- [ ] Update canonical-paths doc: strict reads; inference repair-only.

**Acceptance:** Product reads never silently infer; types enforce non-null basis on persisted goals.

---

### Task 5: Phase 4 — Reconciliation observability (`closure-v2-p4-reconciliation-obs`)

**Files:**
- Modify: `src/lib/planner/active-plan-reconciliation.ts`
- Modify: `src/lib/planner/context-loader.ts`
- Test: `src/lib/planner/active-plan-reconciliation.test.ts`
- Create: `src/lib/planner/context-loader-reconciliation.test.ts`

- [ ] After `hydrateActivePlanItemsFromWorkUnits`, compare snapshot vs work-unit credit/classification per entry key.
- [ ] On material mismatch (`creditState`, `classification`): `reportError` with machine code `reconciliation_mismatch` + structured fields.
- [ ] Observability only — do not block user flow or toast.
- [ ] Test constructed divergence triggers detection and reporter call.
- [ ] Document `reconciliation_mismatch` in canonical-paths or audit observability section.

**Acceptance:** Runtime code emits `reconciliation_mismatch`; tests prove detection on divergence.

---

### Task 6: Phase 6 — Calendar shell decomposition (`closure-v2-p6-calendar-shell`)

**Files:**
- Modify: `src/features/planner/calendar-surface.tsx` (target ≤800 LOC)
- Create: `src/features/planner/use-calendar-draft-moves.ts`
- Create: `src/features/planner/use-calendar-scroll-behavior.ts`
- Create: `src/features/planner/use-calendar-view-navigation.ts`

- [ ] Extract draft move queue / save/cancel / revision guards → `use-calendar-draft-moves.ts`.
- [ ] Extract scroll alignment and today-shortcut behavior → `use-calendar-scroll-behavior.ts`.
- [ ] Extract view navigation helpers → `use-calendar-view-navigation.ts`.
- [ ] `calendar-surface.tsx` retains: data hooks, context assembly, child composition only.
- [ ] No domain policy in new files; no new `lib→features` imports.
- [ ] Characterization tests unchanged.

**Acceptance:** `calendar-surface.tsx` ≤800 LOC; characterization green.

---

### Task 7: Phase 7 — Tests + audit closure (`closure-v2-p7-tests-closure`)

**Files:**
- Modify: `docs/checklist-planner-cleanup-audit.md`

- [ ] Update audit status: Complete through Closure v2; fix PR range (#655–#685 + closure v2).
- [ ] Update definition-of-success checklist with post-v2 ✅ per criterion.
- [ ] Ensure `completion-intent-parity.test.ts` covers ≥3 goal shapes × 3 surfaces.
- [ ] Update audit executive summary honestly (mobile parity note).

**Acceptance:** Audit reflects shipped state; parity matrix complete.

---

### Task 8 (optional): Mobile alignment (`closure-v2-p8-mobile`)

**Files:**
- Modify: `apps/mobile/src/features/checklist/checklist-visibility.ts`
- Test: `apps/mobile/src/features/checklist/checklist-visibility.test.ts`

- [ ] Derive hide/green from shared pure helpers exported from checklist-presentation (or shared package).
- [ ] Mirror web presentation tests for hide/green independence.

**Acceptance:** Mobile uses same presentation semantics or audit documents explicit deferral.

---

## Verification (when chosen; not a gate for this plan)

- Vitest: touched suites only per task.
- pgTAP: Task 4 only if SQL touched.
- Manual smoke: calendar completion toggle, Today hide filter, Insights historical completion.
