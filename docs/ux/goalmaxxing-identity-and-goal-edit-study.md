# Header identity & goal editing study

Route: `/ux/identity-edit`. Uses the moderator-only UX lab gate.
Exploratory, not a product lock. Nothing in the lab writes data.

## 1 · Header identity

Main's header (#1104) is one row from `lg`: a 36px XP pill with its own
popover on the left, tabs centred, then Coach and the account menu (faces +
chevron; Solo / Partner / Duo and Profile settings). The wordmark was removed.

Each concept brings the wordmark back and makes the identity *the account menu
trigger*, so the chevron stays and there is one control for "you". The menu
gains an XP summary (level, band, total, XP to next level) above Viewing and
Profile settings, replacing the separate XP popover. Faces follow the scope:
one face for Solo or Partner, both stacked for Duo.

Two identities remain after review (Ring, Nameplate and Edge bar dropped):

- **Capsule** — 48px pill: faces, `Lv`, total, a 7px bar, chevron.
- **Wordmark meter** — the XP bar is the wordmark's underline with a level
  chip; the account menu stays faces + chevron, taller. XP keeps a popover.

### Coach without a floating button

Each identity is paired with four coach placements, against today's pill:

1. **Joined** — the coach mark leads the identity in one shared outline; each
   half keeps its own action.
2. **Ask field** — "Ask your coach…" opens the pane with the question sent; a
   ready check-in replaces the placeholder. Beside Capsule there is no room
   (each side zone is ~375px at 1280), so it starts as the mark and expands
   over the tabs while in use. On phone it is the mark.
3. **Coach tab** — the last destination, set apart by a rule; it opens the
   pane rather than navigating and stays selected while open. On phone it is
   the fifth bottom-bar item, leaving the header as wordmark + identity.
4. **Nest mark** — the three-circle mark becomes the logo beside the wordmark
   and the coach entry; it breathes when a check-in is ready.

The check-in invitation anchors under whichever entry the option uses.

Controls: paired or not; photos; check-in ready; `+40 XP` / `Level up`; wide
(1280), tablet (820) and phone (390, with the bottom bar) frames that follow
main's one-row / wrapped / phone layouts.

## 2 · Edit goal

Today `/goals/:id` opens `GoalForm` → `GoalCreationFieldControls` in the route
sheet: a dense legacy grid that shares nothing visual with the Tempo creation
flow. The session popup (`PlannerEventDetailDialog` → `WorkQuestCard` +
material card) already has the right shape: card plus editable facts.

What `update_goal` allows: name, category, colour, target count, end date,
default time, difficulty, privacy, linked goal, milestone names, plaque
target. Immutable: goal type, recurrence interval, target basis, start date.
So "cadence" is editable only as its number (3 → 4 days a week); the interval
shows as a locked chip.

All concepts compose the same per-fact editors (`fact-editors.tsx`, built on
`TempoGoalChoices`, Tempo beads and chips) and the production
`TempoGoalCard` as a live preview, so the goal card itself stays a pure
renderer. Drafts are shared across concepts; Save moves a local baseline.

The lock after review: **edit the card itself** — the annotated card on
desktop, the direct card on phone (the lab's "Card editor"). Inspector, Card
back, Ledger, Chapters and Marked-up were explored and dropped.

The card is still the unmodified `TempoGoalCard`: `useCardRegions` measures
where each fact renders (target, title, category, effort, dates, time,
privacy line) and an overlay places the edit affordances there. Facts the card
doesn't print yet get a ghost "+ deadline" slot; the start date shows a lock.

- **Direct (phone)** — tap anything on the card. Outlines show on hover (or
  faintly, always, on touch). Type over the title in the card's own type;
  a +/− pill inside the card's edge; − and + either side of the effort bars
  (the material changes); native pickers on the date and time. Category
  opens a dot palette above it with a caption naming the hovered (or
  current) colour; a tap recolours the card live and the palette stays open
  until an outside tap or Escape. The privacy line opens a "Visible to
  friends / Private" choice under it. Effort and privacy changes confirm in
  a small bubble.
- **Annotated (desktop)** — callouts sit level with the fact they describe:
  facts printed at the card's left edge call out left, full-width and
  right-edge facts call out right, so no leader line crosses the face.
  Callouts stack without overlapping; an opening editor pushes neighbours
  frame by frame as it reveals, and lines are drawn from the same computed
  positions. Hovering a callout or the fact highlights the pair; clicking the
  fact opens its callout; Escape or a press outside closes.
- **Edit in place, never in a second box.** An open callout (or back row)
  swaps its value for a compact control in the same container
  (`InlineFact`): text becomes a field in the same type; dates and times
  become the input with "No deadline" / "Any time"; target and plaque become
  − n + steppers; category, effort and privacy become small segments that
  apply and close on pick.

Both turn over to a **card-sized back** ("Turn over for more", no Done
button) with plain labels — Why it matters, Your reward, Earn achievement
after, Also counts toward, Milestone names, Card colour — plus archive and
delete. "Also counts toward" is search-first with a short scrolling list, so
it stays usable with many goals. Positions are measured from layout offsets,
which ignore the flip's rotation, so editing the back never skews the face's
leader lines. Three layouts:

- **List** (current pick) — grouped rows (For you · Progress · Connections &
  look) with icons; short facts edit in the value's spot, "why it matters",
  links and milestone names open full-width inside the same row.
- **Note** — write "why it matters" on the back of the card; the rest are
  fill-in sentences ("When I finish, I'll treat myself to ___").
- **Tiles** — compartments with live previews; one opens to fill the back.

Archive dims the card and offers Restore. Delete is a two-step confirm in place
(it is the only irreversible action). Milestones already done cannot be
renamed or removed; totals cannot drop below completed work.

## Card colour vs category (production follow-up)

In the lab, card colour is an override: "Match category" keeps the colour
following the category; any named colour (Stamp, Rust, Clay, Ochre, Moss,
Sage, Pine, Earth, Sky, Plum — never category names) sticks when the category
changes later (`colourFollowsCategory` / `categoryPatch`).

The database already stores `color` separately from `category`, but the app
couples them in the UI: `TempoGoalFields` and `GoalCreationFieldControls` set
`color: getCategorySwatchColor(value)` on every category change, overwriting
a chosen colour. Shipping the override means applying the same rule there
(follow the category only while the colour still equals the old category's
swatch) and adding the "Match category" choice to the colour picker. Also
check surfaces that derive goal colour from category rather than
`goal.color` (e.g. Gazetteer fills) so an override shows consistently.

## Open questions

- In Partner view, should the level shown be the partner's or always yours?
- Should editing live in the session popup (A) for everyone, with
  `/goals/:id` reusing the same component in a dialog?
- Is a locked interval acceptable, or is "change weekly → daily" worth an
  archive-and-recreate shortcut?
