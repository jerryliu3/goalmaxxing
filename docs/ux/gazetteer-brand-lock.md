# Visual styles (production)

Status: **Original is the default visual style.** Gazetteer is an opt-in
skin. Spatial Plan (B) remains the IA: Plan · Progress · Community · You.

Date locked: 5 September 2026. Style switcher: September 2026.

Do not import `src/features/ux-concepts/*` or `src/features/ux-brand/*` into
production. Reimplement atoms in live modules.

The style catalog lives in `src/lib/brand/ui-style.ts`. Preference is stored
in the `gm_ui_style` cookie and applied on `html` (`data-ui-style` plus an
optional overlay class such as `.gm-gazetteer`). You → Appearance and the
marketing header share the same picker.

Canonical Gazetteer palette lives in `src/lib/brand/gazetteer.ts` and is
applied only when Gazetteer is selected.

## Type (Gazetteer)

- **Display / names:** Newsreader. Use on destination titles, day names, and
  work-row titles.
- **Labels / running heads:** Source Sans 3, uppercase tracking on kickers,
  tabs, and meta.
- **Rise / figures:** IBM Plex Mono.
- Do not put Newsreader on chrome labels.

## Color (Gazetteer)

| Token | Hex | Use |
|---|---|---|
| Page | `#F3EAD8` | App stage |
| Paper | `#F8F1E3` | Surfaces |
| Walnut ink | `#241C14` | Titles and body |
| Muted | `#7A6A56` / `#5C4E3F` | Meta |
| Rule gold | `#D4C4A4` | Hairlines |
| Stamp rust | `#9A4F2C` | Accent, Nest, numerals |
| Gutter green | `#4A6740` | Rise / gain only |

No sky-blue chips. No lavender cards. Green is a legend unit, not “done.”

## Shape and completion (Gazetteer)

- **Soft paper** corners (~8–16px) on chips, rows, month cells, sheets.
- **Nest** completion: empty rounded frame, inner square settles in.
- Day lists are hairline ledgers. Week/month pills stay move targets with
  category fill. Completing happens in Day.
- Unplaced work uses a Recover banner — adaptive, not shame.
