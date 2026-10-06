# Medals study

Status: **Exploratory. Not a lock.** Production `/achievements` keeps
`MedalMark` / `SealMark` from `src/features/achievements/medals.tsx` until a
direction is chosen.

Clickable study: `/ux/medals` (index, leads with Round 3), Round 3 premium at
`/ux/medals/{machined,prism}`, Round 2 (flat) references at
`/ux/medals/{tile,token,mark}`.

## Round 3: premium

### Feedback

> The medal is a decent design but the material just doesn't look desirable
> or premium. It's very important it feels very, very premium. Use some of the
> premium card material designs as inspiration or directly.

### Why Round 2 felt cheap

- **Flat fills.** Tile and Token faces were one `color-mix` of a tint into
  `#fff7de`: beige card stock with a 1px hairline. The goal card beside them is
  anodized alloy with brushed grain, a polished inset rim, a moving shine band
  and lettering with real depth. Next to it, the medals read as paper cut-outs.
- **No light.** Nothing responded to the pointer or the pose; the card does.
  Premium objects are defined by how light moves across them.
- **No thickness.** A soft drop shadow, but no edge, no rim, no bevel — nothing
  that says the object has mass.
- **Printed type.** Numerals were filled text with a 0.7px offset “emboss”;
  the card's numerals are engraved/raised with a gradient fill.
- **Tiers as ink colour.** Bronze/copper/sage/gold/ink were hues, not
  materials, so a better rank looked like a different colour, not a better
  object.

### What changed

The Round 2 **forms are kept** (the proposed mix): Token disc for levels,
streaks and challenges; the goal Tile in card proportion; Mark's shield for
leaderboards and hexagon for team. Only the **surface** is rebuilt.

Each medal is layered like the card materials (`premium-medal.tsx`,
`premium.css`):

| Layer | Recipe | Borrowed from |
|---|---|---|
| Contact shadow | Two radial gradients, no filter | Reward objects' plinth shadow |
| Edge / thickness | The silhouette offset down (and sideways under tilt via `sin(--rx/--ry)`), metal side-wall gradient | Card solid body (`CardSolidBody`) idea |
| Polished rim | `conic-gradient` of hi/mid/lo metal + a 155° light/shade overlay; hero discs get 120 reeded ticks | Machined medallion in the objects view |
| Face | **turned**: concentric `repeating-radial-gradient` grain + bow-tie `conic-gradient` anisotropic light; **brushed**: the alloy card's `repeating-linear-gradient` grain + specular pool; **gem**: Sapphire Prism's deep gradient + caustic + edge-masked `repeating-conic-gradient` facets; **glass**: the production glass card; **foil**: Chromatic Foil's smoke face + spectral conic | `tempo-goal-creation.css`, `card-materials.module.css`, `category-materials.module.css` |
| Enamel (Machined) | Band between rim and centre: radial enamel + clear-coat gradient + two polished studs | Medallion's enamel ring, Ruby Cabochon lacquer |
| Bevel strokes | Light-to-shade gradient stroke on raised edges, reversed on cut walls | Card bevel insets |
| Numerals | Card numeral gradient; Machined **engraved** with the study's recessed relief filter, Prism **raised** foil with the raised filter; hero numerals carry a glint clipped to the glyphs | `LetteringFilters` (`ux-brand/card-materials/lettering-filters.tsx`), alloy/chromatic `strong` gradients |
| Shine band | The card's `--shine-angle/position/strength` band across everything | `.tempo-card[data-material="chromatic"]::after` |

Light is the card's: `LightStage` (`light-stage.tsx`) is `useCardPose` +
`pointerPose` + `cardOptics` — the same pipeline as the reward objects and the
pearl membership card's `MaterialStage`. One lamp per stage; every medal in it
reads `--light-x/y`, `--shine-*`, `--rx/--ry`. The hero medal also turns with
the pose (`data-tilt`). Reduced motion holds the flat pose; touch keeps the
resting light.

### The material ladder

Tiers read as materials, and every material is a card material.

| Level | Ladder | Machined | Prism | Borrowed from |
|---|---|---|---|---|
| 2 | Graphite | Anodized graphite, turned; pine enamel; numerals cut to bright metal | Smoked quartz, graphite bezel | Chromatic Foil's smoke metal, anodized like Alloy |
| 4 | Steel | Brushed steel; navy enamel; alloy card's numeral gradient | Clear crystal, steel bezel | Platinum Mirror / alloy grain |
| 6 | Sapphire | Platinum rim, ivory enamel ring, sapphire cabochon centre | Faceted sapphire, platinum bezel | Sapphire Prism |
| 8 | Gold | Turned gold anodizing; oxblood enamel | Champagne crystal, gold bezel | Foil Print champagne, Ruby Cabochon lacquer |
| 10 | Prism | Smoke metal, chromatic foil face and band | Dichroic crystal, mirror-platinum bezel | Chromatic Foil + Foil Print sheen |

System awards climb the same ladder (`AWARD_MATERIAL` in
`premium-materials.ts`): streaks 4/12/26/52 weeks = graphite/steel/sapphire/
gold; challenge completed = steel, won = gold; board top 10/top 3/first =
steel/gold/prism; team member = graphite, anchor = gold.

**Goal finishes skip the ladder and take their card's material**:
`resolveTempoCardMaterial(difficulty)` → glass / alloy / chromatic, mixed with
the goal colour by the same formulas as the production card
(`cardFinish()`). The side-by-side picker (Career · Alloy, Health · Glass,
Personal · Chromatic) shows alloy beside alloy, glass beside glass.

**Locked** medals are an unstruck blank: matte pewter, empty enamel groove,
outlined numeral, honest progress (streak segments, goal bar). No shine.

### Two constructions

| | M8 **Machined** | M9 **Prism** |
|---|---|---|
| Object | Metal medal: thick polished, reeded rim; enamel band; turned or brushed centre | Jewellery: thin polished bezel holding a crystal or foil face |
| Numerals | Engraved (recessed relief) | Raised foil (raised relief) |
| Streak | Enamel week segments in a recessed track | A channel of set stones: lit weeks foil, the rest hairlines |
| Goal tile | Card material inside a polished bezel with a category-enamel frame | Card material inside a fine bezel with the card's inset rule |
| Unlock | Struck into place → light sweep across the metal → one catch-light around the rim | Same beats; the sweep crosses the facets |

### Sizes

- **Hero / shelf (≥ 56px):** everything above.
- **Small (32–55px, the 44px slot):** metal gradient, linear rim, edge, enamel
  colour; no grain, facets, specular, sheen, or relief filter. Numeral is a
  solid 600-weight figure in the material's type colour.
- **Tiny (< 32px, the 20px slot):** a wider rim (so the silhouette reads), a
  face gradient, a bold numeral (goal finishes: a tick), a dark contour. No
  edge layer, no band.

### Pages

Each Round 3 page: a large interactive hero (280px, pointer tilt + light) on a
velvet spotlight stage with *Play unlock*; the ladder (materials named under
each rung); **shelves on graphite velvet and on paper** at 96/44/20px; the side
by side with the real `TempoGoalCard`; every family earned and locked.

### Decision

**Prism is the chosen direction** (Jerry, after reviewing both in the
browser): crystal faces in a fine metal bezel across the ladder and every
family, with goal-finish medals taking their card's own material. Machined
stays in the study as the reference it was compared against. Watch on dark
paper that a full shelf of dark stones doesn't get heavy.

### Performance notes

- Material is CSS gradients on masked spans, not SVG filters. Masks are data
  URI SVGs of the same paths, encoded once per shape (`shapeMask` cache) and
  rasterized per size.
- One relief filter per numeral at ≥ 56px only; the moving glint (which forces
  the filter to re-run as light moves) is **hero only**. Shelves re-paint only
  cheap gradient layers when the lamp moves.
- `LightStage` runs one short-lived rAF loop per stage (`useCardPose`), only
  while the pose is settling; nothing animates at rest.
- No `backdrop-filter` (the glass card's blur is replaced by an opaque
  milky gradient), no blend modes, no per-medal `filter: drop-shadow`.
- `sin()` in `calc()` drives the hero edge under tilt; where unsupported the
  edge simply sits behind the rim.
- Device check before shipping a long shelf (30+ medals) on low-end Android.

### Open questions (Round 3)

1. Machined as the system, Prism for the top rungs only — or keep them as
   two whole systems?
2. Should the ladder have five materials, or should levels past 10 repeat the
   capstone with a count?
3. Does every goal finish deserve the full card material, or only hard goals
   (chromatic), with others in steel?

---

# Round 2 (flat) — kept as references

## Why this pass exists

The Showcase surface shipped, but the medal itself still reads like a generic
game badge: a radial-gradient metal disc on a ribbon, a mono number in the
middle, hard-coded hexes per tier, and a grey disc with “—” when locked.

Round 1 asked what a medal would look like if it were made in the same print
shop as the goal plaque, and tried four objects: Postmark, Letterpress seal,
Enamel pin, Engraved coin.

## Round 1 feedback

Round 1 (Postmark, Letterpress seal, Enamel pin, Engraved coin) is removed
from the study; see git history. Jerry liked **Letterpress seal** most, then
**Enamel pin**, and asked for:

- medals that look more **modern and minimalistic**;
- medals that read as siblings of the **goal card** (`TempoGoalCard`) — same
  theme, same design language;
- the option of a **mix of designs**: challenges, streaks, and goal finishes
  need not share one form.

## Round 2: what “sibling of the card” means

Read off `TempoGoalCard` and `tempo-goal-creation.css`:

| Card anatomy | How the medals use it |
|---|---|
| Rounded face, `color-mix(category 24%, #fff7de)` | Physical medals (Tile, Token) use the same tint formula on the same face colour. |
| Category colour as the one hero colour | Goal finishes take the goal’s category colour. Every other family takes one tier/family ink. One accent per medal. |
| Big light numeral, tight tracking, tabular | Every system leads with the numeral (`Numeral` in `modern-kit.tsx`). Earned numerals get a faint solid-lettering lift. |
| Two-line unit beside the numeral (“completions / in total”) | Tile and the goal-finish faces repeat it (“weeks / on plan”). |
| Mono small caps overline, fixed bottom corners | Overlines (“ACHIEVED”, “STREAK”), category bottom-left, date bottom-right. |
| Effort bars (1–3 stepped bars) | Tile levels reuse them as a five-step rank meter. |
| Inset rule (alloy / chromatic materials) | Hero-size Tile and Mark faces carry one inset hairline. |
| Physical object: stays light on a dark page | Tile and Token keep the card’s face in dark mode; locked states and Mark follow the page theme. |

Type roles stay Gazetteer: Source Sans 3 for numerals and titles, IBM Plex
Mono for captions, Newsreader italic for reward text.

## The three systems

Each system is one material and one numeral, with a different **form per
family**. Families: Levels (Lv 2/4/6/8/10), Goal finishes, Streaks
(4/12/26/52 weeks), Challenges (completed/won), Leaderboards (top 10/top 3/
first), Team.

| | M5 **Tile** | M6 **Token** | M7 **Mark** |
|---|---|---|---|
| Idea | Every medal is a miniature of the goal card | The seal, modernised: card-stock disc + one hairline ring | Typographic marks: numeral, rule, mono label, simple shape |
| Ranks | Starter · Regular · Steady · Seasoned · Keystone | Footing · Stride · Pace · Rhythm · Tempo | Outline · Draft · Plan · Proof · Edition |
| Levels | Square tile, effort bars as rank meter | Plain disc | Circle |
| Goal finishes | Card-proportion tile (330:382) with numeral, title, **reward**, category, date | Disc with a solid category band | Card outline in category ink |
| Streaks | Wide strip, four milestone pips | Ring of week segments that fills like progress | Pill, horizontal lockup |
| Challenges | Ticket with perforated stub; stub inked when won | Punched-notch disc; solid when won | Diamond; outer keyline when won |
| Leaderboards | Podium silhouette; top block inked for first | Octagon; solid for first | Chevron shield; keyline for first |
| Team | Two stacked tiles | Double ring | Hexagon |
| Locked | Die line: hairline outline + outlined numeral; progress as a hairline | Debossed into the page, no ink; streak/goal rings show honest progress | Outline only, shape and numeral as one line |
| Unlock | Tile is set down, inset rule draws | Ring (or week segments) draws, numeral rises | Ink fills the shape from the baseline up |
| 20px | Solid accent tile, paper numeral; proportion is the family cue | Solid disc; the edge is the family cue | Solid shape; logo-like |
| Dark paper | Physical: keeps the card face, like the card | Physical: keeps the card face | Ink follows the theme like type |

All motion collapses to the final frame under `prefers-reduced-motion`.
Sizes shown: 160/240 hero, 72 and 44 shelf, 20 inline.

### Side by side with the card

The index and each Round 2 page render the **real** `TempoGoalCard` next to
the goal-finish medal for the same goal, a level medal, and a streak medal,
plus the trio at 20px next to a name. A goal picker swaps category colour and
card material (glass / alloy / chromatic foil) so the pairing can be judged
against each.

## Mix per family

The families matrix on the index shows the form each system uses per family,
and a **proposed mix** row:

| Family | Proposed form | Why |
|---|---|---|
| Levels | Token disc | Closest to the favourite (Seal) while flat; strongest 20px silhouette after Mark. |
| Goal finishes | Tile (card proportion) | A finished goal *is* the card, kept. It is the only family that carries a title and reward, and the card already solved that layout. |
| Streaks | Token segmented ring | A run of weeks wants to be a ring that fills; the locked state shows honest progress for free. |
| Challenges | Token notched disc | Same object as levels, distinct edge; “won” as a solid token. |
| Leaderboards | Mark chevron shield | Social and weekly: shown inline next to names, so it should be type, not an object. |
| Team | Mark hexagon | Same reasoning; the hexagon reads as “group” at 16px. |

The principle behind the mix: **things you keep are objects; standings about
other people are type.** Personal awards (levels, goals, streaks, challenges)
are physical card stock; social ones (boards, team) are ink marks.

Criteria per family are unchanged from Round 1 (see index table), now with a
“Form by system” column.

## Round 2 recommendation (superseded by Round 3)

**Token leads as the system**, with **goal finishes drawn as Tiles**. Token is
the seal Jerry liked with the ornament removed — the pressed-in locked state
survives, the scallops, foil, and arc text do not — and its segmented ring is
the best streak form in the study. Goal finishes break from Token because they
should look like the card they came from.

**Mark** is the fallback for 16–20px social rows if Token’s edges blur on
device, and the proposed form for leaderboards and team.

**Tile** as a whole system is the most literal sibling of the card, but a
shelf of tiles risks reading as a shelf of cards; keep it for goal finishes.

## Round 2 open questions

1. Is “objects for personal, type for social” the right split, or should every
   family stay inside one system?
2. Should goal-finish medals follow the card’s material (glass / alloy /
   chromatic by difficulty), or stay one neutral stock with the category tint?
3. Does the reward text belong on the medal face (Tile does this at hero size),
   or only in the detail view?
4. Rank names: one set across the product, and are they plain words (Token)
   or print-shop stages (Mark)?
5. The card uses Avenir Next today; the medals use Source Sans 3 (Gazetteer).
   Should the card move to Gazetteer type when medals ship next to it?
6. Leaderboard and team marks are social: who can see them, and do they
   appear inline next to names in Community by default?

## Code

- `src/features/ux-medals/model.ts` — directions (round, forms per family),
  rank names, rungs, families, theme variables.
- `src/features/ux-medals/awards.ts` — awards per family (earned and locked),
  goal seeds shared with `TempoGoalCard` (including their card material),
  proposed mix.
- Round 3: `premium-materials.ts` (ladder, card finishes, award → material,
  `finishVars`), `premium-forms.ts` (`path(k)` geometry, detail levels, mask
  cache), `premium-medal.tsx` (layer engine, engraved numerals),
  `premium-marks.tsx` (families), `premium-page.tsx` (hero, shelves),
  `light-stage.tsx`, `premium.css`.
- Round 2: `{tile,token,mark}-marks.tsx`, `modern-kit.tsx`.
- Shared: `pairing.tsx` (card side-by-side), `system-families.tsx`,
  `medals-index.tsx`, `direction-page.tsx`, `size-ladder.tsx`, `chrome.tsx`,
  `medals.css`.
- Do not import `src/features/ux-medals/*` into production; reimplement the
  chosen system in `src/features/achievements/`.
