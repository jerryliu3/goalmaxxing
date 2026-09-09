# Goalmaxxing — Next Wave

Status: **divergent interaction exploration, September 8, 2026.**

Five concepts at `/ux/next-wave`, with a standalone private prototype at
https://goalmaxxing-next-wave.goofy-bell-4926.chatgpt.site.
The existing Spatial Plan, Gazetteer, Atlas/Pins, and Club study locks remain intact.
This study is an invitation to compare, not a production implementation decision.

## What this round is trying to improve

The previous work has explored substantial information architecture and visual
territory. Orbit, Tide, Relay, and Fieldbook already ask whether the core object
could be a body, current, commitment, or page. Simply making a softer calendar,
a shinier card, or another orbital diagram would repeat that search.

This round asks a more concrete question: **what small, understandable action
would make someone feel that the product has made their life easier?**

The aim is a combination of emotional appeal and operational clarity:

- Anticipation: the interface makes the next possible action apparent.
- Continuity: the thing you touch remains recognizable as its state changes.
- Consequence: finishing work leaves visible, inspectable evidence.
- Relief: changing a difficult day feels like making room, with clear control.
- Restraint: social participation helps effort without demanding attention.

These are design hypotheses, not findings from user testing. The same sample
week and state are shared across all five directions so differences in the
interface can be compared without differences in the underlying story.

## Reference principles, not visual templates

**Things: direct manipulation and progressive disclosure.** A to-do opens in
place; Magic Plus inserts work where it belongs. The lesson is that creation
and editing can preserve the spatial context of the user's intention. Prism
uses selected-day continuity; Weave offers insertion in a goal/date cell.
[Things features](https://culturedcode.com/things/features/).

**Apple: materials should establish hierarchy.** Liquid Glass is described as
material for controls and navigation that preserves underlying content. The
useful idea here is to distinguish navigation from reading surfaces. Prism
uses CSS perspective and translucent day layers against a dark green field,
with a stable light backing for its daily list. It is not a native Liquid
Glass implementation or a physical refraction simulation.
[Apple materials guidance](https://developer.apple.com/design/human-interface-guidelines/materials).

**Structured: make time comprehensible.** Its visual daily timeline places work
in the context of a day. Tempo borrows the clarity of visible time, then explores
a different primary interaction: a remaining-time budget with a reviewable
replanning proposal. Its minute totals express workload, not achievement.
[Structured](https://structured.app/).

**Oura: lead with something useful, then let people inspect evidence.** Oura's
published redesign describes a focused daily insight and a longer-term view.
Progress in this study pairs a single expressive representation with exact
session records and per-goal totals. The reflection is explicitly based on the
small demo sample; it is not a health assessment or a predictive score.
[Oura app design](https://ouraring.com/blog/new-app-design/).

**Amie: connect intent and time.** Its documentation describes quick entry,
natural-language task creation, and placement on a calendar. Script explores
that immediacy but deliberately exposes the proposed dates before applying a
change. This demo recognizes three disclosed commands; it does not pretend to
have a general-purpose AI planner.
[Amie tasks](https://amie.so/documentation/features/tasks).

**Partiful: social utility can have personality.** Its product centers getting
people together with little organizational friction. Mosaic borrows the idea
that useful participation can also feel expressive. Goalmaxxing's objects stay
team summaries, optional challenges, and a finite leaderboard, rather than an
infinite feed or a new event-management feature.
[Partiful about](https://partiful.com/about).

## Five genuinely different bets

| Direction | Primary object               | Planner's distinctive action                          | Progress                                   | Community                                         | Main tradeoff                                |
| --------- | ---------------------------- | ----------------------------------------------------- | ------------------------------------------ | ------------------------------------------------- | -------------------------------------------- |
| Prism     | A day as a dimensional layer | Lift a date from the week into a readable daily plane | A stack of completed sessions              | Translucent teammate summaries                    | Depth can compete with density               |
| Tempo     | Available time               | Reduce the budget, review moves, save a lighter day   | Minutes invested, by day                   | Bold weekly totals and a challenge poster         | Duration can overemphasize measurable effort |
| Weave     | A goal's rhythm across days  | Place work at a goal/date intersection                | Planned outlines and completed knots       | Parallel summary lanes                            | A full week needs horizontal room on a phone |
| Mosaic    | A piece of the day           | Open a generous tile and complete its session         | An inspectable collection of earned pieces | Colorful contribution cards and challenge punches | Size and arrangement can confuse chronology  |
| Script    | A statement of intent        | Turn a sentence into an explicit amendment            | A concise narrative backed by records      | Quiet summaries in human language                 | Language can hide scope and assumptions      |

### 01 / Prism

**Sensory direction:** forest glass, warm luminous highlights, restrained serif
accents, and layered time. Perspective belongs to actual day selectors and
completion records, rather than a decorative object unrelated to the plan.

The week is a set of five overlapping weekday layers. Select one to update the
daily plane. The seven-day date rail remains available for precise selection,
including the weekend. A completed session becomes a layer in Progress that
opens its record and can be reopened.

On mobile, the daily action plane comes first and the dimensional week follows.
This is intentional: the spatial metaphor must not delay the most frequent
interaction. The light reading plane keeps task text stable against the dark
atmosphere. Reduced motion removes the lifted transitions.

**Try:** complete Tempo run; open Progress; inspect its new layer; reopen it.

**Next validation:** whether the week feels pleasantly tangible or unnecessarily
indirect after repeated use. A real implementation should test blur cost on an
older phone, transparency settings, and legibility at larger text sizes.

### 02 / Tempo

**Sensory direction:** editorial orange, large numerals, sharp dividers, and a
purposeful contrast between the daily agenda and the time control.

A 100-minute remaining plan is the starting point. Choosing a 60-minute budget
proposes moving Read 20 pages and Launch notes to Wednesday, leaving the
45-minute Tempo run. Nothing happens to the real plan until Save plan is used.
Completed Deep work stays on Tuesday. Undo restores the previous plan.

The prototype's rule is intentionally simple and deterministic: move the last
remaining sessions until the selected budget fits. It neither shortens sessions
nor invents priority intelligence. Overflow at the end of the sample week is
left unplanned. A production planner would need to apply its existing eligibility,
quota, availability, and recovery rules at the canonical service boundary.

**Try:** set 60 minutes; preview; cancel once; preview again; save; undo.

**Next validation:** whether people understand remaining time without assuming
it includes completed work, and whether the proposal reduces decision effort.
This is the strongest candidate for a useful product improvement.

### 03 / Weave

**Sensory direction:** a cool cobalt planning instrument. Goal lanes replace the
usual meeting-shaped calendar blocks; sessions are the points where goals meet
dates. Completed knots remain visible in the pattern.

The study supports goal filtering, date selection, session details, and placing
an unplanned session directly into its matching goal lane. A separate selected-day
list provides a straightforward way to complete work. Both paths use the same
session state and amendment review.

On a narrow screen, the week remains horizontally scrollable rather than
shrinking seven columns into illegible targets. Day details stay below the
board. This is an honest density tradeoff, not a claim that wide planning is
solved by a mobile skin.

Community's lanes show shared session totals, not inferred private calendars.

**Try:** select the empty Strength cell on Wednesday, save, and inspect Wednesday.

**Next validation:** whether visible gaps help people establish repeatable
patterns and whether scrolling preserves a clear sense of the selected date.

### 04 / Mosaic

**Sensory direction:** generous lavender, rust, blue, and yellow-green pieces;
large touch targets; a light receipt of the day's effort. This is intentionally
more playful than the other concepts.

The tiles remain chronological and display time and duration. Sessions of at
least an hour span two columns; smaller sessions occupy one tile. That is a
coarse duration category, not an exact area chart. Completing a session marks
its original tile and adds a colored record to Progress. Moving a tile earns
nothing. Empty collection spaces are room to grow, not lost points.

Community presents people as contributions and the optional challenge as ten
punches. Joining changes only demo membership. Completing or reopening work in
Planner updates the joined challenge when the user returns.

**Try:** finish a tile, inspect the new Progress piece, then join the challenge.

**Next validation:** whether the composition increases desire to return while
preserving time ordering, especially when there are many short tasks.

### 05 / Script

**Sensory direction:** nearly monochrome, spacious type, a small rose accent,
and editable language. The contrast with Prism is deliberate: elegance can
come from removing manipulation rather than adding depth.

The supported commands are shown directly in the interface:

- Move Tempo run to Friday.
- Plan strength on Wednesday.
- Leave launch notes unplanned.

Each command produces a before/after amendment and explicit Save plan action.
Unknown text receives a truthful explanation of the three-command demo scope.
Completed sessions cannot be silently moved by a command. Regular date controls
and session details remain available alongside the language entry.

**Try:** enter the first command, inspect its exact date change, save, and undo.

**Next validation:** whether users prefer expressing changes to arranging work,
and which ambiguities require inline controls. General language understanding,
voice input, and production AI scheduling are not implemented in this study.

## What is real in the prototype

- Five independently styled Planner, Progress, and Community directions.
- Seven selectable days with timed sessions, recurring goal sessions, and tasks.
- Place, move, leave unplanned, review, cancel, save, and one-step undo.
- Date-specific completion and reopening; completed work cannot be moved.
- Shared completion-derived progress and goal filtering.
- Team profile summaries, optional simulated challenge membership, leaderboard.
- Challenge membership persists while navigating destinations and concepts.
- Full-width/mobile preview toggle, comparison notes, reset, and reduced motion.
- Reused repository Radix dialog and tabs primitives, including focus management.

The sample is fixed to September 7–13, 2026. It intentionally does not simulate
months of history, authenticate to production, call planner APIs, edit real
memberships, send messages, or save data beyond the current page session.
The application route inherits the existing moderator-gated UX layout. The
standalone private site contains only this study and seeded data.

## Recommendation and next decision

My initial ranking is **Tempo for everyday value, Prism for sensory identity,
and Weave for planning depth**. Mosaic is the stronger playful alternative;
Script tests whether the best interaction is sometimes a sentence.

Do not blend all five. First compare them using the same short tasks: find the
next session, finish it, change a date, recover unplanned work, understand the
result in Progress, and inspect a teammate's summary. Ask what people remember,
where they hesitated, and which interaction they want to repeat tomorrow.

A promising eventual combination is Tempo's reviewable relief interaction with
Prism's restrained material hierarchy. That is a hypothesis for a separate
hybrid study, not a new approved product lock. Avoid combining their competing
primary objects until the tests establish which one should lead.

## Delivery and verification

Canonical source: `src/features/ux-next-wave/`.
Next.js entry: `src/app/ux/next-wave/page.tsx`.
The UX hub links to the new study. No production shell changes are required.

`node scripts/build-next-wave.mjs` builds a standalone static preview, using the
repository's installed React, Radix, and esbuild dependencies. The output directory
can be passed as its first argument. The publishing snapshot is isolated from
the parent repository's unresolved merge state and contains no environment files.

Six focused tests cover saved/unsaved plan changes, completion and undo,
deterministic lightening, end-of-week overflow, state continuity across concepts
and destinations, and command review/save. Isolated TypeScript and lint checks
cover the new source. The full repository typecheck encounters pre-existing
merge-conflict markers outside this study. Browser visual/accessibility/performance
QA has not been run; those are necessary before any production adoption.

## Follow-up: interaction critique and goal creation

The user's assessment supersedes the original framing: these five directions
are primarily presentation studies, not sufficiently distinct interaction systems.
Duration and time-spent assumptions do not match the current product model.
The original screens are preserved as visual references, not proposed semantics.
Four further interaction concepts are deferred due to the remaining five-hour allowance.

The focused follow-up is **Create goal**, available in every theme. This is one
interaction workflow in five visual treatments: intention → recurring rhythm or
milestones → dates/color/privacy → editable review → simulated creation. Its live
goal object reflects choices as they are made. Completion targets describe counts,
never task duration. The default September 8 date belongs to the fixed demo.

Multiple-goal entry accepts one name per line and opens the same review-card
component used by the guided single-goal flow. Defaults are disclosed. Review
allows renaming, type/frequency/target changes, milestone naming, dates, privacy,
reordering, removal, and adding another goal. Creation remains disabled for
incomplete names or invalid date ranges. Milestones have the same deliberate
reordering gesture as the multi-goal review. Closing resets the study draft so
each new creation starts cleanly.

This is an interaction prototype, not a replacement for the production form or
its validation. Linked goals, team assignment, categories, rewards, difficulty,
and real persistence are outside this focused demo. The underlying production
form remains canonical. Eight tests now cover the earlier study plus guided
creation, batch review, reordering, and draft-reset validation. Browser visual QA
is still pending.
