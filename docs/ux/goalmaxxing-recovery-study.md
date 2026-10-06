# Recovery study

Status: **Exploratory. Not a lock.** Production recovery is unchanged.

Clickable study: `/ux/recovery` (index) · `/ux/recovery/goal-by-goal`
(leading) · `/ux/recovery/goal-view`

Code: `src/features/ux-recovery/*` — one pure suggestion model
(`model.ts`) and one review reducer (`review-state.ts`) drive both
concepts, with seeded local data (`seed.ts`). No API calls.

Round 1 (PR #1131) shipped Ledger (A), On the calendar (B) and One at a time
(C). Round 2 replaced all three with Focused list (A), Goal by goal (B) and
In Goal View (C). Round 3 makes Goal by goal the leading concept, updates In
Goal View to the same row behaviour, and retires Focused list.

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

## Round 2 decisions (Jerry's feedback)

1. **Ledger is the baseline**, with pieces of the others. Calendar-first (old
   B) is out: suggested positions never show unasked. One button —
   "5 sessions slipped · Review" — enters recovery; only then do missed days
   (amber) and suggested days (dashed ghosts) appear on the calendar, which
   also reaches back to the week of the earliest miss. Before that the
   calendar looks normal: misses are quiet past entries.
2. **Immediate persistence.** Accept, Edit + Apply (a per-row Apply after
   picking a day) and Let it go each write at once and the row leaves the
   list. No bottom "Apply all decisions" step. Accept all stays and writes
   every remaining row with a day (each goal panel also offers "Accept N" when
   it has more than one). A short-lived toast ("Run moved to Thu Oct 8 ·
   Undo", 6 s) undoes the last write only.
3. **One strategy setting.** Per row there is only "just the missed
   session". One top-level switch, **Auto-rebalance** (off by default).
   *Interpretation implemented:* when on, every goal's suggestions use
   rebalance; accepting a row writes that row plus its goal's shifted later
   sessions, which are listed inline on the row ("Accepting also moves …").
   Per-goal strategy overrides are removed from model, reducer and UI. An
   Edit + Apply pick moves only that session, even with Auto-rebalance on.
   Sessions recovery has already moved (`recoveredFrom`) are pinned by later
   rebalances, so accepting one row of a goal never re-moves it and its
   sibling keeps the slot it was previewed with.
4. **All goals vs one goal at a time** is still open, so round 2 builds both
   under the new rules (Focused list, Goal by goal) plus a third: recovery
   inside Goal View's lanes.

## Round 3 decisions (Jerry's feedback)

1. **Goal by goal leads.** Review walks the goals that slipped one at a time
   ("Goal 2 of 4", the goals that had slips when review opened). "Skip for
   now" is gone: **Next goal** is always available, whether or not the goal
   still has open rows; from the last goal it reads **Summary**. Back stays.
   *Why:* Jerry is comfortable deciding per goal, and an always-present Next
   goal makes the stepper a navigation aid instead of a gate.
2. **The calendar filter lives in the panel.** "Show full calendar / Only this
   goal" moved from above the calendar into the review panel's toolbar, next
   to Auto-rebalance. The calendar keeps a passive caption ("Only Run
   sessions" / "All goals · Run highlighted"). *Why:* every review control in
   one place; the calendar is the preview.
3. **Decided rows stay, as confirmations with their own Undo.** Accept or
   Edit + Apply still writes at once, but the row turns into "Moved to Thu
   Oct 8 ✓" with the old date struck through ("~~Mon Oct 5~~ → Thu Oct 8");
   Let it go turns into "Let go ✓". Each holds an Undo for that row only, in
   any order. The global single-undo toast is removed — it added nothing once
   every row carries its own Undo. On the calendar a saved move shows as a
   solid-outlined chip ("Saved" in the legend). *Why:* the user sees what they
   just did and can take back any one decision, not only the last.
4. **The summary is a recap of every change, grouped by goal** (A's list
   style): each goal's sessions old → new — moved, shifted by a rebalance,
   let go, or left for later — with per-row Undo still available, a Review
   link on each left-for-later row (back to that goal), Back and Done.
5. **Auto-rebalance is a review-all proposal.** Turning it on jumps straight
   to the summary, showing every goal's *proposed* dates: open rows with a
   dashed "Proposed" pill and "Missed → new" dates, each goal's later
   sessions under "Would also shift", fallbacks noted. The sheet says
   "Auto-rebalance · not saved yet / Proposed new dates", the calendar shows
   the slipped goals' ghosts with "proposed dates, not saved yet". Nothing is
   written until **Apply rebalance** (one action), which saves the whole
   proposal and turns the switch off; the summary then shows it as saved. **One goal
   at a time** (or turning the switch off) drops the proposal and returns to
   the first goal with open rows. Decisions already saved stay saved and
   undoable throughout. Per-row Accept no longer carries shifts — the only
   way to rebalance is the reviewed batch.
   *Undo granularity:* Apply rebalance records one decision per goal (its
   moved rows plus the later sessions it shifted), shown as "Saved with
   Auto-rebalance ✓" with one Undo, because undoing one row of a reflow would
   leave its siblings spaced around a gap. A goal whose rebalance moved one
   session and shifted nothing records an ordinary "Moved to" row.
6. **Phones: compact sheet.** The review sheet takes half the screen (80%
   on the summary, where the list is the point), and while reviewing the
   phone calendar shows three weeks from the goal's earliest miss with
   shorter rows, so the filtered goal's slip and suggested days stay visible
   above the sheet. Chosen over a mini week strip because it reuses the same
   calendar and keeps "only this goal" literally true on screen.
7. **Full dates in move labels.** Shift lines read "Oct 13 → Oct 21", never
   "Tue → Oct 21" (`dateMove` in `dates.ts`; also used by the calendar chip
   and Goal View card notes for shifts).
8. **Focused list (A) is removed.** Its shared pieces were already in
   `review-list.tsx` and `month-grid.tsx`; `focusGoal` and the global Accept
   all went with it (per-goal "Accept N" stays, one confirmation per row).

9. **Summary calendar shows only the slipped goals.** On the recap — saved
   summary and Auto-rebalance proposal alike — the calendar defaults to the
   goals in this review (`calendarFocus` in `review-state.ts`: the current goal
   on a step, every reviewed goal on the recap). The panel's "Show full
   calendar / Only slipped goals" toggle stays available there and brings the
   other goals back dimmed, like on a goal step. Captions: "Slipped goals · as
   saved" / "Slipped goals · proposed dates, not saved yet" (or "All goals ·
   slipped highlighted · …" with the toggle on). *Why:* the summary is about
   what slipped; unrelated goals were noise.
10. **"Rebalance all" is renamed "Auto-rebalance"** everywhere user-facing
    (switch, toolbar caption, "Auto-rebalance · not saved yet", "Saved with
    Auto-rebalance ✓"). The apply button stays **Apply rebalance**: shorter,
    and it reads as the action of the Auto-rebalance switch.

## Decided rules (encoded in `model.ts`)

1. **Never auto-move.** Each recoverable session gets a suggested date the
   user can Accept, Edit + Apply (another valid date), or Let go (stays
   missed, never prompts again). Each decision persists immediately and
   stays undoable on its own row for the rest of the review.
2. **Two strategies, one switch.** *Just the missed* (squeeze, default) moves
   only the stranded session into an open day. *Auto-rebalance* reflows each
   goal's stranded sessions plus its future unlocked sessions evenly across
   the remaining window and lists every shift. In the seed it reflows
   portfolio sessions 6–7 and three of the books goal's Saturdays — a reason
   it stays opt-in.
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
- `suggest(seed, today, rebalance = false)`:
  - Squeeze: earliest open non-rest day; else earliest open rest day; else
    `null` with a reason built from what blocked each day.
  - Rebalance: open days in the window (non-rest first) excluding fixed
    same-goal days (today's, done and locked sessions); items (stranded by
    missed date, then future sessions by date) take evenly spaced slots
    `pool[floor((i + 0.5) · n / k)]` in order. If the window cannot hold them,
    the goal falls back to squeeze with a note.
  - Placement runs tightest window first; the plan lists goals in goal order.
  - Under rebalance, sessions with `recoveredFrom` are pinned: entries are
    ordered by original date, and if the even spread puts every pin where it
    already is, the rest take the spread; otherwise the rest spread around
    the pins.
  - `shifts` live on the goal plan and are shared by each of its rows.
  - A row's `options` (the Edit strip) are checked against the *saved* plan,
    not other rows' unsaved suggestions — a pick moves only that session.
- Writes: `acceptSuggestions` (one row, one goal's rows, or all; with the
  goal's shifts under rebalance — used only by Apply rebalance now),
  `moveSession` (Edit + Apply), `letGo` (`dismissed: true`). Each sets
  `recoveredFrom` on what it moves.

### Review reducer (`review-state.ts`)

- State: `steps` (goals with slips at open, goal order), `step`
  (`steps.length` = the recap), `rebalance` (the proposal is showing),
  `decisions` (this review's writes, oldest first).
- Every write records a `Decision` — kind `moved`, `letGo` or `rebalanced`,
  the settled rows (`from` = missed date, `to` = new date or null), the shifts
  it wrote, and `before`: the touched sessions as they were. `undo` puts
  exactly those sessions back, so decisions undo independently (they never
  touch the same session: moved sessions are pinned, let-go ones excluded).
- Per-row actions (`accept`, `acceptGoal`, `move`, `letGo`) always use the
  just-the-missed plan. `rebalance: true` jumps to the recap;
  `applyRebalance` writes `acceptSuggestions(…, rebalance = true)` — exactly
  the previewed proposal — and records one decision per goal.
- Navigation: `next` (always; clamps at the recap), `back`, `goTo(goalId)`
  (Review links, Goal View markers), `recap`.
- Selectors: `goalItems` (a goal's decided and open rows in missed-date
  order), `recap` (groups per goal, plus proposed shifts and fallback notes
  under Auto-rebalance), `recapCounts`, `calendarFocus` (goals the calendar
  shows: the current goal, or every reviewed goal on the recap).

## Seeded week (today = Wed Oct 7, week Mon Oct 5 – Sun Oct 11)

| Goal | Miss | Default suggestion |
|---|---|---|
| Run 3× a week (Mon/Wed/Fri) | Mon Oct 5 | Thu Oct 8 — after Wednesday's run (the bug case) |
| Read 20 min a day | Tue Oct 6 | Excluded — past daily period |
| Guitar sprint, 5× until Sun | Tue Oct 6 | No day left — honest reason |
| French 2× a week | Sat Oct 3 | Excluded — last week |
| Ship portfolio site (milestone, Oct 28) | Thu Oct 1, Mon Oct 5 | Mon Oct 12 (skips rest Sunday), Wed Oct 14; Auto-rebalance: Tue Oct 13, Fri Oct 16, sessions 6–7 shift to Oct 21 / Oct 26 |
| Read 12 books by Dec 31 | Sat Oct 3 | Sun Oct 11; Auto-rebalance also shifts three Saturdays (Oct 10→17, 17→20, 31→30) |

Today and Saturdays are full (3 sessions), which shows the cap.

## Entry

- **Agenda button** (replaces the settings button): one calm amber pill at the
  top of Agenda — "5 sessions slipped · Review". Absent when nothing slipped;
  it never counts past-period misses. Pressing it is the only way into
  recovery.
- **Check-in row** on the Next tab deep-links into the same review instead of
  dropping the user on the calendar.

## Concepts (round 3)

| # | Name | Thesis |
|---|---|---|
| B | **Goal by goal** (leading) | Side panel on desktop, half-height sheet on phones. "Goal 2 of 4 · saves as you go", the goal as the title, a toolbar with Auto-rebalance and Show full calendar / Only this goal, then the goal's rows. The calendar shows only that goal (from the week of its earliest miss); hovering a row outlines its session. Decided rows stay as confirmations with Undo; "All set for …" when none are open. Footer: Back · Next goal (Summary on the last goal). The summary lists every goal's changes old → new with Undo, Back and Done. Auto-rebalance opens the summary as a proposal with Apply rebalance / One goal at a time. |
| C | **In Goal View** | A lightweight mock of Goal View's lanes (Cards layout). Before Review the lanes are untouched. Review adds a marker to each lane that had slips ("N slipped", then "✓ All set") and opens the first; the open lane brings its slipped cards in ahead of a Today rule, ghosts the suggested days, dims the other lanes, and lists the same rows (with confirmations and Undo) in a tray under the lane, with Back · Next goal. A Summary button and Auto-rebalance show the same recap in a card above the lanes. |

Retired: Focused list (A, round 2) — all goals in one list, the open goal
filtering the calendar, auto-advance when a goal emptied.

## Goal View today (research)

Goal View is the Agenda's goals lens (`calendar-surface.tsx:148` — "a lens on
the same planner context, not a calendar view mode"), rendered as Goal Lanes
since #1102/#1103.

- **Past missed sessions are not shown by default.** The Calendar switch
  defaults off (`goal-view.tsx:64`), and the default Cards layout drops every
  session before today: `buildLanePlan` filters `session.date >= cardsFrom`
  (`goal-lanes-model.ts:92-94`) with `cardsFrom: today`
  (`goal-lanes.tsx:129`). Lanes without Calendar are only goals with
  sessions today or later and not ended (`goal-view.tsx:67-70`,
  `goal-view-model.ts:125-139`). The phone without Calendar is the goal deck,
  which also shows only upcoming sessions (`goal-view.tsx:77,128-141`,
  `goal-deck.tsx:83`).
- **Only Calendar on shows them.** Calendar places every loaded session,
  past included, and adds lanes whose sessions are all past
  (`goal-view.tsx:71-76`, `goal-lanes-model.ts:77-79`). Loaded means the
  rolling window: 21 days back, 68 forward (`goal-view-model.ts:13-15`).
- **Past days and sessions are not styled differently.** The header and day
  rules mark only today and week starts (`goal-lane-grid.tsx:74-78,120-123`);
  no past shading. A session card distinguishes done (`bg-muted`), draft
  (dashed) and today (ring) only (`goal-session-tile.tsx:167-173`), so a
  missed past session looks like an upcoming one apart from its completion
  control.
- **"Read-only month" (#1127) is the toolbar label**, not the lanes: the
  month in view is a plain heading with no date picker; Today and the
  chevrons move (`goal-lanes-toolbar.tsx:61-76`). The same PR made the lane
  label one link to the goal ("Edit goal …", `goal-lane-label.tsx:50-54`),
  replacing the earlier lane-focus toggle.
- **Lane interactions:** card click opens session details
  (`goal-session-tile.tsx:174-189`); completion toggle through the canonical
  completion intent (`goal-session-tile.tsx:95-105`,
  `goal-session-completion.ts:31-35`); date field and ±1-day nudges, never
  before today and not for done/locked sessions
  (`goal-session-tile.tsx:66-73,93,118-136`); milestone rename in place
  (`goal-session-tile.tsx:158-163`); Calendar's date header opens the day
  preview (`goal-lane-grid.tsx:67-73`). Editability is the planner's
  editable window (`planner-goal-view.tsx:81-82`,
  `planner-calendar-day-accessors-model.ts:237-245`).
- **Moves are drafts.** Goal View's move is `updateDraftScheduledDate`
  (`calendar-surface.tsx:1124`), so a moved card turns dashed and waits for
  Save — unlike recovery round 2, which persists immediately.
- **Focus precedent.** Month view already dims other goals when one goal's
  pill is selected (`calendar-surface.tsx:197`,
  `calendar-month-day-cell.tsx:253-256,348`). Goal by goal
  reuses that idea.

So a past missed session *can* already be dragged forward in Goal View — but
only with Calendar on, only by knowing to look for it, and only as an unsaved
draft. Concept C makes Review the thing that brings the lane's slips in.

## Recommendation

Build **Goal by goal** for the Agenda entry. Round 2 recommended Focused
list on the grounds that immediate persistence made a stepper redundant;
Jerry preferred deciding one goal at a time, and round 3 removes the
stepper's costs: Next goal is never a gate, decided rows stay visible with
Undo (so nothing feels lost by moving on), and the summary shows everything
— including what was left — in one place, which answers "what else is
waiting". Auto-rebalance, the one decision that genuinely spans goals, now
gets the all-goals view it needs before anything is written.

Goal View (C) stays the better *second* entry: a lane is a free single-goal
filter. It now shares the reducer, the rows and the recap with B, so shipping
it later is mostly the lane marker and tray. Goal View still hides past
sessions by default and its moves are drafts, and the phone deck has no
lanes.

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
- **Auto-rebalance, interpreted.** One global switch that proposes a reflow
  for every goal, reviewed in the summary and applied in one action. It
  still reflows goals the user did not think about (books' Saturdays in the
  seed) — the summary makes that visible, but there is no per-goal opt-out.
  Should Apply rebalance skip goals the user already settled one by one?
  (Today their saved rows are pinned and only the rest reflows.)
- **Undo lifetime and conflicts.** Per-row Undo lasts for the review
  session; reopening Review starts a fresh list (the writes stay). Undoing an
  older decision restores its sessions' old dates even if a later decision
  has since filled that day, so the daily cap can be exceeded in that corner
  case. Production needs either a cap check on undo or a "can't undo — day
  is full" state.
- **Rebalance undo granularity.** One Undo per goal for an applied
  rebalance. Is per-goal clear enough, or should rebalanced goals offer
  "Undo just this session" (which would re-place the session as a slip)?
- **Global Accept all.** Removed with Focused list; per-goal "Accept N"
  remains and Auto-rebalance covers "everything at once". If testing shows
  people want to accept every just-the-missed suggestion in one go, it
  belongs in the summary as a proposal like Auto-rebalance.
- **Persistence vs drafts.** Recovery now writes immediately, while every
  other planner move (Goal View, calendar drag) is a draft that needs Save.
  Production needs a direct write path for recovery, or recovery stages
  drafts and auto-saves; mixing the two in one session will confuse.
- **Goal View entry.** Should Goal View show the lane marker before Review
  (it is the natural place to notice), or only after, as built? With
  Calendar on, should the slipped card sit in its own past column instead of
  ahead of a Today rule? On phones (goal deck), the deck card would carry the
  marker.
- **Cap source.** 3/day is a seed constant here; production would read it
  from profile capacity settings.
