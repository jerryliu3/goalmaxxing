# Gazetteer brand lock (production)

Status: **Gazetteer is the production visual lock for Goalmaxxing web.**
The native mobile app is out of scope. Spatial Plan (B) remains the IA:
Plan · Progress · Community · You.

Date locked: 5 September 2026. Production cutover: September 2026.

Do not import `src/features/ux-concepts/*` or `src/features/ux-brand/*` into
production. Reimplement atoms in live modules.

Canonical palette lives in `src/lib/brand/gazetteer.ts`. Authenticated chrome
applies `.gm-gazetteer` in `AppShell`.

## Type

- **Display / names:** Newsreader. Use on destination titles, day names, and
  work-row titles.
- **Labels / running heads:** Source Sans 3, uppercase tracking on kickers,
  tabs, and meta.
- **Rise / figures:** IBM Plex Mono.
- Do not put Newsreader on chrome labels.

## Color

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

## Shape and completion

- **Soft paper** corners (~8–16px) on chips, rows, month cells, sheets.
- **Nest** completion: empty rounded frame, inner square settles in.
- Day lists are hairline ledgers. Week/month pills stay move targets with
  category fill. Completing happens in Day.
- Unplaced work uses a Recover banner — adaptive, not shame.
