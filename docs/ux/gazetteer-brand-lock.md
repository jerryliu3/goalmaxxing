# Visual styles (production)

Status: **Original is the default visual style.** Gazetteer is an opt-in
skin. Spatial Plan (B) remains the IA: Plan · Progress · Community · Profile.

Date locked: 5 September 2026. Style switcher: September 2026.

Do not import `src/features/ux-concepts/*` or `src/features/ux-brand/*` into
production. Reimplement atoms in live modules.

The style catalog lives in `src/lib/brand/ui-style.ts`. Preference is stored
in the `gm_ui_style` cookie and applied on `html` (`data-ui-style` plus an
optional overlay class such as `.gm-gazetteer`). You → Appearance and the
marketing header share the same picker.

Canonical Gazetteer palette lives in `packages/shared/src/brand/gazetteer.ts`.
Web re-exports it from `src/lib/brand/gazetteer.ts` when Gazetteer is selected.
Native consumes the same hexes through `apps/mobile/src/theme.ts`.

## Type (Gazetteer)

Production applies the study’s three roles through existing tokens
(`--font-app-display`, `--font-app-sans`, `--font-app-mono`) and Tailwind
`font-display` / `font-sans` / `font-mono`. Do not add a fourth family.

- **Display / names:** Newsreader. Use on destination titles, day names, and
  work-row titles (`font-display`). Native loads `Newsreader_600SemiBold` via `expo-font`.
- **Labels / running heads:** Source Sans 3, uppercase tracking on kickers,
  tabs, and meta (`font-sans`). Chrome sans must resolve through `--font-app-sans`, not a
  baked Geist utility. Native loads Source Sans 3 regular and semibold.
- **Rise / figures:** IBM Plex Mono (`font-mono`). Native loads `IBMPlexMono_500Medium`.
- Do not put Newsreader on chrome labels (weekday kickers, tabs, section
  running heads). Day numbers stay display; weekday letters stay sans.
  System serif/sans/mono remain the fallback until fonts load.

Original keeps Geist on the same three roles, so tagging a name `font-display`
does not restyle Original — it only reveals Newsreader when Gazetteer is on.

## Color (Gazetteer)

| Token | Hex | Use |
|---|---|---|
| Page | `#F3EAD8` | App stage |
| Paper | `#F8F1E3` | Surfaces |
| Walnut ink | `#241C14` | Titles and body |
| Muted | `#7A6A56` / `#5C4E3F` | Meta |
| Rule gold | `#D4C4A4` | Hairlines |
| Stamp rust | `#9A4F2C` | Identity: Nest, numerals, heatmap level 3, selected-day outline |
| Stamp rust light | `#C88968` | Heatmap level 2 |
| Adjacent months | `#D4D4D8` / `#52525B` | Opaque Zinc 300 / 600 — one layer darker than Original so the same grey reads on warm paper |
| Secondary | `#E4E4E7` / `#3F3F46` | Zinc 200 / 700 — badges and secondary buttons |
| Sage / oxidized copper | `#6F8175` | Selected work-row wash (not the selected-day outline) |
| Sage level 1 | `color-mix` of sage 28% onto paper | Selected work-row fill |
| Work pills | Opaque pastels mixed onto paper | Session chips; same fill in every month |
| Gutter green | `#4A6740` | Rise / gain only |
| Warning | `#EAB308` | Shared yellow on Original and Gazetteer; never rust |
| Error | Original `--destructive` | Shared red; do not remap to rust |

No sky-blue chips. No lavender cards. Green is a legend unit, not “done.”

## Shape and completion (Gazetteer)

- **Soft paper** corners (~8–16px) on chips, rows, month cells, sheets.
- **Nest** completion: empty rounded frame, inner square settles in.
- Day lists are hairline ledgers. Week/month pills stay move targets with
  category fill. Completing happens from Day rows and Week checkboxes.
- Unplaced work uses a Recover banner — adaptive, not shame.
