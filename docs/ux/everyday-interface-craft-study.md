# Everyday interface: Contour, Typeset, Signal

Route: `/ux/interface-craft`, linked from `/ux`. The existing UX layout provides
moderator access control and no-index metadata. This is a fresh visual exploration
requested independently of previous studies and product design locks.

## What to compare

Three concepts cover four surfaces (12 combinations):

| Surface | Contour | Typeset | Signal |
| --- | --- | --- | --- |
| Planner | Recessed view rail, tinted filter capsules, soft work tiles | Underlined view labels, ruled toolbar, open work rows | Side control panel on wide screens, square state controls, compact work tiles |
| History | Continuous color mosaic, rounded outer silhouette, day inspector | Ruled calendar with explicit completion counts and editorial day detail | Wide meter cells, darker intensity scale, horizontal day readout |
| Goal metadata and detail | Conversational metadata inside a soft goal object | Label/value rules and large editorial title | Labeled instrument strip and numeric progress |
| Progress summaries | Completion ring and a short reading of progress | Large statement and physical tally marks | Percentage readout and segmented meter |

Contour trades space for approachability. Typeset trades obvious containers for
quiet hierarchy. Signal trades softness for precision and high contrast. No
concept is preselected as the product winner.

## Interactive review

- Choose a surface and direction, or compare all three. At smaller viewport widths,
  comparison panes stack. Narrow constrains each example to at most 390px; CSS
  container queries recompose the actual controls within that width.
- Every concept shares the same sample state. Switching directions retains search,
  filters, view, completion edits, inspected date, selected goal, and summary period.
- Planner supports category/search filtering, Day/Week/Month views, and reversible
  sample completions. The Day view focuses Wednesday September 23 within the sample
  week September 21–27. The sample clock is September 27, 2026.
- History shows August and September. Cells touch with shared hairline divisions;
  no inter-cell gaps or individually rounded frames. Click a day to inspect it.
  Future dates remain inspectable and clearly show that they are still ahead.
- Goal details expand inline. Marking the next sample session complete updates the
  planner, history, goal progress, and summaries. No network mutations occur.
- Summary periods change the totals and denominator; the breakdown is expandable.
- Prefer this records a separate choice for each surface for the current visit.
  Reset sample restores interaction data while retaining those choices.

## Implementation boundaries

All new styling and sample logic live in `src/features/ux-interface-craft`.
The route is a server entry with a client interaction shell. No production controls,
API routes, database state, feature flags, or application navigation are changed.
The only existing file changed is the UX lab index, to make the study discoverable.

Native buttons expose selected/expanded states, search has a label, progress has
numeric semantics, and history selection works without hover. Reduced-motion and
forced-colors treatments are included. This study does not prototype dragging or
production completion-hold behavior; planner tile clicks are sample-only toggles.

Functional coverage is written for all three planner concepts, shared comparison
state, history inspection/month boundaries, goal-to-summary updates, reset, and
per-surface preferences. Pure model coverage checks calendar alignment and total
consistency. Tests, typecheck, lint, CI, and browser verification were not run,
per repository instructions. Visual quality remains unverified in a browser.
