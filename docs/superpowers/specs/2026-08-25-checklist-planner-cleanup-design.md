# Checklist and Planner Cleanup Design

**Date:** 2026-08-25  
**Status:** Approved  
**Source:** `docs/checklist-planner-cleanup-audit.md`

## Goal

Consolidate checklist projection, completion intent, planner reconciliation, and
the largest UI/domain seams without changing the approved goal semantics. Ship
the work as a stacked series of small pull requests based on the existing
`#654` chain.

## Product semantics

- `selectedDate` controls checklist lifecycle and exact-date facts.
- `asOfDate` controls the current progress/outcome summaries already returned
  by the progress context API.
- Period checklist facts retain the selected period-window behavior, including
  later dates in that period; the new types make that scope explicit.
- An exact-date checkbox, period satisfaction, lifetime achievement, and
  target-achieved hiding remain independent presentation facts.
- Period-cadence goals use exact-date completion routing on every surface.
- Planner credit and classification come only from kernel reconciliation.
- Goal definition fields remain immutable after a persisted goal is created.

## Architecture

The cleanup introduces three focused domain boundaries:

1. `ChecklistTemporalContext` and `ChecklistGoalPresentation` centralize
   checklist count, green state, exact-date state, sorting, and target-achieved
   hiding. `TodayTab` shapes inputs once; `GoalCard` renders the result.
2. `resolveCompletionIntent` accepts normalized checklist, insights, or planner
   input and returns route, date, desired state, disabled reason, and planner
   expectations. It delegates low-level route selection to the existing
   dispatch engine and owns legacy-period normalization during the migration.
3. Planner context loading treats the active snapshot as identity and placement
   data. The kernel's reconciled work units are overlaid before the snapshot is
   exposed to calendar projection and mutation controls.

The UI work follows those boundaries: extraction is move-only after the domain
contracts are stable, and presentation components do not load data, call
Supabase, or reimplement domain policy. The final contract cleanup makes
stored `target_basis` reads explicit, documents invariant ownership, tightens
planner wire unions, and replaces substantial SQL function-body string patches
with full forward `CREATE OR REPLACE FUNCTION` definitions.

## Error handling and observability

Existing actionable client/API errors remain in place. Pure resolvers return
stable disabled reasons; mutation hooks retain toast, cache invalidation, and
transport responsibilities. Planner parity failures are reported with the
existing error-reporting path and the machine code `reconciliation_mismatch`.
The SQL boundary continues to enforce invariants independently of early
client/API validation.

## Stacked delivery

The child branches will be created in this order:

1. Phase 0 temporal, period-domain, checklist, and completion characterization.
2. Canonical checklist projection and Today wiring.
3. Completion-intent resolver; Today, Insights, and Calendar migrations.
4. Planner reconciliation authority and entry parity.
5. Recurrence labels and checklist cache normalization.
6. Goal-form, Today, and Calendar composition-shell extraction.
7. Internal filter naming cleanup.
8. Canonical target-basis reads, validation ownership documentation, and typed
   planner contracts.
9. Explicit SQL rewrites with focused pgTAP regression coverage.

Every branch is based on its immediate predecessor, pushed to `origin`, and
opened as a PR against that predecessor. Fixes discovered during self-review
are committed to the branch that owns the affected behavior, then descendants
are restacked.

## Verification

Each code PR adds or updates focused Vitest/component coverage before changing
production behavior. Database changes add or update pgTAP tests. Before the
final handoff, run the touched Vitest suites, relevant SQL tests when the local
Supabase runtime is available, `git diff --check`, and changed-file lint
diagnostics. A full repository typecheck or CI rerun is not a gate unless
needed to diagnose a concrete issue.
