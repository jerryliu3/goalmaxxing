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

## Delivery and verification

Functional test coverage is written as code. Browser checks, tests, builds,
typecheck, lint and CI are deferred under AGENTS.md until explicit approval
following PR creation. Responsive behavior remains visually unverified.
