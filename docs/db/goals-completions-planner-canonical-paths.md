# Goals, completions, and planner canonical paths

Living inventory of canonical enforcement layers for goals, completions, checklist,
and planner boundaries. Closure v2 additions are marked in the **Closure v2** section.

## Goal creation validation

| Invariant | Canonical layer | Early check | Tests |
|---|---|---|---|
| Create-mode field validation | `src/features/goals/goal-creation-model.ts` | goal-form, bulk, coach | `goal-creation-model.test.ts` |
| Period/lifetime target bounds | `src/lib/goals/definition-validation.ts` | creation model + API parse | `definition-validation.test.ts` |
| Persisted definition immutability | `update_goal` SQL RPC | goal-form edit lock | `goals_write_boundary.test.sql` |
| Stored `target_basis` reads | `src/lib/goals/target-basis.ts` | goal-form hydrate, planner | `target-basis.test.ts`, `goal_target_basis_rpc.test.sql` |

## Goal archive

| Invariant | Canonical layer | Early check | Tests |
|---|---|---|---|
| Archive stamps `archived_at` | `set_goal_archived` SQL RPC | goal-form archive action | `goals_write_boundary.test.sql` |
| Incomplete planner rows removed on archive | `delete_incomplete_planner_items_for_goal` | n/a | `goal_archive_planner_cleanup.test.sql` |
| Archived goals excluded from planner prepare | `prepare_planner_schedule_core` | n/a | `goal_archive_planner_cleanup.test.sql` |

## Planner schedule moves

| Invariant | Canonical layer | Early check | Tests |
|---|---|---|---|
| Lifetime target cap on schedule moves | `set_planner_schedule` SQL RPC | n/a | planner write-boundary tests |

## Completion writes

| Invariant | Canonical layer | Early check | Tests |
|---|---|---|---|
| Exact-date idempotency | completion RPCs + `/api/completions` | route handler | `route.test.ts`, `exact-date-dispatch.test.ts` |
| Planner digest expectations | `exact-date-dispatch.ts` | route handler | `exact-date-dispatch.test.ts` |
| Cross-surface route choice | `completion-intent.ts` | Today, Insights, Calendar adapters | `completion-intent.test.ts`, `completion-intent-parity.test.ts` |

## Checklist presentation

| Invariant | Canonical layer | Early check | Tests |
|---|---|---|---|
| Checkbox vs green vs hide | `checklist-presentation.ts` | TodayTab projection | `checklist-presentation.test.ts`, `checklist-selectors.test.ts` |
| Temporal scope | `period-domain.ts` + `docs/checklist-temporal-context.md` | progress context API | `period-domain.test.ts` |

## Planner credit

| Invariant | Canonical layer | Early check | Tests |
|---|---|---|---|
| Credit/classification | `reconciliation.ts` via kernel | context hydration | `work-units.test.ts`, `active-plan-reconciliation.test.ts` |
| Active snapshot identity | `context-loader.ts` | n/a | planner characterization tests |

## Closure v2 additions

### Strict `target_basis` reads

- Persisted `Goal.target_basis` is required (`period` | `lifetime`) on product types.
- `resolveGoalTargetBasis` returns the stored column or structural `lifetime` for `fixed_milestones`.
- `inferLegacyGoalTargetBasisForRepair` is repair/migration-only; product read paths must not call it.
- pgTAP: `goal_target_basis_rpc.test.sql` asserts non-null persisted `target_basis` and `private.resolve_goal_target_basis` boundary behavior.

### Reconciliation observability

- Kernel work units are the authority for planner credit/classification.
- Active-plan snapshot items are identity-only (`id`, schedule, lock, revision, `unit_key`, `plan_goal_id`). They do not carry credit or classification.
- When a snapshot item has no matching work unit, `context-loader` emits `reportError` with code `reconciliation_mismatch` and `reason: "missing_work_unit"` (observability only). Credited historical units without a persisted item are not mismatches.

### Completion intent surfaces

- Checklist, Insights, and Calendar adapters resolve through `src/lib/planner/completion-intent.ts`.
- Calendar UI must not call `resolveCompletionDispatch` directly; use `resolvePlannerEntryCompletionIntent`.
