# Goals, Completions, and Planner Canonical Paths

## `target_basis` reads

- Persisted `Goal.target_basis` is required (`period` | `lifetime`) on product types.
- `resolveGoalTargetBasis` returns the stored column or structural `lifetime` for `fixed_milestones`.
- `inferLegacyGoalTargetBasisForRepair` is repair/migration-only; product read paths must not call it.

## Reconciliation observability

- Kernel work units are the authority for planner credit/classification.
- `hydrateActivePlanItemsFromWorkUnits` overwrites active-plan snapshot rows before client render.
- When a snapshot row diverges from its work unit on `classification` or `credit_state`, `context-loader` emits `reportError` with code `reconciliation_mismatch` (observability only).

## Completion intent surfaces

- Checklist, Insights, and Calendar adapters resolve through `src/lib/planner/completion-intent.ts`.
- Calendar UI must not call `resolveCompletionDispatch` directly; use `resolvePlannerEntryCompletionIntent`.
