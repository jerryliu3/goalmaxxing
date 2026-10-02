# Goal View code study

Route: `/ux/goal-view`. Uses the existing moderator-only UX lab gate.
Exploratory, not a product lock or a production calendar cutover.

## The two directions

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

Both use the same draft and completion state. Switching directions, phone
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
