# Goalmaxxing Application Visual Language Directions

Status: **Gazetteer is the leading visual lock. Col is the runner-up.**
Neither is production. Production `AppShell`, tokens, and Geist remain
unchanged. Decision notes: [`brand-lock-gazetteer-col.md`](./brand-lock-gazetteer-col.md).
Clickable restyles live at `/ux/brand`. Information architecture stays Spatial
Plan (B); see
[`goalmaxxing-application-design-guide.md`](./goalmaxxing-application-design-guide.md).

This pass answers a different question than the UX review. That review locked
*where* things live. This one asks *what the surfaces should feel like* —
type, color, motif, and how those feelings get into components — so the
authenticated product can match the landing page’s craft without copying
cinematic marketing scroll into `/calendar`.

---

## Why this pass exists

The experience guide is an 8/10 case study for the public website. The
authenticated app is closer to 5/10 on branding. The gap is not “add the
landing mountain as wallpaper.” It is that the live product still reads as a
cool-lavender SaaS dashboard: Geist, `ring-1` cards, blue/sky chips, XP in
the header. That language does not say *progress, journey, adventure, or
ascent*. It says *settings panel*.

The landing already knows a stronger feeling. The wow chapter’s parchment
sky, ridge stack, and climb trail (`landing-wow-mountain.tsx`) are the most
emotional object in the company. Dawn Ridge exists to ask: what if that
energy were the *product’s* visual system, not a marketing scene?

One screenshot — a dark, high-contrast serif word sitting behind a figure —
is allowed as **one** pole (Forge). The other four directions were researched
from different consumer apps on purpose so we do not collapse every option
into “premium dark athletic.”

---

## What “feeling” means when we are not redesigning UX

We are not debating tabs, gestures, or whether Home is a week. Those are
locked or still open *inside B*. Visual language still has to do narrative
work, or it is just a theme switcher.

The test for each direction: **could a person screenshot one component and
know the emotion without reading the marketing site?**

| Emotion | Visual job |
|---|---|
| Progress toward goals | Make *how far* glanceable in the first viewport. Not XP chrome. |
| Completing a journey | Treat a week or a goal as a trace, chapter, or cairn — something that *accumulates*. |
| Embarking on an adventure | Show a next stone / next page / next ridge, not a form. |
| Climbing toward dreams | Encode ascent: elevation, horizon, behind-type climb, stacked stones. |

If a direction only changes hex values on the existing card atom, it failed.

---

## Research: how praised consumer apps encode these emotions

Apps change. Steal the **design decision**, not a 2026 screenshot. This
synthesis is complementary to the UX guide’s steal/reject tables, which were
about interaction. Here the unit is *brand geometry*.

### Progress as a trace you can point to

**Strava** makes the orange polyline the headline of the product. Chrome is
neutral so the route can be chromatic. Stats use tabular/monospaced digits.
The feeling of progress is *the line got longer*, not a badge.

**AllTrails** uses topographic-map paper (`#F2F4F1`), forest green
(`#428000`), and a three-step difficulty scale. The expressive moment is the
route *drawing itself* onto the map, plus an elevation profile under the
stats. It feels like a field guide you could take outside, not a lifestyle
magazine.

**Komoot** and **Relive** extend the same idea: the map is the object; photos
and elevation are evidence; sheets keep you oriented on the trace.

**Steal:** one signature trace; paper or map as canvas; gain as a first-class
number. **Reject:** becoming a GPS app; Strava orange as our identity.

### Progress as a path of nodes

**Duolingo** proved that a sequential path makes “where am I on a long goal”
legible to tens of millions of people. Units, nodes, and a drawn route
turned a skill tree into a journey. The 2024 path-delight work added
segmented rings and celebration *at the node*, not only at the streak.

**Reject almost all of the skin:** owl green, chunky 3D buttons, guilt
streaks, chests. Goalmaxxing already forbids streak-punishment ethics. The
usable idea is *geometry*: a visible next landing, not a grid of settings.

**Monument Valley** and **Alto’s Odyssey** (games, but consumer-famous) do
the same job without cartoon UI: stacked stones, dusk palettes, the next
platform obvious. Waypath takes that pole instead of the owl.

### Progress as a glance, then a list

**Apple Fitness** opens on rings. Detail waits. **Flighty** (Apple Design
Award) packs, wraps, and colors data until status does not need
interpretation — airport-board type, monospaced times, “boringly obvious.”
**Copilot Money** treats a 100px+ number as architecture on a dark canvas,
then candy-colored categories as the only noise.

**Steal:** one number that orients; type scale as confidence; color for
status, not decoration. **Reject:** Flighty’s 15 travel states; Copilot’s
finance-game neon as a default for *all* five directions.

### Journey as a book or a magazine

**Polarsteps** is a travel journal that Apple has cited for restraint: native
chrome, a distinctive map-and-memory identity, trips that become bound
books. The emotion is *I can hold the journey*.

**Letterboxd** splits a neo-grotesque (Graphik) for UI from a literary serif
(Tiempos) for editorial moments, with one acid-green accent. It feels like a
cinema lobby and a magazine at once.

**Day One / StoryGraph** treat dates as entries with running heads, not
calendar cells.

**Steal:** dual type (story vs apparatus); paper; chapter numerals; stamps.
**Reject:** Letterboxd’s near-black cinema lobby as a second Forge; becoming
a writing app.

### Ascent as cinematic performance

**Peloton** is almost achromatic charcoal and white, with one red reserved
for action and brand. Photography and contrast do the emotion. **Nike SNKRS**
and **MasterClass** use dark fields and large type so a drop or a lesson
feels like an event. **Whoop** is instrument-dark, one recovery number.

The included reel (giant red serif behind a figure, rim light, turtleneck,
basketball) sits in this family: luxury sport, not friendly productivity.
That is Forge, and **only** Forge.

**Steal:** one accent; display type as an object in the layout, not a heading
style; completion as a mark with attitude. **Reject:** putting this skin on
Recover, Duo, or empty states that need gentleness.

### Ascent as horizon and air (the landing we already have)

The Goalmaxxing landing does not shout. It uses parchment/sky gradients,
layered ridges, and a climb trail with a moving marker. Typography is calm
and large. Motion explains a climb. That is closer to **Apple marketing
pacing** and **Flighty clarity** than to Peloton.

Dawn Ridge exists so we do not throw that 8/10 away because “apps cannot look
like marketing.” They can look like the *feeling* — sky, ridge, one remaining
count — while chrome recedes the way Photos and Weather do.

### What we are not stealing

- **Linear / Vercel marketing dark mode** as the app’s identity. The UX
  review already rejected developer-tool branding.
- **Geist + lavender cards** as “done.” That is the 5/10.
- **Headspace blobs and mascots** as the whole brand.
- **Duolingo streak economy.**
- **Cinematic scroll, bento, hero loops** inside authenticated routes.

---

## Five directions

Prototypes restyle the **same Thursday** (Tempo run, Launch notes, Weekly
reset, Deep work done; Maya finished Yoga). Interaction is only enough to
inspect a completion state. Do not read them as new IA.

### 1. Forge — elite performance

`/ux/brand/forge`

- **Refs:** Peloton, SNKRS, Whoop, MasterClass; the supplied reel.
- **Type:** Playfair Display SC (behind-word), Playfair Display (titles),
  DM Sans (chrome).
- **Color:** `#070708` charcoal, `#F6F1EA` ivory, `#E31C25` electric red.
  Green is banned so completion cannot fall back to “task app.”
- **Shape:** tight radius, hairlines, no floating cards.
- **How the feeling enters the UI:** the word `ASCENT` sits *behind* the day’s
  work. Completing cuts a red slash. Weekly progress is a rising red column.
  The date strip is a scoreboard, not a chip row.

**Risk:** intimidating on Recover, Duo, and empty states. If we pick Forge,
those surfaces need a quieter register of the same system (ivory type, no
red behind-word), not a second theme.

### 2. Contour — field guide

`/ux/brand/contour`

- **Refs:** AllTrails, Komoot, Relive, Strava’s *trace* (not its orange).
- **Type:** IBM Plex Sans; IBM Plex Mono for metres and dates.
- **Color:** topo paper `#F2F4F1`, forest `#3D6B2F`, strain `#C77700`,
  miss `#B3261E`.
- **Shape:** trail-card radii, contour ellipses as canvas.
- **How the feeling enters the UI:** the week *is* an elevation profile.
  Today is a marker on the ridge. Each row carries a gain (`+240 m`) as
  effort, not gamified XP. A miss is a gap in the polyline.

**Risk:** literal hiking metaphor may over-promise outdoor identity for a
product that also holds career tasks. Keep metres as a *visual unit of
effort*, or drop the unit and keep only the profile shape.

### 3. Folio — journey journal

`/ux/brand/folio`

- **Refs:** Polarsteps, Letterboxd’s type split, Day One.
- **Type:** Newsreader for the story; Source Sans 3 for running heads.
- **Color:** cream `#EFE6D6`, walnut `#241C14`, stamp `#B5522A`, rule
  `#C8B79A`.
- **Shape:** hairline ledger rules, stamped dates, chapter numerals, almost
  no fill.
- **How the feeling enters the UI:** Thursday is a *page* with a running
  head (`Week 36`). Rows are numbered entries. Completion is a struck line
  in stamp ink, like marking a journal.

**Risk:** can feel antique or slow if Newsreader is used on every label.
Keep the grotesk for chrome; serif only for the day’s title and row names.

### 4. Dawn Ridge — landing energy, in the app

`/ux/brand/dawn`

- **Refs:** Goalmaxxing landing mountain, Flighty, Copilot’s monumental
  number (in *light*), Apple Fitness glance.
- **Type:** Instrument Sans only. Numbers do the drama. No serif.
- **Color:** sky `#E7EEF2`, parchment `#F4F1EA`, sun `#F7ECD6`, action
  `#1D4ED8` (landing blue, on purpose).
- **Shape:** large remaining count, soft day pills, ridges under the list.
- **How the feeling enters the UI:** the first glyph is `3` (left today).
  Ridges are structural, not a PNG behind a card. Completion fills a pale
  disc with ridge blue. This is the closest cousin to the 8/10 website.

**Risk:** too close to “nice SaaS with a mountain.” It only works if type
scale and chrome reduction stay aggressive — the number must stay
architectural, and `ring-1` cards must not return.

### 5. Waypath — cairn trail

`/ux/brand/waypath`

- **Refs:** Monument Valley, Alto’s Odyssey, Polarsteps route dots.
  Explicitly **not** Duolingo.
- **Type:** Syne (display), Outfit (UI).
- **Color:** sand `#F3EBE3`, terracotta `#C46A48`, dusk `#6D5B7A`, lichen
  `#6E8B74`.
- **Shape:** stacked rectangles as cairns; a winding path for the week.
- **How the feeling enters the UI:** days are stones on a trail. Today is
  the cairn you stand on. Completing a row stacks a second stone. Embarking
  is literal: you can see the next landing.

**Risk:** illustration-heavy chrome that fights dense planner weeks. Keep
the path as a *header object*, not a replacement for the agenda.

---

## Round 2 mixes (Contour × Folio × Dawn Ridge)

Contour and Folio pages are **untouched**. Dawn Ridge remains as round 1.
These eight are new. Every mix uses a **stacking completion**: idle is one
object; done adds a second object. Not a hollow circle that fills.

| | Mix | Parents | Completion stack |
|---|---|---|---|
| 6 | [Field Notes](/ux/brand/field-notes) | Folio × Contour | Second ink tick |
| 7 | [Alpenglow](/ux/brand/alpenglow) | Folio × Dawn Ridge | Peach stone on a blue stone |
| 8 | [Switchback](/ux/brand/switchback) | Contour × Dawn Ridge | Second peak on the sparkline |
| 9 | [Gazetteer](/ux/brand/gazetteer) | Folio × Contour | Second trail blaze |
| 10 | [Vellum](/ux/brand/vellum) | Folio × Contour × Dawn | Second paper chip |
| 11 | [Lookout](/ux/brand/lookout) | Dawn Ridge × Contour | Second offset disc |
| 12 | [Meridian](/ux/brand/meridian) | Contour × Dawn Ridge | Second rise segment |
| 13 | [Col](/ux/brand/col) | Folio × Dawn × Contour | Second cairn stone |

Waypath’s winding path is not reused. Its stacking idea is.

---

## Round 3 finalists (Gazetteer and Col, sans)

Gazetteer and Col were the strongest overall (color, page, mood). Round 3
keeps those skins and changes two things:

1. **Type:** Newsreader display is swapped for a modern grotesque —
   [Gazetteer Sans](/ux/brand/gazetteer-sans) uses Schibsted Grotesk,
   [Col Sans](/ux/brand/col-sans) uses Figtree. Rise/gain stays IBM Plex Mono.
2. **Completion:** stacking is the wrong metaphor for “done.” Idle is an
   **outer vessel**. Completing settles an **inner object** into it. Each
   finalist page lets you switch marks: sleeve (pencil in a holder), page
   (check over paper), nest, pass (peak in a window), compass, seal, ribbon,
   inset (blaze in a diamond).

The original serif Gazetteer and Col pages stay in the mix archive.

**5 Sep 2026 lock:** Gazetteer (Newsreader) is the vibe. Col is the runner-up;
the Col *kit* uses Figtree, not the Col Sans page. Corners are **Soft paper**.
Completion is **Nest**; rectangular stack is the runner-up. Sleeve, seal, and
the other inner/outer marks are dropped. Full notes:
[`brand-lock-gazetteer-col.md`](./brand-lock-gazetteer-col.md).
Applied kits: `/ux/brand/kit-gazetteer`, `/ux/brand/kit-col`.

---

## Atmospheres round (separate exploration)

The September 6 Atmospheres round steps back from the Gazetteer family and
tests nine complete, deliberately unrelated worlds:

- Glassline — Swiss minimal;
- Harbor — open water;
- Ion — bright mission futurism;
- Neon Pass — cyberpunk night city;
- Atelier — old-school workshop;
- Summit Night — alpine dark;
- Riverstone — mist, water, and stone;
- Helios — warm solar journey;
- Aero — aviation and altitude.

Each carries its premise through type, palette, material, geometry, week
navigation, work rows, and completion. Full notes:
[`brand-round-atmospheres.md`](./brand-round-atmospheres.md). Live pages are
grouped under **Atmospheres** at `/ux/brand`.

This is additive research, not a superseding lock. Gazetteer + Soft paper +
Nest and the Col runner-up remain intact; production remains unchanged.

**6 September 2026 shortlist (not a lock):** Atelier, Summit Night, Riverstone.

A separate **Hue contrast** study at `/ux/brand/hue-contrast` lets you toggle a
second color onto today and the selected row, on Gazetteer paper and on a
blue-and-white live-app sketch. Identity color does not change. Not a lock.

---

## Comparison (so a lock is possible later)

| | Forge | Contour | Folio | Dawn Ridge | Waypath |
|---|---|---|---|---|---|
| Light/dark | Dark | Light | Warm light | Light sky | Warm light |
| Display type | High-contrast serif | None (Plex) | Literary serif | Large sans number | Geometric Syne |
| Signature object | Behind-word | Elevation trace | Chapter / stamp | Remaining count + ridges | Cairn path |
| Completion mark | Red slash | Green node | Struck journal line | Filled disc | Stacked stone |
| Closest emotion | Grit / mastery | Climbing | Completing a journey | Dreams / horizon | Embarking |
| Landing kinship | Opposite | Distant | Distant | Direct | Distant |
| Screenshot lineage | Yes (only one) | No | No | No | No |

Do not hybridize all fifteen. Gazetteer is the leading lock. Col is preserved
as a parallel kit (Figtree on Col furniture). Nest is the completion mark;
the rectangular stack stays as a toggle. Forge’s reel and Waypath’s path stay
out.

---

## What this does not decide

- Spatial Plan (B), week vs month, Checklist as a peer.
- Production tokens in `globals.css`.
- Native Expo.
- Motion systems beyond the tiny completion toggles in the prototypes.
- Whether XP remains in chrome (UX guide already wants it quieter).

Until a direction is implemented in production, do not invent another visual
language outside `/ux/brand`. Gazetteer is the leading exploratory lock;
explore applied atoms only in the kits. Explore IA only inside `/ux/concepts`.

---

## Agent prompt (exploratory only)

> Authenticated Goalmaxxing visual language leading lock is Gazetteer
> (`/ux/brand/gazetteer`, notes in `docs/ux/brand-lock-gazetteer-col.md`)
> with Nest completion and Soft paper corners. Col is the runner-up.
> Applied kits: `/ux/brand/kit-gazetteer` and `/ux/brand/kit-col`. Do not
> restyle production `AppShell` until we explicitly implement the lock.
> Spatial Plan remains the UX direction.
> Keep Forge as the only screenshot-lineage dark serif.
