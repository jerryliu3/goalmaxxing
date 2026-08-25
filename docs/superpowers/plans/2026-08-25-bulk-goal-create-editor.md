# Bulk Goal Create Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the duplicated bulk/coach draft editors with one create-mode editor that shares the streamlined single-goal creation controls and enforces the approved target semantics before persistence.

**Architecture:** Keep persistence orchestration in the single-goal, bulk, and coach shells, but extract one reusable creation-fields component plus pure creation-field transitions and validation normalization. `BulkGoalDraftReview` becomes the only draft list/editor shell, `BulkGoalForm` delegates to it, and coach creation uses the same prepared-row and link persistence path.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Testing Library, Supabase RPCs, pgTAP.

## Global Constraints

- Bulk and planner-coach drafts use the same create-mode editor.
- The editor matches the visible single-goal create form and does not add photo or reward-text controls.
- Unsaved drafts keep goal type, recurrence interval, target basis, target count, dates, category, default time, difficulty, privacy, links, and milestone names editable wherever those controls are visible in single-goal creation.
- Persisted-goal edit mode keeps goal type, cadence, target basis, target count, and start date disabled.
- Recurring period goals default to target `1`; weekly targets are `1..7`; monthly targets are `1..31`; daily period goals persist target `1`.
- Explicit lifetime recurring goals require a positive total target and use the label `Total target completions`.
- Fixed-milestone goals always use lifetime semantics, require a positive count, and synchronize milestone names with that count.
- Selected invalid drafts disable creation; unselected invalid drafts remain visible and editable.
- Period upper bounds are enforced independently of optional profile-capacity warnings.
- RPC failures preserve drafts, clear saving state, and show an actionable error.
- Do not change planner/checklist completion semantics or persisted-goal definition immutability.
- Use existing field-kit, date, category, link, milestone, validation, and cache utilities before introducing new abstractions.
- Add focused tests for every changed branch; do not claim repository-wide mathematical 100% coverage.

---

### Task 1: Extract the shared creation-field model

**Files:**
- Create: `src/features/goals/goal-creation-model.ts`
- Test: `src/features/goals/goal-creation-model.test.ts`
- Modify: `src/features/today/goal-form.tsx`
- Modify: `src/features/goals/bulk-goal-drafts.ts`

**Interfaces:**
- Produces `GoalCreationFields`, the common create-mode field shape used by the single-goal form and `BulkGoalDraft`.
- Produces pure helpers for defaults, field transitions, target normalization, and prepared-field validation.

- [ ] **Step 1: Write the failing transition tests**

Cover the following exact target-normalization cases:

```ts
const targetCases = [
  { interval: "daily", basis: "period", rawTarget: "", expected: "1" },
  { interval: "weekly", basis: "period", rawTarget: "", expected: "1" },
  { interval: "monthly", basis: "period", rawTarget: "", expected: "1" },
  { interval: "daily", basis: "lifetime", rawTarget: "", expected: "" },
] as const;

for (const targetCase of targetCases) {
  const normalized = normalizeGoalCreationTarget({
    frequency_type: "recurring",
    recurrence_interval: targetCase.interval,
    target_basis: targetCase.basis,
    target_count: targetCase.rawTarget,
  });
  expect(normalized).toBe(targetCase.expected);
}
```

The lifetime empty-target case must also assert the required-target validation
error.

Also test recurring-to-milestone transitions, milestone-to-recurring
transitions, target-basis switches, valid-count preservation, invalid-count
defaults, milestone-name resizing, and clearing milestone-only prepared values.

- [ ] **Step 2: Run the focused model test and confirm the expected failures**

Run:

```bash
pnpm vitest run src/features/goals/goal-creation-model.test.ts
```

Expected: the new transition helpers are missing and the tests fail for that
reason.

- [ ] **Step 3: Implement the pure creation-field model**

Implement:

```ts
export interface GoalCreationFields {
  title: string;
  description: string;
  category_selection: CategorySelection;
  custom_category: string;
  color: string;
  frequency_type: GoalFrequencyType;
  recurrence_interval: RecurrenceInterval;
  target_count: string;
  target_basis: GoalTargetBasis;
  milestone_names: string[];
  start_date: string;
  end_date: string;
  default_local_time: string;
  difficulty: GoalDifficulty;
  is_private: boolean;
  linked_target_goal_id: string;
}

export function updateGoalCreationFields(
  fields: GoalCreationFields,
  change: GoalCreationFieldChange
): GoalCreationFields;

export function normalizeGoalCreationTarget(
  fields: Pick<GoalCreationFields, "frequency_type" | "recurrence_interval" | "target_basis" | "target_count">
): string;
```

Use the approved defaults and existing milestone helpers. Keep transient link
search/open state outside this common persisted-field shape.

- [ ] **Step 4: Run the model tests and confirm the transition matrix passes**

Run:

```bash
pnpm vitest run src/features/goals/goal-creation-model.test.ts
```

Expected: PASS for every transition and target-default case.

- [ ] **Step 5: Commit**

```bash
git add src/features/goals/goal-creation-model.ts \
  src/features/goals/goal-creation-model.test.ts \
  src/features/today/goal-form.tsx \
  src/features/goals/bulk-goal-drafts.ts
git commit -m "refactor(goals): share creation field transitions"
```

### Task 2: Extract the shared create-mode field UI

**Files:**
- Create: `src/features/goals/goal-creation-fields.tsx`
- Test: `src/features/goals/goal-creation-fields.test.tsx`
- Modify: `src/features/today/goal-form.tsx`

**Interfaces:**
- Consumes `GoalCreationFields`, transient link-control props, optional
  `includePlannerTask`, and `definitionFieldsLocked`.
- Produces the streamlined field layout used by single-goal create, bulk
  drafts, and coach drafts.

- [ ] **Step 1: Write component tests for the create-mode contract**

Cover:

- recurring and fixed-milestone controls;
- daily, weekly, and monthly cadence labels;
- period target labels versus `Total target completions`;
- `min=1`, `max=7`, and `max=31` attributes;
- lifetime target required state;
- create mode has enabled definition controls;
- locked mode disables goal type, cadence, target fields, and dates;
- custom category, default time, difficulty, privacy, links, and milestone
  controls call the supplied update callbacks;
- photo, reward-text, and obsolete bulk-only advanced controls are absent.

- [ ] **Step 2: Run the focused component test and confirm it fails**

Run:

```bash
pnpm vitest run src/features/goals/goal-creation-fields.test.tsx
```

Expected: the shared component is missing or does not yet expose the asserted
controls.

- [ ] **Step 3: Implement the shared field component**

Compose existing `CategorySelect`, `GoalTypeToggle`, `RecurrenceIntervalToggle`,
`TargetCountField`, `GoalDateRangeFields`, `GoalDefaultTimeField`,
`GoalLinkTargetSelect`, `MilestoneNameFields`, `TooltipIcon`, and existing
form-option utilities. Keep the single-goal planner-task control conditional
and outside the goal-only target semantics.

- [ ] **Step 4: Replace the duplicated visible field markup in `GoalForm`**

Pass `definitionFieldsLocked={isEditing}` from the single-goal shell. Preserve
single-goal loading, profile-capacity lookup, RPC calls, task creation, and
navigation behavior in `goal-form.tsx`.

- [ ] **Step 5: Run the focused component tests**

Run:

```bash
pnpm vitest run src/features/goals/goal-creation-fields.test.tsx
```

Expected: PASS for create-mode rendering, locked-mode rendering, and field
interactions.

- [ ] **Step 6: Commit**

```bash
git add src/features/goals/goal-creation-fields.tsx \
  src/features/goals/goal-creation-fields.test.tsx \
  src/features/today/goal-form.tsx
git commit -m "refactor(goals): share create-mode field controls"
```

### Task 3: Align canonical validation and draft preparation

**Files:**
- Modify: `src/lib/goals/definition-validation.ts`
- Test: `src/lib/goals/definition-validation.test.ts`
- Modify: `src/features/goals/bulk-goal-drafts.ts`
- Test: `src/features/goals/bulk-goal-drafts.test.ts`
- Modify: `src/features/goals/goal-creation-model.ts`
- Modify: `src/features/today/goal-form.tsx`

**Interfaces:**
- `validateGoalDefinition` always reports a weekly target above `7` or a
  monthly target above `31`, with capacity-based warnings remaining separate.
- `validateBulkGoalDraft` uses the same required-target and period-bound rules.
- `prepareBulkGoalRows` emits exact target basis and normalized target values.

- [ ] **Step 1: Add the failing validation and payload matrix**

Test recurring daily/weekly/monthly period goals, recurring lifetime goals,
fixed milestones, empty/zero/negative/fractional targets, max and over-max
values, and exact prepared rows. Assert that a lifetime draft with an empty
target is invalid and that period drafts normalize empty targets to `1`.

- [ ] **Step 2: Run the focused validation and draft tests**

Run:

```bash
pnpm vitest run \
  src/lib/goals/definition-validation.test.ts \
  src/features/goals/bulk-goal-drafts.test.ts
```

Expected: the new bounds and required-lifetime assertions fail against the
current implementation.

- [ ] **Step 3: Implement canonical validation changes**

Move the period maximum check out of the optional `capacity` branch. Update
bulk validation to pass normalized period targets, require explicit lifetime
targets, and avoid duplicate messages when a shared validator already reports
the issue.

- [ ] **Step 4: Implement exact row normalization**

Ensure daily period rows emit `target_count: 1`, weekly/monthly period rows
emit a positive normalized target, lifetime recurring rows emit a positive
target, and fixed milestones emit lifetime basis plus normalized milestone
names. Keep description and existing persistence fields in the row contract
without adding their removed UI controls.

Update the single-goal validation adapter so period-limit errors block creation
while profile-capacity warnings remain warnings. Use a distinct stable issue
code for the period-limit branch rather than making the form infer severity
from user-facing message text.

- [ ] **Step 5: Run the focused validation and draft tests**

Run the same command from Step 2. Expected: PASS for every matrix case.

- [ ] **Step 6: Commit**

```bash
git add src/lib/goals/definition-validation.ts \
  src/lib/goals/definition-validation.test.ts \
  src/features/goals/bulk-goal-drafts.ts \
  src/features/goals/bulk-goal-drafts.test.ts \
  src/features/goals/goal-creation-model.ts
git commit -m "fix(goals): enforce bulk target semantics before save"
```

### Task 4: Consolidate the bulk draft review editor

**Files:**
- Modify: `src/features/goals/bulk-goal-draft-review.tsx`
- Test: `src/features/goals/bulk-goal-draft-review.test.tsx`
- Modify: `src/features/today/bulk-goal-form.tsx`

**Interfaces:**
- `BulkGoalDraftReview` remains responsible for selection, removal, summaries,
  warnings, validation display, dialog state, and create guards.
- The dialog delegates all create-mode field rendering and transitions to the
  shared field component/model.

- [ ] **Step 1: Add interaction tests for both full and coach variants**

Cover:

- opening and closing a draft editor;
- editing title, category, custom category, type, cadence, target basis,
  target count, dates, default time, difficulty, privacy, links, and milestone
  names;
- type/cadence/basis transitions;
- create-mode fields are not disabled;
- selected invalid drafts disable create;
- unselected invalid drafts do not disable create;
- removal, inclusion toggles, empty state, warnings, and external guards;
- no photo or obsolete advanced-settings UI.

- [ ] **Step 2: Run the focused review tests and confirm missing behavior**

Run:

```bash
pnpm vitest run src/features/goals/bulk-goal-draft-review.test.tsx
```

Expected: assertions for the new target controls and parity behavior fail
against the duplicated editor.

- [ ] **Step 3: Replace review-dialog field markup with the shared editor**

Remove variant-specific field markup and use the shared create-mode component.
Keep `BulkGoalDraft` envelope fields such as inclusion, row label, errors, and
transient link search/open state in the review shell.

- [ ] **Step 4: Delete the duplicate inline editor from `BulkGoalForm`**

Keep input parsing, starter-pack loading, authentication, available-goal
loading, bulk creation orchestration, and page-level loading state. Render
`BulkGoalDraftReview variant="full"` with the same draft state and callbacks.
Block creation when selected drafts are invalid.

- [ ] **Step 5: Run the focused review tests**

Run the same command from Step 2. Expected: PASS for full and coach review
behavior.

- [ ] **Step 6: Commit**

```bash
git add src/features/goals/bulk-goal-draft-review.tsx \
  src/features/goals/bulk-goal-draft-review.test.tsx \
  src/features/today/bulk-goal-form.tsx
git commit -m "refactor(goals): consolidate bulk draft editing"
```

### Task 5: Share bulk and coach persistence

**Files:**
- Create: `src/features/goals/bulk-goal-persistence.ts`
- Test: `src/features/goals/bulk-goal-persistence.test.ts`
- Modify: `src/features/today/bulk-goal-form.tsx`
- Modify: `src/features/planner/coach/coach-goal-draft-service.ts`
- Test: `src/features/planner/coach/coach-goal-draft-service.test.ts`
- Modify: `src/features/planner/coach/planner-coach-panel.tsx`
- Test: `src/features/planner/coach/planner-coach-panel.test.tsx`

**Interfaces:**
- Produces one persistence function that accepts selected drafts, the current
  user context, and a Supabase client, then creates rows and selected links.
- Returns created count or a typed actionable error.

- [ ] **Step 1: Add failing persistence tests**

Cover exact `create_goals` rows for period/lifetime/milestone drafts, selected
link rows, no-link behavior, no selected drafts, invalid drafts, RPC failure,
and successful created counts. Test that coach and full bulk callers use the
same row and link contract.

- [ ] **Step 2: Run focused persistence tests and confirm missing behavior**

Run:

```bash
pnpm vitest run \
  src/features/goals/bulk-goal-persistence.test.ts \
  src/features/planner/coach/coach-goal-draft-service.test.ts \
  src/features/planner/coach/planner-coach-panel.test.tsx
```

Expected: the shared persistence module is missing and coach link parity
assertions fail.

- [ ] **Step 3: Implement shared persistence**

Extract only the concrete duplicate `create_goals` and `create_goal_links`
orchestration needed by bulk and coach flows. Preserve existing photo upload
behavior only where an existing caller supplies a photo; the new streamlined
editor must not render photo controls.

- [ ] **Step 4: Provide coach linkable-goal context**

Pass the user-scoped active linkable goals into the shared review editor,
including an empty list. Ensure selecting a link in coach review is persisted
or rejected explicitly rather than silently discarded.

- [ ] **Step 5: Run focused persistence tests**

Run the same command from Step 2. Expected: PASS for shared bulk/coach
persistence and failure retention.

- [ ] **Step 6: Commit**

```bash
git add src/features/goals/bulk-goal-persistence.ts \
  src/features/goals/bulk-goal-persistence.test.ts \
  src/features/today/bulk-goal-form.tsx \
  src/features/planner/coach/coach-goal-draft-service.ts \
  src/features/planner/coach/coach-goal-draft-service.test.ts \
  src/features/planner/coach/planner-coach-panel.tsx \
  src/features/planner/coach/planner-coach-panel.test.tsx
git commit -m "fix(goals): share bulk and coach draft persistence"
```

### Task 6: Finish parser, seed, and compatibility coverage

**Files:**
- Modify: `src/app/api/bulk-goals/parse/route.ts`
- Test: `src/app/api/bulk-goals/parse/route.test.ts`
- Modify: `src/features/goals/starter-packs.ts`
- Test: `src/features/goals/starter-packs.test.ts`
- Modify: `src/features/today/bulk-goal-types.ts`
- Test: `supabase/tests/database/goal_target_count_limit.test.sql`
- Test: `supabase/tests/database/planner_write_boundary_period_move.test.sql`

**Interfaces:**
- All parser and starter-pack inputs resolve to the same draft target
  semantics.
- The superseded `BulkGoalDraft` type is removed only after confirming no
  imports remain.

- [ ] **Step 1: Add parser and starter-pack matrix cases**

Cover omitted target basis, explicit period/lifetime basis, empty recurring
targets, valid and over-limit weekly/monthly targets, milestone defaults, and
starter-pack rows with the exact target basis and target count.

- [ ] **Step 2: Run focused parser and starter-pack tests**

Run:

```bash
pnpm vitest run \
  src/app/api/bulk-goals/parse/route.test.ts \
  src/features/goals/starter-packs.test.ts
```

Expected: any stale expected labels, defaults, or payload shapes fail.

- [ ] **Step 3: Align parser and starter-pack normalization**

Ensure generated and starter-pack drafts enter the canonical model with
period defaults of `1`, required lifetime target errors, and fixed-milestone
defaults. Update CSV example text to document `target_basis` and the
period/lifetime meaning of `target_count`.

- [ ] **Step 4: Confirm database fixtures express explicit period targets**

Update only fixtures that create recurring period goals with omitted targets so
they explicitly use target `1` and period basis. Preserve the existing planner
move regression coverage.

- [ ] **Step 5: Run focused parser tests**

Run the same command from Step 2. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/bulk-goals/parse/route.ts \
  src/app/api/bulk-goals/parse/route.test.ts \
  src/features/goals/starter-packs.ts \
  src/features/goals/starter-packs.test.ts \
  src/features/today/bulk-goal-types.ts \
  supabase/tests/database/goal_target_count_limit.test.sql \
  supabase/tests/database/planner_write_boundary_period_move.test.sql
git commit -m "test(goals): cover bulk target input variants"
```

### Task 7: Add end-to-end bulk-flow regression coverage

**Files:**
- Create: `src/features/today/bulk-goal-form.test.tsx`
- Create: `src/features/today/goal-form.test.tsx`
- Modify: `src/features/goals/bulk-goal-draft-review.test.tsx`
- Modify: `src/features/planner/coach/use-planner-coach.test.tsx`
- Modify: `e2e/api.smoke.spec.ts`

**Interfaces:**
- Covers parse-to-review-to-create behavior without introducing a second
  persistence path.

- [ ] **Step 1: Add failing integration tests**

Cover:

- parsed drafts appear in the shared editor;
- users can change recurring period to lifetime and supply a target;
- users can change lifetime to period and receive target `1`;
- users can switch recurring to milestones and edit names;
- invalid selected drafts block creation;
- RPC failure leaves drafts intact;
- successful creation sends exact rows, creates links, invalidates caches, and
  exits;
- persisted single-goal edit keeps definition fields disabled;
- coach proposals render the same editor and preserve selected links.

- [ ] **Step 2: Run focused integration tests and confirm missing behavior**

Run:

```bash
pnpm vitest run \
  src/features/today/bulk-goal-form.test.tsx \
  src/features/today/goal-form.test.tsx \
  src/features/goals/bulk-goal-draft-review.test.tsx \
  src/features/planner/coach/use-planner-coach.test.tsx
```

Expected: the new full-flow assertions fail until the shells are wired to the
shared editor and persistence module.

- [ ] **Step 3: Implement the focused test harnesses and assertions**

Use existing Supabase/client mocks and navigation/cache mocks. Assert user
visible state and request payloads rather than implementation details.

- [ ] **Step 4: Add the API smoke assertion for target-basis preservation**

Extend the existing authenticated parse smoke coverage with an assertion that
the normalized response preserves explicit period and lifetime target basis.

- [ ] **Step 5: Run focused integration tests**

Run the same command from Step 2. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/today/bulk-goal-form.test.tsx \
  src/features/today/goal-form.test.tsx \
  src/features/goals/bulk-goal-draft-review.test.tsx \
  src/features/planner/coach/use-planner-coach.test.tsx \
  e2e/api.smoke.spec.ts
git commit -m "test(goals): cover bulk creation workflows"
```

### Task 8: Review, lint, typecheck, and publish the follow-up PR

**Files:**
- Modify: `docs/checklist-planner-cleanup-audit.md` to record the resolved
  bulk-editor duplication and semantic drift.

- [ ] **Step 1: Run changed-file lint diagnostics**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm vitest run \
  src/features/goals/goal-creation-model.test.ts \
  src/features/goals/goal-creation-fields.test.tsx \
  src/features/goals/bulk-goal-drafts.test.ts \
  src/features/goals/bulk-goal-draft-review.test.tsx \
  src/features/goals/bulk-goal-persistence.test.ts \
  src/features/today/bulk-goal-form.test.tsx \
  src/features/planner/coach/coach-goal-draft-service.test.ts
```

Expected: all changed TypeScript paths are lint-clean, type-safe, and covered
by the focused feature suites.

- [ ] **Step 2: Run database coverage**

Run:

```bash
pnpm test:sql
```

Expected: pgTAP fixtures pass, including normalized period target and planner
move coverage.

- [ ] **Step 3: Run the final diff review**

Use:

```bash
git diff --check
git diff --stat "$(git merge-base HEAD origin/fix/planner-move-lifetime-target-cap)" HEAD
git status --short --branch
```

Confirm no generated secrets, obsolete duplicate editor, accidental planner
behavior changes, or unrelated cleanup are included.

- [ ] **Step 4: Record the completed consolidation in the cleanup audit**

```bash
git add docs/checklist-planner-cleanup-audit.md
git commit -m "docs: record bulk editor consolidation"
```

Update the audit’s bulk-editor duplication and semantic-drift entries to
identify the shared creation-fields component and canonical review shell as
the new homes.

- [ ] **Step 5: Push the follow-up branch**

```bash
git push -u origin feat/bulk-goal-create-editor
```

- [ ] **Step 6: Open the follow-up pull request**

Create a PR targeting `fix/planner-move-lifetime-target-cap` with:

```markdown
## Summary
- Consolidate bulk and coach draft editing around the streamlined single-goal create fields.
- Make target basis, cadence, and target counts editable before persistence with canonical validation.
- Add exhaustive transition, UI, payload, persistence, and failure-path regression coverage.

## Test plan
- [ ] Recurring daily/weekly/monthly period targets
- [ ] Recurring lifetime targets
- [ ] Fixed milestones and milestone-name resizing
- [ ] Type, cadence, target-basis, date, category, link, and metadata edits
- [ ] Invalid selected drafts and RPC failure retention
- [ ] Bulk and coach parity
- [ ] Persisted-goal edit immutability
- [ ] SQL and focused Vitest suites
```
