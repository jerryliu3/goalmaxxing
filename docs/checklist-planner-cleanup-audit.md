# Checklist and Planner Cleanup Audit

Status: Proposed cleanup backlog  
Last updated: 2026-08-25  
Scope: goals, completions, checklist, insights, planner/calendar, progress context, and related database boundaries

## Executive summary

The current implementation is functional but is visibly shaped by several incremental
feature changes rather than one coherent domain model. I would not choose this exact
structure if building the current configurability from scratch.

The main problem is not the number of files. The problem is that several important
concepts are represented more than once:

- period scope is derived from both `viewDate` and `asOfDate`,
- target basis is inferred in multiple TypeScript and SQL locations,
- progress, planner reconciliation, and XP each have related but different credit
  calculations,
- completion routing is selected by multiple surface-specific adapters,
- checklist green state, checklist hiding, and planner toggle eligibility each
  re-derive related state independently,
- the active planner snapshot and the planner kernel expose two different credit
  models.

That makes individual fixes look small while creating cross-surface regressions. The
recent `target_basis` and checklist changes exposed this directly: a target cap
regression, an attempted but incomplete historical-date scoping change, different
completion dispatch routes, and green/hide behavior that could not be explained by
one canonical state object.

The recommended direction is a staged consolidation, not a rewrite:

1. Freeze the intended product semantics with characterization and golden-vector tests.
2. Create one canonical checklist presentation model from a single temporal context.
3. Create one completion-intent resolver shared by Today, Insights, and Calendar.
4. Make planner reconciliation the only source of planner credit/classification.
5. Split the large UI orchestration files after the domain boundaries are stable.
6. Reduce migration patching and duplicate validation only after behavior is covered.

No broad cleanup should be merged as one large refactor. The work should be shipped
as small, behavior-preserving slices.

## Product semantics to preserve

These are the semantics implied by the current product decisions and recent fixes.
They should become explicit contracts before deeper refactoring.

### Goal target basis

| User choice | Internal meaning | Count scope |
|---|---|---|
| Recurring period goal | `target_basis = "period"` and requirement kind `cadence` | Number of distinct completion dates in the selected day/week/month period |
| Recurring lifetime target | `target_basis = "lifetime"` and requirement kind `deadline_total` | Total credited completions across the goal lifetime |
| Fixed milestones | requirement kind `milestone_sequence` | Total ordered milestone completions |

Period goals should have a target of at least `1`. The current UI now defaults
period targets to `1`, but the database shape still permits `NULL` and interprets
it with `coalesce(..., 1)`. Fixed milestones must always have a positive target.
The current database shape requires a recurring lifetime target to be positive,
while the current form labels that field as optional and allows it to be cleared.
Those are contract mismatches, not settled product semantics.

The simplest consistent choice is to make “lifetime target” an optional mode, but
require a positive value once that mode is selected. If the product instead wants a
recurring lifetime goal with no total target, that needs an explicit representation
and corresponding planner/progress semantics; it should not silently fall through to
`positiveTarget(... ?? 1)` and behave as a one-completion deadline.

The current product decision is that target basis, frequency, target count, goal
type, and start date are immutable after creation. Users change those semantics by
ending/archiving the old goal and creating a new one. The database enforces this
decision, but the edit form does not fully communicate or enforce it yet.

### Checklist state

The checklist has three separate concepts and they should not be collapsed:

1. **Exact-date checkbox**
   - Checked when a completion fact exists on the selected checklist date.
   - Toggling it changes that exact date for current or past dates.
2. **Green card background**
   - Green when a lifetime/fixed target outcome is achieved, or when a period goal
     has satisfied its target within the selected period.
   - A single completion on a goal whose target is greater than one does not make
     the card green.
3. **Show completed goals filter**
   - The achieved day remains visible so the user can see the action that completed
     the target.
   - Once that day has passed, target-achieved goals are hidden when the filter is
     off.
   - A period goal becomes eligible for hiding again independently in each period.

The checkbox being checked does not by itself imply that the card should be green,
hidden, or considered lifetime-achieved.

### Planner/calendar state

Planner entries expose at least two distinct facts:

- `creditState`: whether a completion is credited to that scheduled unit and whether
  it was completed on the scheduled date or elsewhere.
- `classification`: the obligation/planner state, such as `fulfilled`,
  `satisfied_elsewhere`, `historical_miss`, or `open`.

A green planner entry generally means it is credited. It does not necessarily mean
that the exact row can be toggled:

- `satisfied_elsewhere`: another completion satisfies the planner obligation, so
  the displayed row is not the canonical fact to remove.
- `future_creation`: a new future completion is prohibited.
- `out_of_scope_route`: the current planner context cannot mutate the required
  planner item/goal route.
- `draftGhost` or unsupported state: the row is a visual draft artifact, not a
  canonical mutation target.

This distinction is correct in principle, but the UI should expose it as one
precomputed control state rather than making users infer it from color and a
later toast.

## Current end-to-end architecture

### Checklist read path

```text
ChecklistShell
  -> TodayTab
     -> useChecklistData
        -> /api/progress/context
           -> goals + all completions
           -> getGoalProgressSnapshot(asOfDate)
           -> getChecklistFacts(viewDate)
     -> checklist-selectors
        -> lifecycle placement
        -> target-achieved hiding
        -> recurrence grouping/filtering
     -> GoalCard
        -> count and green presentation
        -> CompletionToggle
```

The API intentionally returns both:

- `summaries`, calculated at `asOfDate` for progress/outcome,
- `facts`, calculated for the selected `viewDate` for checklist rendering. Period
  goals currently receive all facts in the selected period, including later dates;
  lifetime-target goals receive the selected-date fact.

That can be a valid design, but the distinction is currently implicit. Components
sometimes consume a summary where they need view-date presentation state.

### Planner/calendar read and write path

```text
planner context/prepare API
  -> context-loader
     -> active planner snapshot
     -> planner kernel work units
     -> reconciliation
  -> calendar entry projection
  -> planner day entry controls
     -> completion-entry-dispatch
     -> resolveCompletionDispatch
     -> useCompletionMutation
     -> /api/completions
     -> exact-date dispatch or completion RPC
```

The read path carries both active-plan item data and kernel work-unit data. The
write path then infers a route from the merged entry. This creates a large surface
for mismatches between the displayed state and the mutation state.

## Findings

### P0: correctness and semantic drift

#### P0.1 Temporal context is split and inconsistently applied

**Evidence**

- `src/features/today/today-tab.tsx`
  - lifecycle placement uses the selected `viewDate`,
  - `progressByGoal` comes from summaries calculated at `todayLocalDate`,
  - checklist sorting combines summary outcomes and view-date facts.
- `src/features/today/goal-card.tsx`
  - lifetime counts and outcomes still come from the progress summary,
  - period counts are derived from checklist facts.
- `src/app/api/progress/context/route.ts`
  - summaries use `asOfDate`,
  - checklist facts use `viewDate`.
- `src/features/today/use-checklist-data.ts`
  - the initial load and the view-date-only refresh have different update/cache
    paths.

**Risk**

Browsing a past date can display a current outcome, current lifetime count, or
current shortfall badge beside historical-day facts. Some of this is intentional,
but the current UI does not label the temporal context and not every presentation
uses the same rule.

**Recommendation**

Introduce an explicit domain value used by all checklist presentation code:

```ts
interface ChecklistTemporalContext {
  selectedDate: string;
  asOfDate: string;
  weeklyAnchor: WeeklyAnchorContext | null;
}
```

Then derive a single `ChecklistGoalPresentation` object containing:

```ts
interface ChecklistGoalPresentation {
  exactDateCompleted: boolean;
  periodCompletionCount: number | null;
  periodTarget: number | null;
  periodSatisfied: boolean;
  lifetimeCompletionCount: number;
  lifetimeAchieved: boolean;
  shouldSortToBottom: boolean;
  shouldHideWhenCompletedFilterOff: boolean;
  completedOnDateForFilter: string | null;
}
```

The API/client boundary should state whether each field is view-scoped or as-of
scoped instead of exposing generic `facts` and `summaries` that callers interpret.

#### P0.2 Period-key domains are related but not explicitly modeled

There are at least three period calculations:

- `src/lib/goals/periods.ts` / progress: profile-calendar anchored periods,
- `private.planner_cadence_period_key` in the planner migrations: planner calendar
  periods,
- `private.goal_period_key` in the XP migrations: goal-anchored XP periods.

The planner and XP split appears intentional, but it is easy to mistake these for
one universal period key. The same weekly goal can therefore belong to different
period identities for progress, planner placement, and XP.

**Recommendation**

Keep the domains separate if product semantics require it, but name and type them
explicitly:

```ts
type PlannerCalendarPeriodKey = string;
type ProgressDisplayPeriodKey = string;
type XPCreditPeriodKey = string;
```

Add shared golden vectors that show both aligned and intentionally different cases.
Do not make one helper serve all three domains.

#### P0.3 Completion dispatch differs by surface

**Evidence**

- Today uses `isTargetedRecurringGoal(goal) || isPeriodCadenceGoal(goal)`.
- Insights uses `isTargetedRecurringGoal(goal)` only.
- Calendar infers targeted behavior from `requirementKind` and whether
  `activeGoal` exists.
- Today still contains special `legacy_period` date/state handling.
- Calendar and Insights pass their own date/state combinations.

**Risk**

The same period cadence goal can route through exact-date semantics on one surface
and legacy period semantics on another. Unmarking can therefore remove a different
completion depending on where the user clicks.

**Recommendation**

Create one pure `resolveCompletionIntent` function that accepts a normalized entry
and returns the complete mutation decision:

```ts
interface CompletionIntent {
  allowed: boolean;
  reason: CompletionDisabledReason | null;
  route: CompletionRoute;
  goalId: string;
  date: string;
  desiredFactState: "present" | "absent";
  plannerExpectation?: PlannerExpectation;
}
```

Today, Insights, and Calendar should only adapt their local UI entry into the
normalized input. They should not each decide whether a goal is “targeted.”

#### P0.4 Active-plan snapshot and kernel reconciliation are two credit models

**Evidence**

- `src/lib/planner/context-loader.ts` `loadActivePlanSnapshot` assigns credit only
  when `completion.completed_on === item.scheduled_date` and emits simplified
  `fulfilled`/`open` state.
- `src/lib/planner/reconciliation.ts` performs kind-specific credit-window
  reconciliation and can emit `completed_elsewhere`, `satisfied_elsewhere`, and
  historical classifications.
- `src/features/planner/calendar-entries.ts` merges the two models and uses the
  active item for dispatch metadata.

**Risk**

An entry may display kernel classification/credit while its attached active item
describes a different state. Entries that exist only in one source can behave
incorrectly.

**Recommendation**

Make reconciliation the only authority for planner credit/classification. The
active plan should provide persistence identity, scheduled placement, lock state,
and revision metadata, then receive reconciled state from the same domain function.

#### P0.5 Completion invariants are not uniformly enforced at the write boundary

The API and exact-date planner handlers perform several checks, including future
dates, goal lifetime, planner digest, and link suppression. The database completion
RPCs and cascade paths do not necessarily enforce the same complete matrix.

**Recommendation**

Inventory every completion write path and define one invariant matrix:

| Invariant | API | exact-date handler | DB RPC/cascade |
|---|---:|---:|---:|
| authenticated owner/team access | yes | yes | yes |
| future-date restriction | yes | yes | yes |
| goal lifetime | API-dependent | handler-dependent | verify/enforce |
| linked-goal suppression | planner-dependent | handler-dependent | decide/enforce |
| idempotent exact-date write | yes | yes | yes |

The database must own invariants that must survive bypassing a specific HTTP route.
API checks should remain for early, actionable errors.

#### P0.6 The edit form exposes a database-immutable target

**Evidence**

- `src/features/today/goal-form.tsx` sets `definitionFieldsLocked = isEditing`.
- Goal type and frequency receive a visual `pointer-events-none` lock.
- The target-count fields do not receive the same lock or a real `disabled` prop.
- `update_goal` in `20260825120000_additive_goal_target_basis.sql` rejects changes
  to `target_count`, `target_basis`, `frequency_type`, and `start_date` with
  `goal definition fields are immutable after creation`.

**User-visible result**

The edit form permits typing a new target, but save fails with the database
immutability error. This is a UI/API contract mismatch, not evidence that target
changes are currently supported.

**Historical behavior**

The current model cannot safely change a target while preserving historical weeks.
Changing a weekly target from `2` to `4`, for example, would change the meaning of
past period satisfaction unless each period stored the definition that applied to
it. The current implementation deliberately avoids that complexity by rejecting the
change and requiring archive/end plus a new goal.

**Recommendation**

Make all immutable definition controls genuinely disabled in edit mode, add concise
copy explaining “Archive and create a new goal to change the target or frequency,”
and retain the database guard. Supporting mutable targets requires a separate
versioned-goal-definition design with an effective date and historical progress
replay; it should not be implemented as a client-only relaxation.

### P1: duplicated domain logic

#### P1.1 Target basis is resolved in multiple places

Related implementations exist in:

- `src/lib/goals/target-basis.ts`,
- `src/lib/goals/definition-validation.ts`,
- `goal-form.tsx`,
- `private.resolve_goal_target_basis` in SQL.

The database column is now intended to be canonical, but TypeScript still has
legacy inference fallbacks.

**Recommendation**

After all persisted rows and selects guarantee non-null `target_basis`, read the
column directly. Keep one explicit legacy-normalization function for migration or
repair tooling, not in every product read path.

#### P1.2 Checklist count, green, and hide logic are separate implementations

Related logic currently exists in:

- `GoalCard` for period count and green background,
- `TodayTab` for green sorting,
- `checklist-selectors` for completed-goal filtering,
- `schedule.ts` for period summaries,
- `progress.ts` / `admissible.ts` for current-period progress.

Each implementation is individually understandable, but they can disagree because
they receive different inputs and time scopes.

**Recommendation**

Create one pure checklist presentation selector. `GoalCard` should render its
result; `TodayTab` should sort/filter using the same result; no component should
recompute target satisfaction.

#### P1.3 Period fact shaping exists in API and client modules

- `groupCompletions` in `src/app/api/progress/context/route.ts` duplicates
  `groupCompletionsByGoalId`.
- `getChecklistFacts` in the API and `getCompletionsForCurrentPeriod` in
  `src/lib/goals/schedule.ts` represent nearly the same period filtering concept.

**Recommendation**

Define the period/fact contract once. The server may use a server-compatible
implementation, but its boundary should be tested against the same golden vectors
as the client helper.

#### P1.4 Completion routing is spread across four layers

The following all participate in route choice or eligibility:

- `src/features/planner/completion-entry-dispatch.ts`,
- `src/lib/planner/completion-dispatch.ts`,
- `src/features/planner/use-planner-entry-mutations.ts`,
- `src/lib/planner/exact-date-dispatch.ts`,
- `src/app/api/completions/route.ts`.

Some checks are correctly repeated at the server boundary, but intent construction,
disabled reason selection, and date normalization are duplicated.

**Recommendation**

Separate responsibilities:

1. pure client/domain intent resolver,
2. shared request schema,
3. server authorization/invariant validator,
4. one mutation executor.

Remove `legacy_period` after its callers are migrated and fixture coverage proves
there are no remaining product paths.

#### P1.5 Immutability/movability rules are duplicated

Related checks exist in:

- `src/features/planner/calendar-format.ts`,
- `src/lib/planner/direct-draft.ts`,
- `src/lib/planner/publish-payload.ts`,
- `src/features/planner/completion-entry-dispatch.ts`.

**Recommendation**

Centralize planner unit state predicates:

```ts
isCompletionCredited(unit)
isCompletionToggleable(entry)
isDraftMovable(unit)
isPublishable(unit)
```

The predicates can still have different names because the policies differ; the
important part is that each policy has one canonical implementation.

### P1: file and interface structure

#### P1.6 `today-tab.tsx` is a mixed-concern orchestrator

`src/features/today/today-tab.tsx` currently owns filter state, data loading
integration, progress projection, lifecycle selection, sort/filter projection,
completion mutations, refresh behavior, toast copy, scroll restoration, dialog
markup, Duo modes, and task-panel placement.

**Recommendation**

Split in this order:

1. `useChecklistFilters`
2. `useChecklistProjection`
3. `useChecklistCompletionActions`
4. `ChecklistFiltersDialog`
5. `TodayTab` as a composition shell

Do not start by moving arbitrary blocks. Each extracted module should have a
domain-level interface and a focused test.

#### P1.7 `goal-form.tsx` is both page, state machine, validator, and RPC client

The form handles loading, edit-state hydration, category/link/photo selection,
validation, capacity warnings, archive/delete, planner-task creation, goal creation,
goal update, photo upload, and navigation.

**Recommendation**

Extract:

- `useGoalFormState`,
- `useGoalFormValidation`,
- `buildGoalMutationArgs`,
- `useGoalFormSubmit`,
- presentational sections for identity, schedule, targets, and advanced settings.

The target-basis and requirement mapping should remain in domain modules, not be
reconstructed in JSX handlers.

#### P1.8 `calendar-surface.tsx` is a second orchestration monolith

It coordinates month state, URL state, DnD, draft overlays, day previews, coach
proposals, mutation state, context loading, and multiple rendering modes.

**Recommendation**

Prioritize extracting planner completion controls and day-preview orchestration,
then DnD/draft state. Leave the surface as a route-level composition shell.

#### P1.9 Loose wire types erase domain guarantees

`packages/shared/src/planner/context.ts` and
`src/features/planner/calendar-surface.types.ts` use `string` for classification and
credit state even though the domain has finite unions in
`src/lib/planner/context-loader.ts` and `src/lib/planner/work-units.ts`.

**Recommendation**

Define shared wire unions for classification, credit state, disabled reason, and
requirement kind. Parse them at the API boundary and preserve those types through
calendar entry projection.

#### P1.10 Filter naming obscures lifecycle semantics

Examples:

- `completedOpen` controls the “Past” panel,
- `showCompletedGoals` hides target-achieved goals from the main list,
- `showPastGoals` means ended goals rather than an arbitrary historical date,
- `activeGoals` is filtered by lifecycle at the selected view date while progress may
  remain as-of today.

**Recommendation**

Rename internal values around exact concepts:

- `pastPanelOpen`,
- `showTargetAchievedGoals`,
- `showEndedGoals`,
- `targetAchievedGoalIds`.

Keep user-facing labels stable unless product copy is intentionally changing.

#### P1.11 Recurrence labels are duplicated

Recurrence labels are derived in:

- `checklist-selectors.ts`,
- `schedule.ts`,
- `linked-goal-labels.ts`,
- bulk goal forms.

**Recommendation**

Use one domain label map for interval/group labels. Keep context-specific prose
outside that map.

#### P1.12 Cache and load paths are difficult to reason about

`use-checklist-data.ts` has:

- a full load path,
- a view-date-only progress refresh,
- a completion-only refresh,
- cache reads/writes,
- partner lane handling,
- request versioning and abort handling.

This is defensively written but makes it easy for one path to update state without
updating the corresponding cache entry.

**Recommendation**

Represent data loading as one state model with explicit operations:

```ts
type ChecklistLoadMode = "initial" | "viewDate" | "completionRefresh" | "force";
```

Each successful operation should update the same normalized cache shape. Add tests
for stale response cancellation and cache invalidation.

#### Resolved: bulk-editor duplication and semantic drift

The bulk goal editor duplication finding is resolved for the current creation
workflow. Bulk and planner-coach drafts now use the shared
`src/features/goals/goal-creation-fields.tsx` component, the canonical
`BulkGoalDraftReview` shell, and the shared
`src/features/goals/bulk-goal-persistence.ts` contract. Target transitions,
validation normalization, metadata fields, and link persistence therefore share
one prepared-row boundary instead of diverging across the two callers.

### P2: migration and database maintenance

#### P2.1 Function-body string patching is fragile

Several migrations use `pg_get_functiondef` plus string replacement to patch existing
function bodies, including planner preparation and target-basis changes.

This is useful for additive migration work, but it couples migrations to exact
whitespace/body text and can fail partially or silently when a prior function body
changes.

**Recommendation**

For future substantial rewrites, use explicit `CREATE OR REPLACE FUNCTION` bodies
or move canonical SQL function definitions into versioned SQL source files and
generate migrations from them. Keep string patches only for narrow, verified
additive changes.

#### P2.2 Current SQL behavior is hard to discover

The repository has legacy numbered migrations plus dense dated additive migrations.
The migration history is useful, but the current canonical function body is not
obvious without reading the full chain.

**Recommendation**

Maintain a short living inventory:

```text
docs/db/goals-completions-planner-canonical-paths.md
```

It should list the current write RPCs, current planner functions, ownership rules,
and which older functions are superseded.

#### P2.3 Validation ownership is not obvious

Validation is split among form code, TypeScript domain helpers, API routes, exact-date
handlers, SQL RPCs, and database constraints.

**Recommendation**

For every invariant, document:

- canonical enforcement layer,
- early client/API check,
- stable machine error code,
- test location,
- whether cascades and service-role writes are covered.

### P2: test and observability gaps

The repository has good focused tests for periods, reconciliation, exact-date
dispatch, and several SQL write boundaries. The following gaps remain:

1. A single checklist presentation test covering:
   - exact-date checkbox,
   - period count,
   - period green,
   - achieved-day visibility,
   - post-achievement hiding,
   - next-period reset.
2. Cross-surface completion intent parity for Today, Insights, and Calendar.
3. Active-plan snapshot vs kernel reconciliation parity.
4. View-date browsing tests for lifetime counts and outcome badges.
5. Cache update/invalidation tests in `use-checklist-data`.
6. Tests proving all `target_basis` read paths use the stored column after backfill.
7. pgTAP coverage for target-basis shape/backfill and completion lifetime enforcement.
8. Golden vectors for planner, progress, and XP period domains.
9. Tests for `external_sync` completion sources in planner schemas.
10. Tests for per-entry, rather than global, mutation loading behavior.

Observability should use stable machine codes for:

- completion disabled reason,
- stale planner revision,
- period-domain mismatch,
- reconciliation mismatch,
- target-basis normalization fallback.

## Target architecture

```text
DB canonical writes
  -> typed API contracts
     -> domain read model
        -> checklist presentation selector
        -> planner entry selector
        -> one completion-intent resolver
           -> one mutation executor
```

### Domain read model

The read model should make temporal scope and credit semantics explicit:

```ts
interface GoalReadModel {
  goal: Goal;
  targetBasis: "period" | "lifetime";
  requirement: GoalRequirement;
  lifetimeProgress: LifetimeProgress;
  selectedPeriodProgress: PeriodProgress | null;
  exactDateFact: CompletionDateFact | null;
  lifecycleAtSelectedDate: GoalLifecycle;
  outcomeAsOfDate: GoalOutcome;
}
```

The checklist, insights, and planner surfaces can then choose the fields appropriate
to their product purpose without re-deriving the underlying rules.

### Completion intent

The resolver should return the complete result, including date normalization and
disabled reason. A UI should not need to know whether a route is legacy, exact-date,
planner-item, or planner-goal.

### Planner entry model

Planner entries should carry:

- persisted identity,
- scheduled date,
- reconciled credit state,
- reconciled classification,
- draft visual state,
- precomputed completion control state.

The UI should not infer requirement kind from `unitKey` prefixes when the server can
provide the typed requirement kind directly.

## Recommended delivery sequence

### Phase 0: characterization and semantic contracts

- Add shared golden vectors for period domains.
- Add checklist presentation tests.
- Add cross-surface completion-intent parity tests.
- Document the temporal rule for selected date versus current/as-of date.

### Phase 1: canonical checklist projection

- Add one pure checklist presentation selector.
- Wire GoalCard, TodayTab sorting, and completed filtering to it.
- Keep existing API shape initially; adapt facts/summaries at one boundary.
- Remove duplicate period-count and green-state calculations.

### Phase 2: completion intent consolidation

- Add the shared intent resolver.
- Migrate Today first, then Insights, then Calendar.
- Move legacy-period date/state normalization into the resolver.
- Remove the old surface-specific branches after parity tests pass.

### Phase 3: planner reconciliation consolidation

- Make kernel reconciliation the source of credit/classification.
- Reduce active-plan snapshot to identity/placement/revision data.
- Add parity tests for entries with and without matching preview units.

### Phase 4: UI decomposition

- Split `today-tab.tsx`.
- Split `calendar-surface.tsx`.
- Split `goal-form.tsx`.
- Rename ambiguous state variables while preserving user-facing labels.

### Phase 5: database and contract cleanup

- Remove target-basis inference from normal reads.
- Consolidate or explicitly document completion validation ownership.
- Replace fragile function string patches where substantial rewrites are required.
- Tighten shared wire types and add schema contract tests.

## Non-goals

- Do not collapse cadence, lifetime totals, and milestone sequences into one
  persistence shape without a separate product decision.
- Do not merge planner calendar periods with XP goal-anchored periods merely to reduce
  the number of helpers.
- Do not move all business logic into React components.
- Do not rewrite the planner kernel and reconciliation algorithm as part of a UI
  decomposition.
- Do not remove server-side invariant checks because a client selector already
  performs an early check.

## Definition of a successful cleanup

The cleanup is successful when:

- one selector determines checklist period count, green state, and target-achieved
  filter behavior;
- one resolver determines completion route, date, desired state, and disabled reason
  for all surfaces;
- planner credit/classification has one reconciliation authority;
- target basis is read from one canonical stored field;
- selected-date and as-of-date semantics are visible in types and API contracts;
- major UI files are composition shells rather than state/side-effect monoliths;
- cross-surface and database boundary tests protect these contracts.

