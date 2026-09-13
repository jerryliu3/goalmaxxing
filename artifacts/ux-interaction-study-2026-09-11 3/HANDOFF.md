# Goalmaxxing interaction studies — coding-agent handoff

Status: exploratory prototypes, not production changes or a new design lock.
User preference: Anchor zoom and Time ribbon from the original round. Week must be vertical (stacked day rows, as in production), especially on mobile. Goal experiences must be interactive, not descriptions only.

## Open and share

Open `goalmaxxing-interaction-studies.html` in a modern browser. It is self-contained, works offline, and requires no server, dependencies, account, or build. The three study switches expose the original calendar, new vertical calendar, and four goal experiences. Send this HTML alone to share the working demo; send the ZIP to include editable sources and this handoff. No public URL has been created.

State is local to the page and resets on reload. There is no real user data, persistence, upload, API call, or production mutation. Notes saved in the Evidence studio are demonstration data only. The source fragments retain guarded optional Codex Tweak controls; those controls are unnecessary outside Codex.

## Files

- `source/calendar-transformations.html`: original four concepts (Anchor zoom, Accordion, Focus lens, Time ribbon), preserved for comparison.
- `source/vertical-calendar.html`: new Anchor cascade and Vertical ribbon with vertical week rows.
- `source/goal-experiences.html`: all four goal interaction models, including individual-goal and all-goal states.
- `source/study-navigation.html`: portable collection navigation.
- `source/combined-study.html`: assembled fragment used by the exporter.
- `goalmaxxing-interaction-studies.html`: portable browser-ready export, including inline styles/scripts.

Edit source fragments first and reassemble/re-export; the large exported wrapper is not the ideal production implementation source.

## Calendar variants

Shared state is selected date + month/week/day depth. The range control reveals intermediate geometry and snaps to a view when released. Month date click focuses its vertical week; a week row click enters that day. The view controls provide direct, keyboard-accessible navigation. Day supports an up/down swipe and previous/next date buttons. This prototype uses September 2026 and bounds selection to September 1–30.

### Anchor cascade

Month tiles become full-width stacked day rows. The selected tile widens early; sibling dates travel in shallow lateral arcs into chronological vertical order. Week to day expands the selected row while earlier/later rows move out above/below it. Reverse reconstructs the week and then the month. The selected date remains highlighted, and text stays upright.

Evaluate whether the selected date's trajectory feels continuous, especially for dates other than the centered Thursday seed. The current prototype preserves identity but does not mathematically pin the selected date's label to the exact same screen coordinate for every date. A stronger production candidate should preserve the selected row's viewport position using scroll anchoring, rather than moving the user to a fixed top edge.

### Vertical ribbon

Month first gathers dates onto a narrow vertical spine in chronological order; that spine widens into week rows. Week to day stretches the interval around the selected date on the same vertical axis. The 48% midpoint of month-to-week is the narrow spine. This is the continuity-first alternative to the cascade's spatial reflow.

Evaluate whether the gather phase is too narrow or long. The prototype has a duration adjustment in Codex (default 720 ms for inspection); production timing should be tuned for frequent use, approximately 300–500 ms initially, without imposing an uninterruptible sequence.

### Production requirements to retain

- Day shows placed work; it is not the full Checklist. Month/week pills do not become completion controls by accident.
- Use persistent date/item identity through transitions. Avoid remounting the entire calendar and substituting a fade.
- The prototype moves day containers and reveals example content. Actual individual placed-item pills do not yet independently morph into completion rows; prototype that shared-item continuity before claiming the animation is finished.
- View changes, selection changes, interrupted/reversed motion, navigation history, week/month boundaries, today highlighting, and variable item density must retain canonical selected-date state.
- Production vertical week should scroll naturally with variable-height rows. The demo fits seven equal-height rows into a 490px study area; that is an inspection fixture, not the production layout requirement.
- Reduced motion produces the final state directly. Keep visible view controls and date buttons as alternatives to gestures; pinch-to-zoom and wheel-driven scale are not implemented.
- Honor draft vs saved plan, undo, ownership, Duo read-only partner lanes, and canonical completion/cascade semantics.

Relevant existing integration surfaces to inspect: `src/features/planner/planner-calendar-board.tsx`, `src/features/planner/plan-view-transition-frame.tsx`, `src/features/planner/calendar-surface.types.ts`, and `docs/motion_system.md`. Read the installed Next.js documentation before writing any Next.js code, as required by AGENTS.md.

## Goal experiences

All four use the same sample goals and completion facts. Move regularly derives a deduplicated union of sessions from the sample linked goals Tempo run and Strength. The fixture demonstrates presentation of links; it is not a replacement for the production linked-goal kernel.

### Living folio — open

All goals are personal volumes with actual per-period session marks. Select a cover to open its individual page (why, monthly progress, next milestone, recent sessions). Log or undo today's session to see the volume acquire/remove a mark. Return to the collection. Covers animate into the opened folio; note that the current bounded transition scales text briefly, so production should isolate shared title/mark elements if that is distracting.

Production entry proposal: tapping the title/body of a checklist goal opens the folio. The checkbox still completes, and Edit becomes a secondary action in the detail. This is proposed routing/behavior, not implemented by the demo. Existing `src/features/today/goal-card.tsx` links to `/goals/[id]`, whose current purpose is goal editing.

### Rhythm weave — scrub

All goals align as completion strands across September 4–17. Scrub one date across all strands; select a strand for a single-goal view. Log/remove a session at the inspected date. Empty space means no logged completion, not failure. Counts are monthly targets, not arbitrary lifetime goal percentages. The parent strand reflects linked sessions.

Evaluate this as a temporal exploration of Progress Atlas/Pins, not a silent replacement for that study lock. Recurring sessions and finite milestones need distinct truthful representations.

### Goal constellation — trace

Stable goal positions, with explicit sample links from Tempo run and Strength to Move regularly. Select a node, follow its link, inspect incoming goals, or log a child session to see counts change in both nodes. Independent goals remain unconnected. The prototype does not support panning/dragging, creating relationships, or an animated pulse along an edge.

Avoid inferred links and force-directed layouts that move unpredictably. Production must use real relationships and canonical linked completion semantics.

### Evidence studio — collect

Browse evidence across all goals; open a piece to inspect its dated note; filter to a single goal. Add a note locally and see it join that goal's collection. Adding evidence does not manufacture a completion. Includes a meaningful empty state for a goal without evidence.

Rich photo/file capture, durable notes, editing/deletion, upload/privacy rules, and sync are not implemented. These require an explicit product/data-model decision. This ongoing-work collection should complement existing Achievements rather than duplicate attained awards.

## Design and verification scope

Gazetteer-inspired paper/ink/green, theme-aware light/dark, upright typography, restrained motion. These are interaction studies, not production AppShell changes. No new product destination, persistence layer, dependency, migration, route, or production source was added.

Validation: browser-driven offline export checks at 320px, 360px, and 736px content widths in light and dark themes; both vertical calendar transitions; all four goal overview/detail journeys; log/undo; linked-goal navigation; evidence capture; interrupted motion; reduced motion; no runtime errors or horizontal root overflow. See the accompanying validation notes for any limitations.

## Prompt to give a coding agent

Read this HANDOFF.md and open goalmaxxing-interaction-studies.html. Start from the editable fragments in source/. The user prefers Anchor zoom and Time ribbon, with a vertical week. Compare Anchor cascade and Vertical ribbon before selecting a production approach. Keep the four goal experiences available as independent explorations; do not collapse them into visual skins for the same interaction. If integrating into Goalmaxxing, follow AGENTS.md and the current UX guides, reuse canonical planner/goal/completion models, and build an isolated /ux study first. Preserve selected-date identity, vertical week usability, reduced motion, and linked-goal semantics. Do not ship production routing, schema, or design-lock changes without an explicit implementation decision. Call out differences between demonstrated behavior and the production requirements listed above.

## Round 3 — item continuity (latest, default study)

Open the **Item continuity** section. Editable source: `source/calendar-item-continuity.html`. The earlier vertical study is retained for comparison; its limitations about disappearing/reappearing items do not describe this new version.

Each scheduled occurrence now has one persistent item element and one persistent title element across month, vertical week, and day. Keys are occurrence-specific (date + fixture slot), not just goal IDs. Date surfaces and items are independent layers, so expanding/clipping a date container cannot erase its label. Nonfocused dates/items exit naturally beyond the viewport.

- Anchor: named pills follow continuous paths into vertically stacked week rows. Their width grows to reveal previously truncated text.
- Ribbon: dates gather to a narrow spine, but the accompanying item tickets retain their own width. Text is never squeezed into the date spine. Then the week surface widens around them.
- Week → Day: the same items expand into 76px checklist rows. The same title moves right to make room for a completion button. Pill fill recedes to paper; a row separator and duration metadata emerge. Only new metadata fades in; the item/title never fades or swaps.
- The reverse shrinks the same title and row back into the same pill. Completion state stays attached to the occurrence across view changes.
- Optional Codex Tweak controls compare plain checklist vs retained tint and change inspection duration. Plain checklist is the default; a production day redesign is not necessary for this approach.

Test with September 17 (Tempo run and Reading). Scrub through the transition, including halfway positions; use both concept options. Month labels use ordinary ellipsis on narrow mobile cells. Full untruncated labels cannot fit seven columns at mobile widths without changing density/height; preserve the label node and reveal its remaining text as space grows.

Two items per day, equal-height week rows, one month, simple occurrence fixtures. High density/overflow items, long wrapped day labels, scroll anchoring, and real production composition remain to validate. Previous/next date buttons in this focused prototype retarget the date directly; their independent date-to-date animation is not the motion being studied. Goal title opening in Day is not wired; the native checkbox demonstrates completion/undo. Goal experience prototypes are preserved from round 2.

Production recommendation: share visual identity and geometry by occurrence ID between existing render surfaces; do not create a second completion model. A temporary presentation layer may carry the visible title through the route/layout change, then hand control to the canonical day-row component with matching bounds. Measure actual rendered item rectangles, preserve focus, make rapid view changes interruptible, and retain reduced motion. The prototype's frame-by-frame layout arithmetic is for motion inspection, not a directive to animate dozens of production layout properties every frame.
