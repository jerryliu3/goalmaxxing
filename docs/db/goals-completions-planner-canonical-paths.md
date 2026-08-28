# Goals, completions, and planner canonical paths

## Goal creation validation

| Invariant | Canonical layer | Early check | Tests |
|---|---|---|---|
| Create-mode field validation | `src/features/goals/goal-creation-model.ts` | goal-form, bulk, coach | `goal-creation-model.test.ts` |
| Period/lifetime target bounds | `src/lib/goals/definition-validation.ts` | creation model + API parse | `definition-validation.test.ts` |
| Persisted definition immutability | `update_goal` SQL RPC | goal-form edit lock | `goals_write_boundary.test.sql` |
| Stored `target_basis` reads | `src/lib/goals/target-basis.ts` | goal-form hydrate, planner | `target-basis.test.ts` |

## Goal archive

| Invariant | Canonical layer | Early check | Tests |
|---|---|---|---|
| Archive stamps `archived_at` | `set_goal_archived` SQL RPC | goal-form archive action | `goals_write_boundary.test.sql` |
| Incomplete planner rows removed on archive | `delete_incomplete_planner_items_for_goal` | n/a | `goal_archive_planner_cleanup.test.sql` |
| Archived goals excluded from planner prepare | `prepare_planner_schedule_core` | n/a | `goal_archive_planner_cleanup.test.sql` |


| Invariant | Canonical layer | Early check | Tests |
|---|---|---|---|
| Lifetime target cap on schedule moves | `set_planner_schedule` SQL RPC | n/a | planner write-boundary tests |

## Completion writes

| Invariant | Canonical layer | Early check | Tests |
|---|---|---|---|
| Exact-date idempotency | completion RPCs + `/api/completions` | route handler | `route.test.ts`, `exact-date-dispatch.test.ts` |
| Planner digest expectations | `exact-date-dispatch.ts` | route handler | `exact-date-dispatch.test.ts` |
| Cross-surface route choice | `completion-intent.ts` | Today, Insights, Calendar adapters | `completion-intent.test.ts` |

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
