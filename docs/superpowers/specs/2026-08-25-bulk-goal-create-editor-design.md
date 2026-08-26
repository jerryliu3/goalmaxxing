# Bulk Goal Create Editor Design

**Date:** 2026-08-25  
**Status:** Approved

## Goal

Replace the duplicated bulk-draft editors with one create-mode editor that
matches the streamlined single-goal creation form. Unsaved bulk and planner
coach drafts must expose the same editable goal-definition controls as goal
creation, while persisted-goal edit mode continues to enforce immutable
definition fields.

## Product decisions

- Bulk and planner-coach drafts use the same create-mode editor.
- The editor matches the visible single-goal create form rather than exposing
  the old bulk-only photo and metadata controls.
- Goal type, recurrence interval, target basis, target count, dates, category,
  default time, difficulty, privacy, links, and milestone names are editable
  before persistence wherever they are visible in the single-goal create form.
- Persisted-goal edit mode keeps goal type, cadence, target basis, target count,
  and start date disabled.
- Recurring period goals use a target of `1` by default. Weekly targets are
  limited to `1..7`; monthly targets are limited to `1..31`; daily period
  goals persist a target of `1`.
- An explicitly lifetime-based recurring goal requires a positive total target.
  The label is `Total target completions`, without optional wording.
- Fixed-milestone goals always use lifetime semantics, require a positive
  milestone count, and keep milestone names synchronized with that count.
- Parser-created descriptions and other existing persistence fields are
  preserved by the draft/persistence contract, but the editor does not
  introduce controls that are absent from the streamlined single-goal form.

## Architecture

### Shared creation fields

Create a focused presentational component under `src/features/goals` for the
fields shared by single-goal creation, bulk draft review, and coach draft
review. It receives a normalized creation-fields value, field update
callbacks, available link targets, validation state, and an explicit
`definitionFieldsLocked` flag. It may render planner-task options only when the
single-goal surface requests them.

The shared creation-fields value contains the creation data fields:

- title and category selection/custom category
- color and description values already supported by the data model
- frequency type and recurrence interval
- target basis, target count, and milestone names
- start and end dates
- default local time
- difficulty, privacy, and linked target

The component owns presentation and field-level transitions only. It does not
load persisted goals, call Supabase, upload files, or decide whether a draft
may be created.

### Single-goal form

`src/features/today/goal-form.tsx` retains loading, persisted-goal hydration,
capacity lookup, RPC orchestration, and edit-mode locking. It consumes the
shared creation-fields component in both create and edit modes. Its existing
planner-task-specific controls remain outside the shared goal editor.

### Bulk and coach review

Create one canonical draft editor used by
`src/features/goals/bulk-goal-draft-review.tsx`. The review shell retains list
selection, removal, summary badges, warnings, and create guards. The current
inline editor in `src/features/today/bulk-goal-form.tsx` is removed; the page
renders the shared review shell.

Both full bulk creation and planner-coach proposals use the same create-mode
editor. The planner-coach model supplies its user-scoped linkable-goal list to
the editor, including an empty list when no linkable goals exist, and its
create path uses the same draft persistence contract so an editable link is
never silently discarded.

### Shared draft transitions and persistence

Keep `BulkGoalDraft` as the draft envelope for row identity, inclusion,
validation errors, and parser metadata. Move reusable creation-field defaults,
transitions, and normalization into pure helpers that can be consumed by both
the single-goal form and bulk/coach editors.

The transition rules are:

1. Recurring + period:
   - daily hides the numeric period field and normalizes its persisted target to
     `1`;
   - weekly and monthly show the period field, default it to `1`, and validate
     their upper bounds.
2. Recurring + lifetime shows `Total target completions` and requires a
   positive value.
3. Switching recurring to fixed milestones forces lifetime basis, defaults an
   empty count to `3`, and resizes milestone names.
4. Switching fixed milestones to recurring restores recurring defaults and
   clears milestone-only values from the prepared row.
5. Switching target basis keeps a valid existing count; otherwise it defaults
   to `1` for period or `3` for lifetime.
6. Every field update revalidates the affected draft. Selected invalid drafts
   disable creation; unselected invalid drafts remain visible and editable.

`prepareBulkGoalRows` remains the canonical row-shaping boundary. Bulk and
coach creation share the RPC/link orchestration so the editor and persistence
contract cannot diverge.

## Validation and errors

Use the shared goal-definition validation rules for all creation surfaces.
Period upper bounds are enforced independently of profile-capacity warnings so
bulk creation cannot submit a weekly target above `7` or monthly target above
`31` only to receive a database error later.

Validation errors remain attached to each draft and are rendered in the review
shell. RPC failures preserve the drafts, clear the saving state, and show the
existing actionable error. Successful creation invalidates planner-related
caches and exits through the existing completion path.

## Files expected to change

- `src/features/goals/goal-creation-fields.tsx` — shared create-mode field
  presentation.
- `src/features/goals/goal-creation-fields.test.tsx` — shared field rendering
  and interaction coverage.
- `src/features/goals/goal-creation-model.ts` — shared defaults, transitions,
  and field normalization.
- `src/features/goals/goal-creation-model.test.ts` — transition matrix.
- `src/features/goals/bulk-goal-drafts.ts` — shared validation/defaults and row
  preparation alignment.
- `src/features/goals/bulk-goal-drafts.test.ts` — exhaustive draft and payload
  matrix.
- `src/features/goals/bulk-goal-draft-review.tsx` — consume the canonical
  editor and remove obsolete variant-specific controls.
- `src/features/goals/bulk-goal-draft-review.test.tsx` — bulk/coach parity and
  create guards.
- `src/features/today/bulk-goal-form.tsx` — remove the duplicate inline editor
  and delegate to the shared review shell.
- `src/features/today/bulk-goal-form.test.tsx` — parse-to-review-to-create
  behavior and RPC failure retention.
- `src/features/today/goal-form.tsx` — consume shared fields while preserving
  persisted edit locking and single-goal orchestration.
- `src/features/today/goal-form.test.tsx` — create/edit lock and payload
  behavior where a focused regression is needed.
- `src/features/planner/coach/coach-goal-draft-service.ts` — use shared draft
  persistence for links and create payloads.
- `src/features/planner/coach/coach-goal-draft-service.test.ts` — coach parity
  and persistence failures.
- `src/features/planner/coach/planner-coach-panel.tsx` and its tests — provide
  linkable-goal context and shared editor behavior.
- `src/lib/goals/definition-validation.ts` and tests — enforce period bounds
  independently from optional capacity warnings.
- `src/features/today/bulk-goal-types.ts` — remove the superseded draft type if
  no callers remain.

## Test strategy

“100% coverage” means complete coverage of the defined feature contract and
all changed branches, not a misleading claim that the entire repository has
100% line coverage.

### Pure model and validation matrix

Cover every combination of:

- recurring versus fixed milestones
- daily, weekly, and monthly recurrence
- period versus lifetime target basis
- empty, zero, negative, fractional, valid, maximum, and over-limit targets
- empty, valid, invalid, reversed, and over-horizon date ranges
- preset versus custom categories
- valid and invalid colors and local times
- milestone counts below, equal to, and above the names array length
- selected versus unselected invalid drafts

Assert both draft errors and exact prepared `create_goals` rows.

### Component interactions

Cover:

- create-mode fields are enabled;
- persisted edit mode disables definition fields;
- type, cadence, and target-basis transitions update labels, defaults, and
  milestone names;
- period and lifetime target controls render the correct labels and limits;
- date, category, custom category, default-time, difficulty, privacy, link, and
  milestone controls update draft state;
- old photo and bulk-only advanced controls are absent;
- selected invalid drafts disable create while unselected invalid drafts do not;
- removal, inclusion toggles, dialog open/close, empty state, warnings, and
  external create guards behave consistently in bulk and coach variants.

### Persistence and integration

Cover CSV/XLSX/starter-pack/LLM parsing, bulk and coach create payloads,
link persistence, RPC failures, draft retention, cache invalidation, and
successful exit behavior. Add focused database coverage for the normalized
period/lifetime row contract where existing pgTAP coverage does not already
exercise it.

## Non-goals

- Reworking planner/checklist completion semantics.
- Changing persisted-goal versioning or making immutable definitions editable
  after creation.
- Adding photo or reward-text controls back to the streamlined create UI.
- Broad cleanup unrelated to the shared goal creation and bulk/coach draft
  workflow.
