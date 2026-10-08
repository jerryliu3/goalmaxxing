# Everyday refresh study

Status: exploratory UI concepts responding to the October 8, 2026 browser audit.
No production design lock or behavior cutover. Entry: `/ux/refresh`, also linked
from `/ux`. The existing moderator-only UX-lab access boundary applies.

## What is implemented

24 findings have 31 interactive concepts: two alternatives for each of the
seven high-priority findings and one concept for each of the seventeen medium
findings. Each detail page includes the observed problem, premise, tradeoff,
a suggested interaction and the production boundary. Alternative B has a
shareable `?variant=b` URL. The index supports area, priority and text filters.

The study inherits the current theme and offers an isolated theme preview.
It uses the shared brand roles and existing theme assets. Preview changes do
not call the saved theme setter or alter cookies. Phone canvas recomposes the
content at 390px; dialogs respond to the actual browser viewport. Reset sample
remounts the current demonstration. Changing alternative, navigating away or
reloading resets local interaction state.

Fictional data uses October 8, 2026 as Today. The audit's account data and private
screenshots are not included. No APIs, database writes, persisted preferences,
sharing, invitations, or AI calls are connected. A sample Save is an in-memory
confirmation. This is a concept implementation, not a production replacement.

## Coverage and alternatives

The numbers preserve the original audit's finding IDs.

| ID | Priority | Finding / route under `/ux/refresh/` | Concept A | Concept B |
| --- | --- | --- | --- | --- |
| 01 | High | `readable-cards` · shared goal-card contrast | Caption dock | Label plate |
| 02 | High | `agenda-hierarchy` · controls before work | Workbench | Date spine |
| 03 | High | `recovery-actions` · decisions separated from Save | Review desk | Session queue |
| 04 | High | `tracker-selection` · pill selection and focus | Selection ledger | Scope drawer |
| 05 | High | `tracker-calendar` · contrast and hidden editing | Count calendar | Week log |
| 06 | High | `profile-location` · location and reachable settings | Owner desk | Profile / Settings |
| 07 | High | `dialogs` · inconsistent utility surfaces | Centered sheet | Side inspector |
| 08 | Medium | `goal-score` · chart interpretation | Quiet trend | — |
| 09 | Medium | `past-goals` · duplicate chronological archive | Monthly volumes | — |
| 10 | Medium | `week-day` · stretched rows and repeated day | Week desk | — |
| 11 | Medium | `goal-view` · unreadable lane context | Named lanes | — |
| 12 | Medium | `planner-settings` · preferences mixed with repair | Calendar essentials | — |
| 13 | Medium | `growth-composition` · stacked heroes and metrics | Growth journal | — |
| 14 | Medium | `medals` · framing overwhelms the object | Collector shelf | — |
| 15 | Medium | `records` · ambiguous units and technical copy | Named records | — |
| 16 | Medium | `showcase-picker` · long catalog and hidden records | Pin library | — |
| 17 | Medium | `preferences` · settings grouped by implementation | Settings directory | — |
| 18 | Medium | `plain-copy` · developer language | Plain language | — |
| 19 | Medium | `community` · hidden standings and weak context | Team room | — |
| 20 | Medium | `navigation-scope` · identity mixed with scope | Context switch | — |
| 21 | Medium | `goal-collection` · collection retrieval | Card catalog | — |
| 22 | Medium | `goal-editor` · details versus editing | Card and details | — |
| 23 | Medium | `phone-agenda` · narrow calendar and filter rails | Pocket agenda | — |
| 24 | Medium | `goal-creation` · Back/Cancel discoverability | Guided card | — |

## High-priority design decisions

### 01 · Stable identity around material

Caption dock gives the card's name, category and actual completion count an
independent, readable home below the collectible. Label plate places that
information on an opaque theme-role surface over its lower edge. Both reuse
`TempoGoalCard` and show empty, half-filled and complete states. The caption
has the semantic goal identity; non-interactive decorative artwork is hidden
from assistive technology to avoid repeating the same text.

The tradeoff is art versus working text: the dock adds height; the plate covers
some artwork. Neither changes progress calculation or the production card.

### 02 · Agenda toolbar hierarchy

Workbench combines date and view controls with a deliberate search/filter
entry, leaving the work dominant. Date spine gives the date its own small
anchor, moving above the work on narrow canvases. Both use the same sample
sessions, view selection, filtering and completion rows. The recovery entry
is contextual and compact rather than a permanent full-width warning.

These do not replace the production Month/Goal View. The study isolates the
hierarchy decision; the separate Pocket agenda and Named lanes cover those
representations.

### 03 · Recovery decisions and commit boundary

Review desk presents one goal at a time. Session queue shows all missed work
at once. Both keep draft count, Undo, Discard and Save review beside the review
body. The date picker says Use this date, distinguishing a proposal from the
final commit. The same action bar is demonstrated for a planner draft through
the Recovery/Planner switch.

**Persistence decision stays explicit:** the audited live UI staged recovery
changes, while the earlier recovery study describes immediate per-item saves.
This study demonstrates the audited staged model for the action-placement
comparison. It does not override the earlier product decision or implement a
new write path. Before production adoption, reconcile that difference with
product and wire the chosen presentation into the canonical recovery flow.
Auto-rebalance begins off. Its sample explanation says no additional sessions
need moving; it does not introduce a second planner or pretend to run one.

### 04 · Selection is distinct from focus

Selection ledger exposes readable checkbox rows and explicit Focus actions.
Scope drawer puts the same searchable picker behind a summary control. Both
show exactly which goals the calendar represents. Several selected goals
produce a read-only aggregate; a single selected goal exposes its editable
completion log. An empty selection has an explicit state. No hover-only action
or small nested list scroller is required.

### 05 · Completion log with explicit date actions

Count calendar displays readable completion counts with future days clearly
unavailable. Week log uses a compact month overview plus a seven-day strip and
the same stable date-detail area. A single-goal day exposes Log completion or
Remove; aggregate mode explains why it is read only. Accessible date labels
include the full date, Today where applicable, completion count and future
status. These are completion facts, not planner placements.

The sample supports at most one completion per goal/day to keep its interaction
small. Production eligibility, multi-completion counts and linked-goal cascade
rules remain owned by the canonical completion path.

### 06 · Profile ownership and location

Owner desk combines compact identity and curation with settings alongside.
Profile / Settings preserves the existing production membership card and gives
settings an immediate local entry. Both keep the avatar active, keep the four
main destinations, offer local bio editing and preview the current goals with
View all. The actual membership card, avatar and medal rendering are reused.
No public visibility or featured-goal selections are changed.

### 07 · Dialog anatomy

Centered sheet and Side inspector use the same header, Close, bounded scrolling
body and action footer. Both demonstrate a short preferences form and the longer
showcase picker. Radix-backed production dialog primitives retain Escape,
focus trapping and focus return. The side inspector becomes full-screen on a
real narrow viewport. The study does not alter the shared production dialog
implementation or flatten distinctive object editors into utility forms.

## Medium-priority interaction details

- **Score:** switch 1M/3M/YTD and inspect points by pointer or keyboard. The
  explanation explicitly identifies its fixture values and leaves percentile
  population/window decisions to the real calculation contract.
- **Books:** current-year months and a prior-year volume open to searchable
  contents, direct entry selection and optional Previous/Next paging. Ended,
  unfinished goals retain their actual outcome. Production still needs one
  agreed date-grouping rule for early completion and year boundaries.
- **Week desk:** the compact week overview selects one readable daily list.
  Done is expandable and completion remains separate from opening details.
- **Named lanes:** readable goal identity and named sessions replace tiny
  identity thumbnails and confusing ordinals. Opening a session and changing
  its date are explicit controls.
- **Planner preferences:** rest weekdays save locally; maintenance is disclosed
  in a separate explanatory surface and is never executed by the study.
- **Growth journal:** one page heading, then score, activity, records and medals.
  Existing demo components are composed rather than copied; deeper records
  appear on request.
- **Medals:** existing production Prism medals get a larger focal display, a
  compact earned shelf and a useful date. No next unlock is invented.
- **Records:** day streak and active-week streak have distinct names and
  definitions. Completion statistics include visible date windows and plain
  language.
- **Pin library:** three slots stay visible, selected items can always be removed,
  and Medals/Records/Finished goals filters and search aid retrieval. The
  existing study pin-limit helper is reused.
- **Settings:** Calendar, Privacy and Appearance have recognizable entries and
  bounded forms. Sample privacy choices never alter actual visibility.
- **Copy:** side-by-side current/proposed examples and a plain unavailable
  check-in state. No disabled developer testing controls are added.
- **Community:** standings are visible without flipping; shared-week buttons
  show dates and counts; the shared-goal empty state explains the next step
  without implementing a new sharing mutation.
- **Scope:** content viewing scope is separate from the identity menu. The
  sample explains whose content is visible; the avatar remains your identity.
- **Collection:** search, name/progress sorting, stable captions and a direct
  Open action. Optional rotation is inside the focused detail surface.
- **Editor:** read details first, then explicitly edit. Reward and purpose are
  named sections; Cancel discards an unsaved name.
- **Pocket agenda:** month cells carry date and planned-work presence; selected
  day details carry readable session names. One filter entry replaces rails.
- **Creation:** a deliberately short sample demonstrates local validation,
  Back, Continue, Cancel and Review. It neither replaces the production wizard
  nor claims to cover every rhythm or creation field.

## Structure and reuse

`src/features/ux-refresh/catalog.ts` is the finding/variant catalog. Thin route
files resolve a known slug and render the study. `study.tsx` owns comparison
chrome, local theme preview, phone canvas and Reset sample. Demonstrations are
split into focused modules under `agenda/`, `growth/`, `profile/` and
`goals/`, with shared demonstrations and Community alongside them. Common
controls, card presentation and accessible dialogs live in `primitives.tsx`;
small deterministic fixtures live in `sample.ts`.

The study reuses production buttons, Radix dialogs, avatars, membership card,
Tempo goal materials and Prism medals. It uses the existing UX access boundary
and shared brand registry without adding dependencies or theme values.
Production AppShell, tabs, APIs, database and mutation hooks remain untouched.

## Coverage written; execution deferred

`refresh.test.tsx` covers audit completeness, future-day log eligibility,
recovery staging/undo/save, planner Undo, tracker aggregate-to-focus/log/remove,
direct book retrieval including unfinished outcomes, showcase capacity and
replacement, editor cancellation, and creation Back/Review/sample submission.
Material rendering is mocked in those interaction tests.

Tests, typecheck, lint, builds, browser verification and CI were not run, in
accordance with `AGENTS.md`'s explicit post-PR verification gate. Responsive and
visual behavior is implemented but remains unverified until approval.

## References

- [Experience guide](goalmaxxing-experience-design-guide.md)
- [Application guide](goalmaxxing-application-design-guide.md)
- [Profile study](goalmaxxing-profile-study.md)
- [Recovery study](goalmaxxing-recovery-study.md)
- [Medals study](goalmaxxing-medals-study.md)

The existing production locks and canonical domain paths take precedence over
these exploratory presentations. Adopt chosen directions in focused follow-up
changes after reviewing the concepts.
