# Profile & Growth IA study

Route: `/ux/profile` (index + concepts A–E). Uses the moderator-only UX lab
gate. Exploratory, not a product lock. Seeded data; nothing writes.

**Leading direction: E · Your profile, in Settings**
(`/ux/profile/settings-preview`). A–D stay as references.

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
| Avatar *(button, not a tab)* | Settings, topped by your full public profile (a curated view of Growth); Edit profile edits that same box in place |

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
affordances on top (edit bio, tappable pin slots, section actions, the
membership card's editor mode). Owners never get extra goal rows: private and
unfeatured goals simply do not appear on the profile; the featured-goals
chooser is the one place every current goal is listed. The full view carries
the public URL (`goalmaxxing.xyz/user/mayaruns`, built from production's
`buildPublicProfilePath`; Copy for the owner) and renders current goals as
full goal cards; the compact view (B only) renders them as mini cards.

### Membership card: read-only vs editor

No fork. `ProfileMembershipCard` (`src/features/social/profile-membership-card.tsx`)
already has both faces, switched by its optional `editor` prop:

- **No `editor`** → the clean read-only card. Handle, name and portrait are
  plain text/image; no underlines. This is what visitors and E's view mode get.
- **`editor` passed** → each field becomes an `InlineField` button with the
  underline "line" (`.quiet` border-bottom), tap to type; the portrait opens
  the Upload / Remove photo dialog; the owner's email shows. E passes
  `canSave: false` so the card's own SAVE is hidden and the box's Done owns
  committing. `PublicProfileView` forwards it as `owner.cardEditor`, so it
  only applies when `viewer === "owner"`.

### Current goals reuse the Goals page

Current goals are not words any more; they follow the Goals page exactly.

- **Selection and order:** `selectCurrentGoals` (`src/lib/goals/current-goals.ts`),
  the function behind the Goals page (`goals-destination.tsx` →
  `GoalLibraryPage` → `buildCurrentGoals` in
  `src/features/insights/folio/folio-model.ts`) and the `/user/[username]`
  loader (`serializeCurrentGoals` in `src/lib/social/public-profile.ts`). Owned,
  not deleted, not placement-terminal; upcoming last, then start date, then id.
  `model.ts#currentGoals` calls it with `publicOnly` for every viewer but the
  owner, so private goals never reach a visitor. The "featured" choice is a
  prototype layer on top (visitors see featured ∩ public).
- **Card:** `GoalProgressCard` (`src/features/goals/goal-progress-card.tsx`,
  `gallery` mode → `TempoGoalCard`), the leaf that `CurrentGoalGrid`
  (`src/features/insights/folio/current-goal-grid.tsx`) renders per goal. Seeds
  are real `Goal` + `ProgressContextSummary` rows (`seed.ts`), including a
  finished goal (dropped) and an upcoming one (sorted last).
- **Why not `CurrentGoalGrid` itself:** it is pure, but its columns are
  viewport breakpoints (up to 6-up at 1400px) with 2.5rem padding, sized for
  the full-width Goals page. Inside a settings card or dialog that shrinks
  cards to ~100px. The study uses the same card in a container-query grid
  (2–3 up full, 3-up mini). Production should give `CurrentGoalGrid` a
  container-sized mode rather than fork it.

## Concepts

- **E · Your profile, in Settings — leading** (`/ux/profile/settings-preview`).
  B's placement with A's edit-in-place, and no dialog:
  - *Settings page.* Avatar → Settings. Its first box **is** the public
    profile: the same `PublicProfileView` a visitor gets (`viewer: public`),
    not a compact summary. The 3D membership card sits at the top, read-only
    and without field lines; then the link line
    `goalmaxxing.xyz/user/mayaruns` with **Copy link**; then About, Showcase,
    and featured current goals as full goal cards. The box's header reads
    "Your Goalmaxxing profile" with **Edit profile** on the right, above the
    card. No stats. Settings rows follow.
  - *Edit in place.* Edit profile switches the same box to `viewer: owner`.
    A sticky bar replaces the header: "Editing — changes are visible to
    everyone when you press Done", with **Cancel** and **Done**. The card
    switches to production's editor face (underlined name and handle, photo
    dialog; the link follows the handle live), the bio gets inline edit,
    every pin slot is a button that opens the showcase picker (bottom
    sheet), and "Choose goals" opens the featured-goals chooser (bottom
    sheet), which lists every current goal with private ones locked. Done
    keeps the edits (disabled while the handle is invalid); Cancel restores
    the snapshot taken when editing began (`use-profile-edit-session.ts`).
  - *How it combines A and B.* From B: Settings stays the avatar target with
    the profile on top and no stats. From A: the page you see is the page
    you edit. Dropped: B's compact card, Preview sheet and side-panel form,
    the earlier Preview & edit dialog with its Visitor view / Edit switch,
    and the owner-only "Only you see these" goal list.
- **A · You = your public page** (`/ux/profile/owner-page`). Avatar opens your
  profile in owner mode: inline bio edit, "Edit showcase" drawer, "Choose
  goals". A "Preview as visitor" switch hides every affordance and private
  goal behind a "This is what others see" banner. A gear opens Settings in a
  side panel. A "See your Growth" link replaces stats.
- **B · Settings with a profile card** (`/ux/profile/settings-card`). Avatar
  still opens Settings; its top is a compact rendering of what visitors see
  (identity + pinned 3 + featured goals) with Preview (full visitor page in a
  sheet) and Edit showcase (a side panel form: bio, pins, goals). No stats on
  the page. Its featured goals render as mini goal cards.
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

E. Keep `/settings` as the avatar target, render the full public profile as
its first box, and make Edit profile on that box the only place the public
page is edited. C's
pins on Growth and Past-goal objects can be a second entry point later; they
write the same ordered three-item list. Defer D until there is a friend
graph; ship with today's account-level `social_activity_visible` plus
per-goal `is_private`.

## Production (October 2026)

E shipped. `PublicProfileView` (`src/features/social/public-profile/`) is the
one render for `/user/[username]` (full), the Community profile sheet
(compact), and the Settings box (full, edit in place).

- Storage: `profiles.bio` (≤140), `profile_showcase_pins` (≤3, slot order),
  and `goals.featured_on_profile` (default true), written only through
  `update_public_profile`.
- The loader still owns visitor safety. Visitors get public, featured goals
  and resolved pins only. The owner also gets private and unfeatured goals
  (flagged) and the pin catalog, and the view drops private goals again before
  rendering.
- The membership card shows no computed stats. Settings has no score, stats
  or heatmap; those stay on Growth.
- Done saves the identity row first (a taken username fails there and the
  box stays in edit mode), then bio, pins and featured goals in one RPC.
- The account email never appears on the profile, including the owner's
  editor.

Follow-up (October 2026): the bio and pinned records moved onto the
membership card. The card's metric row shows up to three pinned records
(the owner taps the row to choose them) and the bio sits under the name
with inline edit; there is no separate About section. The Showcase keeps up
to three medals or finished goals. `profile_showcase_pins` now holds six
slots, and `update_public_profile` caps records and showcase pins at three
each. Until that save, `profile_card_configured` stays false and the loader
fills a default description, up to three records, and up to three showcase
pins (a medal and a finished goal when the owner has them). Clearing the
bio or the pins and saving keeps the card empty.

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
- **Featured goals vs. all public goals.** Production `/user` shows every
  public current goal. E adds an owner choice of which ones to feature. Is
  that worth a column (`featured_on_profile`) or is `is_private` enough, with
  the profile showing all public current goals?
- **Settings length.** The full profile pushes the settings rows below the
  fold, most on phones. Is that the right cost for "the page you see is the
  page you edit", or should the box collapse after the first visit?
- **Identity save path.** Production's card saves username / name with its own
  SAVE (`canSave`). E folds that into Done with bio, pins and goals; one
  request or two, and how does a taken username fail inside the box?
