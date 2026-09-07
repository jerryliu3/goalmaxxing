# Brand lock notes: Gazetteer and Col

Status: **leading visual lock is Gazetteer. Col is the preserved runner-up.**
Neither is production. `AppShell`, Geist, and live tokens stay as they are
until we explicitly implement a lock. Spatial Plan (B) stays the IA.

Date of this lock: 5 September 2026.
Clickable sources: `/ux/brand/gazetteer`, `/ux/brand/col`.
Applied UI kit (same atoms in both skins): `/ux/brand/kit-gazetteer`,
`/ux/brand/kit-col`.

This file exists so the decision is not trapped in a chat. The gallery at
`/ux/brand` keeps every earlier direction as archive.

---

## What we chose

| Decision | Choice | Not chosen |
|---|---|---|
| Vibe / page / color | **Gazetteer** (original serif mix) | Col is close second; keep building it as a parallel kit |
| Type on Gazetteer | **Newsreader** names, Source Sans 3 labels, IBM Plex Mono rise | Gazetteer Sans (Schibsted Grotesk) — not the look |
| Type on the Col kit | **Figtree** (the Col Sans *font* only) | Col Sans as a whole page restyle; original Col Newsreader chapter |
| Corners | **Soft paper** (~8–16px notebook) | Square (Folio 0-radius); Pills (full capsules) |
| Completion | **Nest** (inner square settles into an outer frame) | Rectangular stack is the runner-up |
| Completion rejects | — | Sleeve, seal, page-check, pass, compass, ribbon, inset, filled circles, Waypath path, Forge slash |

Sans-serif experiments at `/ux/brand/gazetteer-sans` and `/ux/brand/col-sans`
stay in the gallery as type studies. They are not the lock.

---

## Gazetteer — leading vibe

**Live page:** `/ux/brand/gazetteer`
**Parents:** Folio × Contour (round 2 mix 9)
**Job:** A surveyor’s place-name book. Every session is an index, a name, and
a rise. Folio’s ledger with Contour’s legend in the gutter.

### Type

- **Display / names:** Newsreader (serif). Italic on the remaining-count line
  and on the index numerals (`01`, `02`).
- **Labels / running heads:** Source Sans 3, small caps tracking
  (`GAZETTEER`, `WEEK 36`, column heads `NO. / PLACE / RISE`).
- **Rise / metres:** IBM Plex Mono (`+240 m`).
- Do **not** put Newsreader on every chrome label. That is Folio’s risk;
  Gazetteer already splits story vs apparatus.

### Color

| Token | Hex | Use |
|---|---|---|
| Page | `#F3EAD8` | Gallery / stage background |
| Paper | `#F8F1E3` | Phone canvas |
| Walnut ink | `#241C14` | Titles and body |
| Muted | `#7A6A56` / `#5C4E3F` | Meta, remaining line |
| Rule gold | `#D4C4A4` | Ledger hairlines |
| Stamp rust | `#9A4F2C` | Accent, numerals, completion, stamp |
| Gutter green | `#4A6740` | Rise column only — Contour pulled back to a statistic |

No sky-blue chips. No lavender cards. No electric Forge red. Green is a
*legend unit*, not a “done” color.

### Layout and motif

- Running head: `Gazetteer` left, `Week 36` right, hairline under.
- Display title: `Thursday` at ~2.5rem Newsreader, tight leading.
- Caption: italic Newsreader, `{n} names still unlogged.`
- Three-column ledger: index (italic rust), place (title + uppercase meta),
  rise (mono, right, green).
- Stamp specimen: `-rotate-6`, 2px rust border, `THU 3 SEP`, ~4px corners.
- Shape language: hairlines, almost no fill, **Soft paper** corners
  (~8–16px on chips, rows, cells, sheets). Not 0-radius Folio boxes. Not
  full consumer capsules. Nest is already a rounded vessel.

### Completion (lock)

**Primary — Nest.** Idle is an empty rounded frame. Done is a smaller filled
square nested inside it. Completing is *settling into*, not stacking on.

**Runner-up — rectangular stack (Gazetteer blaze).** Idle is one skewed
rectangle (trail blaze). Done stacks a second blaze above it. Keep this as a
toggle on the applied kit so we can still A/B it on pills, rows, and
heatmaps. Do not rebuild sleeve / seal / the rest.

### What Gazetteer is allowed to steal

- Folio: paper, stamp, ledger rules, dual type.
- Contour: gain as a first-class number, legend green only in the gutter.
- Not Dawn’s sky as the whole page. Not Waypath’s winding path. Not Forge.

### Risks to remember

- Newsreader on chrome makes it a costume journal. Keep Source Sans 3 on
  apparatus.
- Too many rust fills will turn Nest into a checkbox. The outer frame must
  stay a vessel.
- Literal hiking copy (`+m`, “names”) can over-promise outdoors. Metres are
  a visual unit of effort; they can become a quieter figure later.
- **Zero-radius boxes** were rejected. They read as newspaper / enterprise.
  Soft paper keeps the ledger hairlines without the 1998 browser corners.

---

## Col — runner-up (preserve in full)

**Live page:** `/ux/brand/col`
**Parents:** Folio × Dawn Ridge × Contour (round 2 mix 13)
**Job:** The pass between two peaks. A Folio chapter written on Dawn’s
parchment sky, with Contour’s gain as a quiet figure. The next ridge is
already in the page.

### Type (two layers — do not collapse)

**Original Col page (keep as the historical object):**

- Newsreader for `Thursday` and `Col 36`.
- Instrument Sans for chrome (`Col 7 of 10`, week strip, meta).
- IBM Plex Mono for gain.

**Col applied kit (what we build next in this skin):**

- **Figtree** for chapter and chrome — the Col Sans *font*, not the Col Sans
  page. The original Col color, ridges, and `Col 36` running head stay.
- IBM Plex Mono for gain.

The whole-page Col Sans restyle (`/ux/brand/col-sans`) was not preferred.
Figtree on Col’s existing furniture is the experiment we still want when
comparing kits.

### Color

| Token | Hex / recipe | Use |
|---|---|---|
| Stage | `#EFE8DC` | Gallery / stage |
| Sky | radial peach sun at 78% 10% over `#E7EEF2` → `#F4F1EA` → `#E8DFD2` | Phone canvas |
| Ink | `#2A241C` | Titles |
| Stamp rust | `#B5522A` | Running head, today in the week strip |
| Ridge | `#B7C4B8` at 28/40/55% opacity | Silhouette furniture, not a hero illustration |
| Lichen | `#6E8B74` | Done mark |
| Idle stone | `#C4A992` | Idle mark |
| Gain | walnut at ~70% | Mono effort |

### Layout and motif

- Running head: `Col {done} of {planned}` in rust uppercase.
- Display: `Thursday` large, then `{n} still between peaks.`
- Week strip: day letter + Newsreader (or Figtree in the kit) date; today in
  rust.
- Rows: mark, title, uppercase meta, mono effort. No three-column ledger.
- Ridges sit under the list as page furniture.

### Completion on Col

Same lock as Gazetteer for the applied kit: **Nest primary**, rectangular
**cairn stack** as the Col-flavored runner-up (two stacked stones — the
Waypath idea without the winding path). Original Col page may keep cairn as
the archive object.

### What Col is allowed to steal

- Folio: chapter voice, rust accent.
- Dawn: parchment sky, ridges as structure.
- Contour: gain figure.
- Not Waypath’s cartoon path. Not Forge. Not Gazetteer’s three-column index
  unless we are explicitly hybridizing later.

### Risks to remember

- Ridges plus a huge title can slide into “nice SaaS with a mountain.” Keep
  chrome thin.
- Figtree is modern; if it flattens the pass into a dashboard, revert the
  Col kit display to Newsreader and keep Figtree only on labels.
- Lichen-as-done must not become generic success green.

---

## Completion marks — keep / drop

| Mark | Verdict |
|---|---|
| **Nest** | **Lock.** Outer frame, inner square settles in. Synonym for completing. |
| **Rectangular stack** (blaze on Gazetteer, cairn on Col) | **Runner-up.** Keep as a kit toggle. |
| Sleeve (pencil in holder) | Drop |
| Seal (wax in a ring) | Drop |
| Page (checkmark on paper) | Drop |
| Pass, compass, ribbon, inset | Drop |
| Filled circle / checkbox | Already rejected |
| Waypath winding path | Already rejected |
| Forge red slash | Forge only |

---

## Corners — Soft paper (lock)

Zero-radius rectangles were a Folio ledger habit, not the Gazetteer vibe.
**Soft paper** is the lock: notebook corners on chips, work tiles, month
cells, heatmap nests, sheets, and buttons. Hairline lists stay. The stamp
stays slightly squarer (~4px) so it still reads as a stamp.

Square and Pills remain as a comparison toggle on the kits, same pattern as
Nest vs stack. They are not the direction.

| Step | Geometry | Verdict |
|---|---|---|
| Square | 0px, hairline grid, boxed chips | Dropped — newspaper / enterprise |
| **Soft paper** | ~8–16px notebook corners, still hairline lists | **Lock** |
| Pills | Capsule chips / range / work tiles, stacked cards | Too far — generic consumer app |

Live: `/ux/brand/kit-gazetteer` and `/ux/brand/kit-col` (Soft paper default).

---

## What this does not lock

- Production CSS tokens, Geist, or `AppShell`.
- Spatial Plan IA, week/month/day, Checklist as a peer.
- Whether metres stay in the UI or become a quieter effort figure.
- Native Expo.
- Community / You destinations until the applied kit has been seen.

---

## Next step (why a kit, not a full restyle of every concept)

The applied kit proved chips, planner pills, week/month, heatmaps, and
sheets in Gazetteer and Col+Figtree. Corners are now **Soft paper**. Nest is
the completion mark.

Next: restyle Spatial Home and Goal Ledger in Gazetteer + Soft paper + Nest
only. Do not clone every `/ux/concepts` destination into two skins yet.
Production `AppShell` stays until we explicitly implement.

Live: `/ux/brand/kit-gazetteer` and `/ux/brand/kit-col`.

---

## Additive exploration after this lock

On 6 September 2026, a separate Atmospheres round was added at `/ux/brand`
before the production restyle step. It explores nine complete visual worlds
from Swiss minimal through open water, cyberpunk, workshop, mountain, nature,
solar, and aviation.

That round does **not** revoke this historical decision. Gazetteer remains the
preserved leading lock and Col the runner-up until a new explicit selection is
made. See
[`brand-round-atmospheres.md`](./brand-round-atmospheres.md).

`/ux/brand/hue-contrast` is a later comparison sketch for a second selection
hue. It does not change this lock or production tokens.
