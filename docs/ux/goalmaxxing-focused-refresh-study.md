# Focused interface studies

Exploratory; no production cutover. Entry: `/ux/focused`. Supersedes the first
round at `/ux/refresh`, which remains explicitly historical.

Baseline: origin/main `63efc13e` (October 8, 2026). Source reconstruction is
labeled as such; it is not a fresh screenshot or visual verification. Both
panels use fictional October 8 data. No private audit screenshots are shipped.
Every variant gives a specific task, exact difference, tradeoff and source link.

## Team — finding 19

Confirmed in `team-panel.tsx`: the week strip colors elapsed weekdays without
activity facts; shared-goal links all target `/calendar?view=week`. The proposed
week uses real fixture completion events, separately attributed to each person.
Click a day to inspect work; click a goal/session to inspect that goal's dates.
No fabricated engagement score, season, leaderboard metric or streak is added.

Shared week (A) leads with the relationship's recent work. Goal desk (B) leads
with shared goals and the next owner/date. Both include no-partner invitation,
pending/cancel, paired, no-shared-goals, partner preview, encouragement and
leave confirmation states. Invitation acceptance and sending are explicitly
sample-only. Shared-goal setup is an honest boundary: this study does not assume
conversion of existing personal goals or invent sharing permissions.

Team is a place to understand shared goals and support a partner. Agenda's Duo
view remains the planning owner. Production adoption needs goal/date-specific
handoff through its canonical navigation, existing sharing rules, and current
team mutations. No new backend or alternate planner is implemented.

## Mobile app — finding 23 (and the specific crowding concern from 2)

Both alternatives use the same three goals, placed sessions, completion controls,
filter, session detail and draft move/save/undo flow. Calendar + day retains
horizontal date browsing and reveals full selected-day titles. Date-grouped
agenda leads with today and upcoming dates; earlier days fold below. It is an
optional representation, not a new default or a replacement for Week.

Completion uses the production hold hook and progress mark. Dates and completion
state are kept separate: undoing a move cannot undo a completion. The sample
shows one week to isolate the comparison; adoption must keep full month
navigation, existing filters, linked completion semantics and planner commands.

## Mobile marketing — new exploration within 23

The landing page was not browser-audited. This is a hypothesis based on the
current hero/proof composition, not a validated conversion finding. Compare
Readable chapters (A), a vertical goal → sessions → adjustment narrative, with
Make a little plan (B), a deterministic two/three-run example. Both reuse the
production Tempo goal-card rendering. A is understandable without participation;
B makes the cause/effect tangible but requires input. Both use the same running
goal, explicit draft/save state, existing app/demo destinations, and readable
session rows. There is no invented AI behavior, autonomous plan application,
autoplay requirement, or fabricated social proof.

## Tracker — finding 5

Main's selection refresh is retained. Both options reuse `MonthHeatmap` and the
production hold completion hook, with stable date-number surfaces and an intensity
key. A adds Inspect a day, leaving the calendar in log mode for one goal. B adds
Log/Inspect and inline date detail. Multiple goals stay read only. Future-day
logging is disabled; inspection can still explain future dates. No week-log
replacement, count semantics change, or parallel production completion path.

## Profile and utility sheets — findings 6, 7, 15–18

Keep the actual membership card, bio and records on the card, separate record /
showcase budgets and existing goal-card renderers. Add a Settings button beside
Edit profile, not a tab bar. Privacy gets a direct entry; Calendar reuses
`PlannerPreferencesSettings`. Other settings remain labeled context, not fake
working editors. Identity editing is outside this excerpt; Edit profile studies
the bio entrance only, with the shared bio limit.

The centered sheet reuses Radix dialog primitives, with bounded scrolling body,
Close/Escape, fixed heading/footer and visible Done. A searchable pin picker
keeps selected items/count sticky so search never hides the removal controls.
It uses production `togglePin` and `pinKey`, respecting separate three-record and
three-showcase budgets. Done stages profile changes; Save profile explicitly
commits the local sample, and Undo restores it. Calendar/privacy save separately.

Exact before/after copy examples include their source locations. They address
Growth streak units and statistics tooltips, Agenda's hidden linked-goal filter,
and Team's empty state. Already-cleaned planner/appearance/check-in examples are
excluded. No statistics definitions, windows or visibility rules change.

## Collection and small creation navigation — findings 1, 21, 24

One combined proposal: add search, name/progress sorting and a stable name band
above the existing `GoalProgressCard`. Its artwork, rotation, progress and reward
remain. The current card already has a progress footer: the proposal explicitly
acknowledges that and reuses its canonical formatter rather than inventing a
new progress calculation. Stable names add height and repeat artwork lettering;
this is a hypothesis to assess, not an automatic win. The profile example also
renders actual current-goal cards instead of replacing that context with a stub.

A bounded creation excerpt adds adjacent Back/Cancel on Intention and preserves
the typed name when going back to Start. It reuses the production step navigation;
Rhythm is shown only as the next-stage entrance. The rest of the wizard, AI/import
flows and details-versus-editing behavior are not redesigned.

## Excluded findings

Resolved on main: 3, 4, 9 and the active-profile part of 6. Substantially overlapped
by main: 7 and 12. Rejected: 8, 20. Withdrawn: broad 2, 10, 11, 13, 14. Deferred: 22. Finding 21 is combined with 1 rather than another card redesign. Findings 15
and 18 share the precise copy review. Only mobile's concrete crowding problem is
carried forward from 2. Existing score, scope switch, medals and goal lanes stay.

## Delivery and verification

Functional test coverage is written as code. Browser checks, tests, builds,
typecheck, lint and CI are deferred under AGENTS.md until explicit approval
following PR creation. Responsive behavior remains visually unverified.
