# Goal View code study

Route: `/ux/goal-view`. Uses the existing moderator-only UX lab gate.
Exploratory, not a product lock or a production calendar cutover.

Time Weave comparison: `/ux/goal-view/time-weave`, with **Week / Goal View**
placement controls. Time Weave also appears beside Card Rails and Goal Desk at
`/ux/goal-view`. Both placements remain exploratory.

## Goal View directions

**Card Rails** puts the real material goal card beside a horizontal track of
scheduled dates on desktop. Phone arrangement is configurable: swipeable goal
cards with the selected goal's dates underneath, or a vertical list of goals
with dates as compact rows. Swiping belongs to the carousel; cards inside it
are still, so card rotation cannot steal the navigation gesture. Desktop cards
retain their production rotation interaction.

**Goal Desk** has a goal navigator and a focused workspace. Dates are vertical
rows grouped by week or month. Desktop recomposes into goal navigation, the
material card, and dates; the narrow version uses a horizontal goal navigator
and places the card above the dates.

All directions use the same draft and completion state. Switching directions, phone
arrangement, filters or grouping preserves that state. Phone preview uses
container sizing, so it also reflects the actual responsive layout.

## Product styling and metadata

Production `TempoGoalCard`, `goalCardFields`, Gazetteer palette and Nest mark;
Newsreader titles, Source Sans 3 content, IBM Plex Mono date headings, Geist
study chrome. The card carries category, difficulty/material, privacy, cadence,
target, dates and default time. Its companion progress belongs to the actual
cadence period or lifetime milestone count. Sessions include date, time,
milestone number/name, lock, draft and completion state. No fabricated lifetime
percentage for an ongoing goal.

## Interactions to compare

- Tap a scheduled date to edit date/time in the shared accessible dialog.
  One-day nudge buttons make common moves a single click. Apply closes the
  editor; Save plan commits the local draft; Undo changes restores its saved
  dates. Completed dates cannot move until their completion is undone.
- Goal filter supports any subset; search narrows that selection. Goal Desk
  navigation and phone card controls select within the filtered set. Upcoming,
  All dates and Past dates scopes retain week/month context.
- Complete a current or past saved session with the separate Nest control.
  Eligibility comes from `resolveChecklistCompletionIntent`. Future creation
  is disabled, draft placements require Save first, and undo removes the exact
  dated fact. Date draft undo does not undo recorded completions.
- Date editing checks goal bounds, one session per goal per day, saved-window
  bounds, locks, valid dates/times and ordered milestones. These are local
  study guards, not another production planner write path.
- See week opens a calendar overview sorted by time, connecting the selected
  date to sessions from other goals. Selecting a session opens the same editor.

## Long and ongoing plans

Five realistic seeded goals include 30 named milestones and an ongoing daily
practice with over 100 saved future dates. Initially show 12 sessions per goal;
More dates reveals another 12. Labels distinguish the goal's end date from the
last saved scheduled date. Ongoing does not imply infinitely generated saved
sessions. The sample plan ends January 31, 2027, while the goal may continue.

The study uses local React state, a fixed October 2, 2026 clock, and no API or
database writes. Reload resets it. It does not simulate planner regeneration,
linked-goal credit cascades, network conflicts, or reward ceremonies. Production
would wire the owning planner commands and canonical completion execution.

## Review

Suggested path: nudge Find your pace; switch to Goal Desk and Save; log today's
session; inspect Past dates and complete Wednesday's unlogged strength session;
filter to Portfolio and load later milestones; filter to Japanese and group by
month; compare both phone arrangements; inspect the locked race date.

Functional coverage is written in `model.test.ts` for save/undo, completion
eligibility, date/order guards, extended schedules and period progress. No
tests, typecheck, lint, build, browser checks or CI were run, per repository
workflow. Visual and interaction performance still require approved review.

## Time Weave placement comparison

The Week / Goal View lab switch shares one sample reducer, date-navigation
state, goal filter and density setting. Move a session in Week, switch to Goal
View before saving, then return: the same date draft and recorded completions
remain. This is a comparison tool, not a new production navigation preference.

**Week placement** answers “How do these goals fit into this week?” Date range,
previous/next week and Today lead. Goal labels can focus one lane, and the
production vertical agenda is an in-place alternative.

**Goal View placement** answers “How is this goal scheduled over time?” A
selected goal's real material card, period/lifetime progress, end date or
ongoing status, next session and last saved scheduled date anchor the timeline.
Select another goal row without filtering out its neighbors or moving the date
axis. Desktop puts the goal object beside the board; phone puts a compact card
and facts above it. Scopes include Upcoming, All dates and Past dates, and
ongoing dates remain bounded by the saved plan. Next session and Saved through
are one-click jumps; date navigation advances four weeks instead of requiring
repeated weekly navigation. Every week boundary remains labeled on the axis.

The full Goal View lab retains its multi-goal filter and search across Card
Rails, Goal Desk and Time Weave. Week/month grouping belongs to Rails and Desk;
Weave uses its shared civil-date axis. The “See week” dialog now uses the same
production vertical agenda as the Week comparison.

Placement remains open. Week gives the clearest weekly balancing workflow;
Goal View gives better context for long milestone sequences and ongoing
practices. Compare the same move in both, then browse the 30-step Portfolio and
the ongoing Japanese practice on phone before choosing a product default.

### Week configuration behavior

Calendar / Time Weave is an in-place Week layout setting. Both show the same
local plan and retain draft edits, completions, goal focus and selected day.
The Calendar alternative uses the production `CalendarMonthDayCell` in agenda
mode: seven days stacked vertically, the same goal pills, completion controls,
and planner drag provider. A local projection adapts the sample plan to this
surface without adding another production mutation path.

There is no always-visible Today/checklist section. Date headers open a
**Day in context** inspector, ordered by time within the visible goal filter.
Session pills expose completion directly through the same study eligibility
and dispatch as Card Rails. Clicking a pill opens date/time editing; dragging
uses its separate handle. The Week agenda retains its production hold-to-log
interaction. The inspector appears only after an explicit date selection.

The Weave uses one horizontally scrollable date canvas, from September 29,
2025 to October 1, 2028. Goal labels stay fixed at the left and date labels
stay above their rows. Scroll with native trackpad/touch momentum, arrow-key
focus on the region, or the scrollbar; navigate by week, Today or a date jump.
Goal labels also toggle focus. Roomy / Compact changes day width while keeping
the leading date and fractional-day offset.

Rows use category-tinted session pills with no decorative connecting thread.
Sharing a date or category does not imply a dependency. A future linked-goal
affordance should reflect an actual source/target goal link and its completion
credit semantics; this sample does not invent relationships or draw connectors.
Drag handles use the existing planner sensors, collision
logic, draggable entries and day targets. A column represents a date, so a
drag changes the original goal's date regardless of which row it crosses.
Handles also support Space, Left/Right and Escape. The shared editor remains
the direct date/time alternative. Locked and completed sessions do not drag.
Invalid moves retain their original date and announce the local guard error.

### Scrolling and animation choices

The implemented transition candidate is a calm dissolve. Two further motion
directions are scoped here, rather than implemented as extra configurations:

| Candidate | Behavior | Tradeoff |
| --- | --- | --- |
| Calm dissolve (implemented) | Preserve the week and date anchor; fade between goal rows and vertical day rows in a reserved canvas. | Least visual noise; session identity is carried by labels and state rather than traveling pixels. |
| Follow one session | Keep the selected session visible in the vertical agenda and move only that session into its goal lane; dissolve surrounding structure. Measure only the visible week. | More continuity, but needs a focused session and scroll/clip coordination with the production morph. |
| Vertical Weave | Keep dates running downward like Week, and put goals in columns. Scroll dates vertically. | Easiest orientation continuity for Week; horizontal goal browsing is less comfortable on phone. |

Do not morph the entire multi-year canvas or imply dependencies through motion.
If a traveling-session version is pursued, prototype interrupted transitions,
offscreen destinations and reduced motion before making it the product default.

- Stable geometry: every civil day has the same width, including empty dates.
  Scroll is native; there is no scroll-linked spring or mandatory snapping.
- A viewport window with eight days of overscan mounts date headers, date drop
  targets and only nearby session pills. Simple CSS lines supply the grid;
  the three-year range is not three years of DOM cells.
- Passive scroll listeners schedule at most one range update per animation
  frame; React state changes only when the day window changes. Density keeps
  the date anchor. Motion's scroll-aware measurement prevents date moves from
  treating a scrolled viewport as a layout displacement.
- Week agenda/Weave changes use a brief 120 ms exit and 120 ms entrance, with a
  reserved canvas height. The week containing the leading scroll date becomes
  the vertical agenda; switching back starts at that date. Filters, date drafts
  and completion facts stay in one local state. The orientation itself is not
  rotated: this is the calm transition candidate, avoiding distant sessions
  flying diagonally across the interface. Reduced motion switches immediately.
- A moved pill changes position over 180 ms. Large material cards are absent
  from the scrolling board. Rendering/virtualization remains unchanged while
  the user scrolls; no transition drives native scrolling.

This tests a large finite range rather than pretending it is infinite. An
eventual production version could extend date windows as the user approaches
an edge, preserving a date anchor; that would need data fetching and scroll
performance review. The sample's saved dates still stop in January 2027. Empty
future space never manufactures scheduled recurrences.

Each lab route owns its local sample state; navigation between routes resets
the sample, while layout and placement switches inside a route preserve edits.
Axis coverage in `weave-axis.test.ts` includes distant dates,
leap day, render-window bounds and density anchors. `weave-model.test.ts` covers
month/year week boundaries, the same draft in both orientations, and filtered
day ordering. `weave-study.test.tsx` covers draft/completion continuity through
Week orientation and placement changes, and preservation of a distant date
anchor. Expensive material and drag leaves are substituted; the composition,
navigation and reducer are real. New coverage was written but not run. No performance claim has
been verified in a browser.

## In the product

Goal View ships as the first option in the Plan view switch (Goal View / Day /
Week / Month), not as a separate route. Code lives in
`src/features/planner/goal-view/`.

- Desktop is Card Rails. Phone (below the `md` breakpoint) is swipeable goal
  cards with the selected goal's dates as a vertical list; the cards and goal
  selector stay horizontal.
- Dates are grouped by planner week and show upcoming sessions by default. A
  "Show past sessions" checkbox adds the past ones. The planner's Filters
  "Show completed goals" toggle hides completed goals here too.
- It is a lens on the planner context, not a new data path. Opening it loads a
  361-day window (60 days back, 300 forward) and skips the month-keyed tab
  cache. Sessions come from the planner's filtered day entries, so search,
  filters and unsaved draft moves apply.
- Writes use the canonical paths: one-day nudges queue planner draft moves
  (Planning Mode, Save, Undo), and completion uses `toggleDateFact`. Choosing a
  date expands the planner's session editor (the same goal card and date, time
  and lock controls used under the Day checklist) in a slot under that goal's
  dates.
- "Preview goals" is a read-only week overview across goals that hands a chosen
  session to the same editor.
- Goal Desk and Time Weave remain study-only for now.
