# Recovery study

Status: **Exploratory. Not a lock.** Production recovery is unchanged.

Clickable study: `/ux/recovery` (index) · `/ux/recovery/ledger` ·
`/ux/recovery/calendar` · `/ux/recovery/deck`

Code: `src/features/ux-recovery/*` — one pure suggestion model
(`model.ts`) drives all three concepts, with seeded local data (`seed.ts`).
No API calls.

## How recovery works today

- **Kinds of miss.** Recurring (cadence) units whose credit period has ended
  are `historical_miss` and never move, by design. A *stranded* unit is
  uncredited, scheduled before today, and still has a placement window:
  in-period cadence units, or lifetime milestone / `deadline_total` units
  before the goal ends.
- **Only trigger.** "Recover missed activities" in the Planner settings
  dialog. It runs two kernel previews (normal vs `recoverPastPlacements`),
  diffs them (`src/lib/planner/recovery.ts`), and stages every move as a draft
  `move_item` command at once: "Moved N past sessions forward. Review and save
  to apply." No per-session visibility or control.

### Problems

1. **Next-session ceiling.** Future sessions of the same goal are soft-locked
   in preserve mode and solver dates must strictly increase per goal, so a
   stranded session can only land between today and the goal's next scheduled
   session. 3×/week Mon/Wed/Fri, missed Mon, today Wed → nothing recoverable,
   and the toast falsely blames the period or deadline.
2. **Pile-up.** Rest days and blackouts are weak tie-breakers and there is no
   cross-goal daily cap, so recovered sessions pile onto today.
3. **Never quiet.** The button stays enabled forever because
   `historical_miss` units still count as overdue.
4. **Three "Recover"s.** The settings button (moves), the warning banner
   "Recover" (actually the capacity/lock problems dialog), and the check-in row
   "Recover N missed sessions" (links to the calendar) mean different things.

## Decided rules (encoded in `model.ts`)

1. **Never auto-move.** Each recoverable session gets a suggested date the
   user can Accept, Edit (another valid date), or Let go (stays missed,
   never prompts again). Accept all exists. Nothing changes until Apply; every
   concept previews before/after and supports Undo before and after Apply.
2. **Two strategies.** *Just the missed* (squeeze, default) moves only the
   stranded session into an open day. *Rebalance* reflows the stranded
   sessions plus the goal's future unlocked sessions evenly across the
   remaining window and lists every shift. Chosen globally, overridable per
   goal. Changing a goal's strategy clears that goal's accepts (not
   dismissals).
3. **Past periods stay quiet.** Cadence misses from an ended credit period
   (yesterday for a daily goal, last week for a weekly goal) and misses on
   finished goals produce no row, no prompt, no warning.
4. **Honest fit.** Suggestions stay inside the window (cadence: rest of the
   credit period; lifetime: until the deadline; both capped by the planned
   horizon), never two sessions of one goal on a day, never over the daily cap
   (3) across goals, never in the past, rest days only when nothing else is
   open. Squeeze may land after the goal's next scheduled session (fixes
   problem 1). When nothing fits, the row says why — "This week has no open day
   left. Today, tomorrow, Fri and Sat are full; Sun already has guitar." or
   "Goal ends Fri Oct 9 — no room." — and offers Let it go.

### Model behaviour as implemented

- `findRecoverable(seed, today)` applies rule 3 and orders by tightest window
  first (then goal order, then missed date), so a weekly goal claims this
  week's days before a goal due in three weeks does.
- `suggest(seed, today, strategy, decisions)`:
  - Squeeze: earliest open non-rest day; else earliest open rest day; else
    `null` with a reason built from what blocked each day.
  - Rebalance: open days in the window (non-rest first) excluding fixed
    same-goal days (today's, done and locked sessions); items (stranded by
    missed date, then future sessions by date) take evenly spaced slots
    `pool[floor((i + 0.5) · n / k)]` in order. If the window cannot hold them,
    the goal falls back to squeeze with a note.
  - Accepted rows keep their date (reserved up front, so later rows fit around
    them). Accept all reproduces the same plan exactly. Edits are pinned and
    the rest reflows around them.
  - `shifts` live on the goal plan and are shared by each of its rows.
- `applyDecisions` writes accepted moves, their goal's rebalance shifts (only
  when at least one row of that goal is accepted), and `dismissed: true` for
  let-go sessions. Pending rows stay missed and return next time.

## Seeded week (today = Wed Oct 7, week Mon Oct 5 – Sun Oct 11)

| Goal | Miss | Default suggestion |
|---|---|---|
| Run 3× a week (Mon/Wed/Fri) | Mon Oct 5 | Thu Oct 8 — after Wednesday's run (the bug case) |
| Read 20 min a day | Tue Oct 6 | Excluded — past daily period |
| Guitar sprint, 5× until Sun | Tue Oct 6 | No day left — honest reason |
| French 2× a week | Sat Oct 3 | Excluded — last week |
| Ship portfolio site (milestone, Oct 28) | Thu Oct 1, Mon Oct 5 | Mon Oct 12 (skips rest Sunday), Wed Oct 14; Rebalance shifts sessions 6–7 |
| Read 12 books by Dec 31 | Sat Oct 3 | Sun Oct 11 |

Today and Saturdays are full (3 sessions), which shows the cap.

## Entry

- **Agenda line** (replaces the settings button): one calm line at the top of
  Agenda — "5 sessions slipped · 4 can still fit — Review". Absent when
  nothing slipped; it never counts past-period misses.
- **Check-in row** on the Next tab deep-links into the same review instead of
  dropping the user on the calendar.

## Concepts

| # | Name | Thesis |
|---|---|---|
| A | **Ledger** | Review sheet over the calendar (side panel on desktop, bottom sheet on phones). Rows grouped by goal: missed → suggested pill, Accept / Edit (date strip of valid days) / Let it go, strategy per goal and globally, Accept all + Apply in the footer. The month behind shows ghosts: dashed at the suggestion, strike-through at the miss, shifted sessions struck and re-ghosted. |
| B | **On the calendar** | No new surface. Amber "slipped" chips sit on their day with a dashed ghost at the suggestion. Slim bar: "5 sessions slipped · Accept all · Review", global strategy, Undo, Apply. Tap a chip for a panel (Accept / Choose day / Let it go / strategy). Drag onto any highlighted valid day on desktop. Week grid on desktop, day list on phones; an "Slipped earlier" lane carries misses from before the visible week. |
| C | **One at a time** | Triage deck. Each card: goal, missed day → suggested day, a mini week with the suggestion lit, Accept / Pick another day / Let it go / Later, and a Rebalance switch that reveals the shifted sessions. Ends on a summary (moving, letting go, left for later) with Apply and "Accept the rest". |

## Open questions

- **Where dismissals persist in production.** Likely a per-item
  `dismissed_at` on the planner item/unit so the kernel and the overdue count
  both skip it. Needs a migration and a canonical write path.
- **Rollout.** Replace the settings button with the Agenda line; rename the
  capacity banner's "Recover" (it opens capacity/lock problems, e.g. "Fix
  plan"); point the check-in row at the review.
- **Kernel.** Squeeze needs the solver to allow a recovered unit after the
  goal's next scheduled unit; rebalance needs future unlocked units to move
  inside the same preview. The daily cap and rest-day avoidance should be
  hard/strong constraints in the kernel, not UI tie-breakers.
- **Milestone order.** The study treats lifetime sessions as
  interchangeable. If milestone units carry order, squeeze must not place an
  earlier milestone after a later one.
- **Partial rebalance.** If only some of a rebalanced goal's rows are
  accepted, shifts still apply and pending rows stay missed. Is that right, or
  should rebalance be all-or-nothing per goal?
- **Cap source.** 3/day is a seed constant here; production would read it
  from profile capacity settings.
