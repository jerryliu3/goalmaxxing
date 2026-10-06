# Profile & Growth IA study

Route: `/ux/profile` (index + concepts A–D). Uses the moderator-only UX lab
gate. Exploratory, not a product lock. Seeded data; nothing writes.

## Problem

Profile is not a tab: avatar → AccountMenu → "Profile settings" → `/settings`.
That page stacks an editable membership card, stats tiles, a "More stats" link
to the orphan `/insights/more`, the Goalmaxxing score chart and a year heatmap
above the settings rows. The public profile exists twice with different
content: `/user/[username]` (membership card, presence, current goals) and the
in-app `PublicProfileSheet` (XP card, medal shelf, stats). Neither has a bio,
pinned items, or a way to see yourself as a visitor. Achievements' "Goal
library" repeats Goals' Past goals.

Jerry wants Achievements content on the public profile without the profile
becoming a second copy of Achievements.

## Proposal: new map

| Tab | Holds |
| --- | --- |
| Agenda | Today, calendar, period check-in overlay (unchanged) |
| Goals | Current goals; Past goals (absorbs the Goal library) |
| Growth *(was Achievements, working name)* | Medals + personal records; progress tracker (from Goals); score (renamed); stats + heatmap (absorbs `/insights/more`) |
| Community | Feed, friends, club; other people's profiles open here |
| Avatar *(button, not a tab)* | Your public profile (a curated view of Growth) and Settings |

### Where each duplicate goes

| Surface | Today | Single new home |
| --- | --- | --- |
| Past goals | Goals · Past goals and Achievements · Goal library | Goals · Past |
| Goal library | Achievements (FolioShelf of the same data) | Removed, merged into Goals · Past |
| Progress tracker | Goals | Growth |
| Score | Settings presence chart, `/user` page | Growth (renamed) |
| Stats tiles | Settings, public sheet, orphan `/insights/more` | Growth · Stats |
| Year heatmap | Settings, `/user` page, public sheet | Growth · Stats |
| Medals | Achievements and the public sheet's medal shelf | Growth; the profile shows only pinned ones |
| Membership card | Settings (editable) and `/user` page | Public profile header, rendered once |
| Public profile | `/user` page and in-app sheet, different content | One `PublicProfileView`: full + compact |

## Core idea

The public profile is a **curated view of Growth**: identity (membership
card), a bio line (≤140), up to **3 pins** (medals, personal records, or
finished-goal plaques with their reward text), and the current goals you choose
to feature. Private goals can never be featured. It refers to Growth rather
than copying it, so your own avatar destination never re-renders your stats.

The prototype proves "rendered once": every concept uses the same
`PublicProfileView` (`viewer: owner | friend | public`, `variant: full |
compact`). Visitor filtering lives in the view and in `profileGoals`/`canSee`
in `model.ts`, so no concept can forget a check. Owner mode only layers
affordances on top (edit bio, section actions) and shows hidden/private goals
with a reason.

## Concepts

- **A · You = your public page** (`/ux/profile/owner-page`). Avatar opens your
  profile in owner mode: inline bio edit, "Edit showcase" drawer, "Choose
  goals". A "Preview as visitor" switch hides every affordance and private
  goal behind a "This is what others see" banner. A gear opens Settings in a
  side panel. A "See your Growth" link replaces stats.
- **B · Settings with a profile card** (`/ux/profile/settings-card`). Avatar
  still opens Settings; its top is a compact rendering of what visitors see
  (identity + pinned 3 + featured goals) with Preview (full visitor page in a
  sheet) and Edit showcase (bio, pins, goals). No stats on the page.
- **C · Pin from where it lives** (`/ux/profile/pin-from-growth`). Every medal
  and record in Growth, and every plaque in Goals · Past, has a "Show on
  profile" pin (3 max, counter, refusal message). The visitor page beside it
  renders only what is pinned. Avatar → View my profile · Settings · Sign out.
  Renamed from "Pin from Growth" because plaques live in Goals after the merge.
- **D · Audience per section** (`/ux/profile/audience`). A's owner page with an
  Everyone / Friends / Only me control per section and a "View as" switch
  (Me / A friend / Anyone).

## Score rename candidates

1. **Form** — "in form": recent, earned, recoverable; fits a chip (Form 72).
2. **Momentum** — moves with recent effort, decays gently; longer, common.
3. **Stride** — quiet, steady; less self-explanatory.

Avoid **Pace** (already a field on every grow-score point) and **Tempo** (the
goal card / creation family).

## Recommendation

A as the avatar destination, with C's pins on Growth and Past-goal objects as a
second entry point. Both write the same ordered three-item list. B is the
cheapest step if we want to keep `/settings` as the avatar target for now — its
compact card is the same view. Defer D until there is a friend graph; ship with
today's account-level `social_activity_visible` plus per-goal `is_private`.

## Open questions

- **Preview must not drift.** Preview has to call the same server loader as
  `/user/[username]` with `viewerUserId: null`, not the owner's id (the loader
  un-privates the subject for themselves). Today `/user/[username]` reads with
  the admin client, bypassing RLS, so visitor safety relies on loader filters
  (`isPrivateForViewer`, private-goal filtering). Prefer a hardened
  security-definer read (`search_path=''`) or an RLS-respecting view so the
  boundary sits in the database, then point page, sheet and preview at it.
- **Pins storage.** A `profile_showcase_pins` table (kind, ref id, position)
  with the max-3 invariant enforced in the database; revoked medals and deleted
  goals must drop off, and goals made private after pinning must be hidden.
- Does the membership card keep its three metrics (goals completed,
  activities, level) on the profile, or is level alone enough?
- Empty state: a new member has nothing to pin. Auto-pin the newest medal, or
  show empty slots that link to Growth (owner only)?
- Bio moderation and length; do we need report/hide for bios?
- Is "Growth" the final tab name, and does the heatmap stay only in Growth or
  become an optional pin?
- Community should open the same view (compact in a sheet, full at `/user`).
