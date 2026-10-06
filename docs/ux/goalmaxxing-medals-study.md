# Medals study

Status: **Exploratory. Not a lock.** Production `/achievements` keeps
`MedalMark` / `SealMark` from `src/features/achievements/medals.tsx` until a
direction is chosen.

Clickable study: `/ux/medals` (index) and `/ux/medals/{postmark,seal,enamel,coin}`

## Why this pass exists

The Showcase surface shipped, but the medal itself still reads like a generic
game badge: a radial-gradient metal disc on a ribbon, a mono number in the
middle, hard-coded hexes per tier, and a grey disc with “—” when locked. Every
other revamped surface is flat, printed, and paper-first (Gazetteer, the goal
plaque). The medal is the one object that looks rendered rather than made.

This study asks: **what would a medal look like if it were made in the same
print shop as the goal plaque?** And: does it survive at 20px next to a name?

## Constraints every direction meets

- Same data as production: five level awards (2 / 4 / 6 / 8 / 10), level 8
  earned at 2,840 XP, level 10 still ahead. XP thresholds come from
  `minTotalXpForLevel`.
- **Named ranks**, not bare numbers. The level stays on the mark as a numeral.
- An honest locked state that still looks good — drawn, not hidden; never a
  grey disc.
- An earned moment you can replay (CSS/SVG; collapses to the final frame under
  `prefers-reduced-motion`).
- Detail view: selecting a medal shows its name, tier, date, and what it took
  (or takes).
- Three sizes: hero (160–240px), shelf (72px), inline (20px). Each mark has an
  explicit level-of-detail switch so text and texture drop out before they
  turn to mush.
- Light and dark paper from Gazetteer tokens (`gazetteerDarkTheme`), scoped as
  `--md-*` variables. Ink-on-paper directions lighten their ink in dark mode;
  physical objects (enamel, foil) keep their colour.

## Directions

| # | Name | Object | Ranks (Lv 2 → 10) | Locked | Earned moment |
|---|---|---|---|---|---|
| M1 | **Postmark** | Inked cancellation stamp on a passport page | Trailhead · Waystation · Crossing · High Pass · Far Shore | Pencil guide: sketched ring, italic name, registration ticks | Stamp strikes, overshoots, settles; impact ring |
| M2 | **Letterpress seal** | Scalloped society seal with foil rim and guilloché field | Wayfarer · Pathfinder · Surveyor · Cartographer · Fellow | Blind emboss — the full seal in relief, uninked | Ink rolls across the bite; one glint on the foil |
| M3 | **Enamel pin** | Cloisonné trail pin on a felt board, plated by tier | Campfire · Compass · Ridgeline · Lighthouse · North Star | The stamped metal blank: every cell drawn, none filled | Enamel floods cell by cell; glaze catches light |
| M4 | **Engraved coin** | Line-engraved medallion: reeded edge, beads, laurel, hatch | Furlong · Mile · League · Degree · Meridian (denominations) | Graphite rubbing of the die, “not yet minted” | Coin spins in edge-on and lands face up |

Tier is carried differently in each: rank ink (M1), disc ink under a constant
foil (M2), plating metal (M3), line and face tint (M4). The study proposes
**ink** as the capstone tier for level 10; production `awardTierForLevel`
currently maps 10 to gold.

### Small sizes

| # | 20px rendering |
|---|---|
| M1 | Heavy ring + numeral; dashed pencil ring when locked |
| M2 | Scalloped foil edge + inked disc + numeral; strongest silhouette |
| M3 | Enamel field, plating ring, one emblem cell |
| M4 | Reeded ring + Arabic numeral (Roman only from shelf size up) |

## Future families (scoping only)

Each direction sketches one example mark per family on the index. The point is
to test whether a direction can extend without a new visual system.

| Family | Earns when | Tiers | Guardrail |
|---|---|---|---|
| Challenges | Completed every session of a challenge inside its window; “won” adds a winner variant | Completed · Won | One mark per challenge instance; leaving early earns nothing, loses nothing |
| Leaderboards | Finished a weekly board top 10, top 3, or first | Top 10 · Top 3 · 1st | Only boards with ≥ 8 active members award; repeats stack as a count |
| Streaks | Hit the weekly plan N weeks running: 4, 12, 26, 52 | 4 · 12 · 26 · 52 weeks | Weeks, not days; Recover weeks keep the run; a break never revokes |
| Goal finishes | A goal marked achieved; mark carries title, date, reward | One per goal | Colour follows category, not tier |
| Team | Club goal finished together, for members who logged ≥ 1 session | Member · Anchor | No ranking inside the team mark |

How each direction extends: M1 changes the **handstamp shape** (boxed,
oval, weekly-tick ring, “ACHIEVED” registry stamp, hexagon); M2 changes the
**edge** (serrated, rosette tails, 12-lobe, fine scallop, hex star); M3 changes
the **die-cut silhouette** (shield, disc, tile, mountain, twin circles); M4
keeps the coin and changes **legend + emblem**.

## Recommendation

**Postmark (M1) leads.** It is the atlas metaphor made literal (“stamps
collected on your journey”), it reuses the brand’s own name for its identity
colour (stamp rust), its locked state is the most honest (a pencil guide is
literally a plan), and it extends to every family by changing the handstamp —
no new illustrations.

**Letterpress seal (M2) is the runner-up** and the best at 20px. If Postmark’s
ink texture reads as messy on device, the seal’s blind-emboss locked state is
the idea worth keeping.

Enamel (M3) is the most delightful and the most expensive: every new level or
family needs a drawn scene. Coin (M4) is handsome but nudges toward
rewards-as-money.

## Open questions

1. Rank names: one set across the product (e.g. M2’s society ranks) or a set
   per family? Do names replace “Level 8 unlocked” in toasts and the profile?
2. Do we keep levels above 10 on the same ladder (12 / 15 / 20 in the older
   study seed), and what are they called?
3. Is per-rung tilt and ink texture acceptable in production, or should
   Postmark render flat (no SVG filters) for performance on low-end Android?
4. Does the Showcase dark vault adopt the medal’s dark-paper variant, or does
   the medal render on paper inside the vault?
5. Leaderboard and team marks are social: who can see them, and do they
   appear inline next to names in Community by default?

## Code

- `src/features/ux-medals/model.ts` — directions, rank names, rungs, families,
  theme variables.
- `src/features/ux-medals/{postmark,seal,enamel,coin}-marks.tsx` — pure SVG
  marks per direction (level + family), with `svg-geometry.ts` and
  `mark-kit.tsx` as shared geometry.
- `src/features/ux-medals/medals-index.tsx`, `direction-page.tsx`,
  `size-ladder.tsx`, `chrome.tsx`, `medals.css`.
- Do not import `src/features/ux-medals/*` into production; reimplement the
  chosen direction in `src/features/achievements/`.
