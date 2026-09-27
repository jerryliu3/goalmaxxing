# Everyday interface study

Route: `/ux/interface-craft`, linked from `/ux`. The existing UX layout provides
moderator access control and no-index metadata. This is an isolated study, not a
production redesign.

## Round 02: planner interaction models

Feedback on the first round: Contour, Typeset, and Signal mainly changed styling
around the same planner controls. That did not supply distinct UX alternatives.
The planner now compares four interaction models with one consistent visual
language. It reuses the same calendar, sessions, search/filter semantics, and
completion state so the differences are workflow rather than color.

| Model | Entry point and behavior | Tradeoff |
| --- | --- | --- |
| Direct toolbar | View, category, goal, and search always visible; each change applies immediately | Most discoverable and quickest for repeated adjustments; persistent chrome |
| Canvas navigation | Click a date to zoom into a day; use the breadcrumb to zoom out; select a session to reveal completion/day actions in a bottom dock; filters are disclosed on demand | Content leads; selection and zoom add steps |
| Goal navigator | Select an intention in a collapsible sidebar and see its sessions on the calendar; cadence and placed-session count stay beside the goal | Strong goal-to-calendar relationship; uses width and scopes other work away |
| View composer | Read the current scope as a sentence; open a modal, stage several settings, Apply view or Cancel | Quiet resting state and atomic changes; extra steps for every adjustment |

The direct toolbar is the reference workflow, not the declared winner. Each
concept has a short task above it to make the difference immediately testable.

- Compare shows four panes in two columns on wide screens and one column on small
  screens. All applied state is shared. Local navigator visibility, selected work,
  and unapplied composer changes belong to their example.
- Narrow constrains each preview to at most 390px. The sidebar becomes a goal list
  above the calendar, and canvas filters expand in flow to avoid a clipped popover.
- The calendar supports month → date → day navigation in every model. Canvas
  navigation specifically replaces the view switch with zoom breadcrumbs and
  replaces immediate completion with selection plus a contextual action.
- Planner focus date and selected goal are independent of the history inspector
  and goal-detail example selection. Goal filtering never changes summary totals.
- Compose changes contain only view, category, goal scope, and search. Cancel,
  Escape, or outside dismissal discards the staged changes. Applying a view never
  overwrites completions. Reopening starts from the current applied view.
- Clear scope is visible whenever a category, goal, or search limits the canvas.
  Collapsing the navigator retains scope and leaves its description visible.
- Reset sample restores shared data and remounts planner examples to clear local
  interaction state. Preference selections remain intact for the current visit.

## Goal-details placement clarification

The first-round goal examples were intended for **goal card → open goal → goal
detail content**, showing how title, cadence, deadline, and progress might read
inside an opened goal. They were not a proposal for another planner destination
or permanent planner panel. The sample goal picker is a study control only.

The study now states this placement above the examples. Whether those details
belong inside the existing detail sheet or expanded card is undecided. No new
placement or additional goal-detail concept is implemented in this revision.

## Retained first-round comparisons

Completion history and progress summaries are unchanged in round 02.

| Surface | Contour | Typeset | Signal |
| --- | --- | --- | --- |
| History | Continuous color mosaic, rounded outer silhouette, day inspector | Ruled calendar with explicit completion counts and editorial day detail | Wide meter cells, darker intensity scale, horizontal day readout |
| Goal metadata and detail | Conversational metadata inside a soft goal object | Label/value rules and large editorial title | Labeled instrument strip and numeric progress |
| Progress summaries | Completion ring and a short reading of progress | Large statement and tally marks | Percentage readout and segmented meter |

History shows August and September with touching cells and read-only inspection.
Future dates are inspectable and identified as still ahead. Goal details expand
inline and allow a sample session completion. Summaries have week/month periods
and an expandable breakdown. Those interactions update the shared sample data.
The sample clock is September 27, 2026; the sample schedule is September 21–27.

## Implementation boundaries and coverage

All example state and styling live in `src/features/ux-interface-craft`; the route
is a server entry with a client shell. Existing Dialog primitives provide focus
management, Escape, and dismissal for the composer. No production mutations,
feature flags, database changes, or planner components are involved.

Focused functional coverage now tests the actual UX differences: immediate
filtering, canvas zoom and selection-before-completion, goal scope retained while
collapsed, composer cancellation and explicit apply, shared state across four
models, reset of local state, preferences, and history/summary consistency.
Obsolete tests for three styled planners were replaced. Existing history and
summary journey coverage remains.

Tests, typecheck, lint, CI, and browser verification are not run without explicit
approval, per repository instructions. Visual quality remains unverified in a
browser.
