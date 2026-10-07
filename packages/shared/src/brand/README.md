# Theme registry

This directory is the single source of truth for how Goalmaxxing looks. Every
theme color, typeface, text role, radius, and per-theme component variant is
defined here, and web and native read from it. A source test keeps concrete
typefaces out of components; colors stay on roles by convention.

| File | Owns |
| --- | --- |
| `roles.ts` | The contract: color roles, type slots, text roles, chrome, variants |
| `fonts.ts` | Every typeface a theme may use, and its CSS variable |
| `themes/*.ts` | One file per theme, filling every role |
| `themes/index.ts` | Theme order (first is the default) and lookup |
| `themes/study.ts` | Builds a study skin from its /ux/brand palette |
| `css.ts` | Renders `src/app/themes.css` (live themes) and the study-skin CSS |
| `colors.ts` | The named color library (pigments and palette studies) |
| `categories.ts` | Goal category colors: the Mineral Candy palette, shared by all themes |
| `library/` | Archived study skins and per-skin concept notes |
| `gazetteer.ts` | Gazetteer palette swatches and its legacy goal-color re-inking |

## How components use it

- Web color: role utilities (`bg-card`, `text-muted-foreground`,
  `bg-selection`) or the variables in CSS (`var(--primary)`).
- Web type: say what the text *is* with a text role and set only size,
  leading, and color at the call site. The theme picks face and weight.

  | Role | For | Example |
  | --- | --- | --- |
  | `type-wordmark` | The Goalmaxxing wordmark | header, boot splash |
  | `type-hero` | Statement headlines | landing, showcase, auth |
  | `type-title` | Page, sheet, and dialog titles | "Agenda", "Current goals" |
  | `type-heading` | Section and card headings | "Scheduled goals", `CardTitle` |
  | `type-item` | Names of goals, tasks, milestones, people | planner rows, cards |
  | `type-eyebrow` | Small uppercase labels | "PERSONAL RECORDS" |
  | `type-stat` | Figures that are the point of a tile | streaks, scores |
  | `type-figure` | Small figures and meta lines | counts, "0 / 1 this week" |

  In CSS use `var(--type-<role>-font)` / `var(--type-<role>-weight)`. Plain
  `font-sans` / `font-display` / `font-mono` remain for body copy, calendar
  numerals, and real code. Never a weight utility beside a role, a hex
  value, a family name, or one theme's font variable (`--font-newsreader`).
- Per-theme component variants (`completionMark`, `tabChrome`) come from
  `useUiStyle().style`.
- Native: `GAZETTEER_THEME.colors` / `.darkColors` (the roles native reads are
  plain hex).

A theme applies to the document through `data-ui-style="<id>"` on `<html>`,
or to any subtree with the same attribute. The web app has no dark mode:
`darkColors` are read by native only, and Tailwind's `dark:` variant follows a
`.dark` class that nothing sets.

## Live themes and study skins

Original and Gazetteer are `live`: they are the only themes in
`src/app/themes.css` and the only faces bundled through `next/font`.

Six shortlisted /ux/brand skins are `study` themes (Undertow, Kiln, Centre
Court, Opaline, Bloodstone, Pitlane). Each keeps its authored palette, faces, and weights;
`themes/study.ts` derives the rest. All registered themes are available in
every environment and saved cookies are honored. The provider injects study
CSS for switching, and loads a Google Fonts stylesheet only for the selected
study skin. Original and Gazetteer do not fetch extra study fonts. Study
status records provenance and distinguishes bundled from on-demand faces.

The rest of the brand library sits in `library/`, exported alongside the
themes: the six archived pairings and the four exploratory skins set aside
for now (Quarry, Fieldwork, Longplay, Lido) as `StudySkin` data (pass one to
`studyTheme(...)` to bring it back) and concept notes and study-authored
styling for all sixteen skins (`STUDY_SKIN_NOTES`).

## Goal categories

Category colors are the same in every theme: the Mineral Candy palette in
`categories.ts` (Health vermilion, Career Klein blue, Personal ultraviolet,
Interpersonal black cherry, Finance malachite, Other saffron), each a
surface/ink pair. The `goal_categories` table and `DEFAULT_GOAL_CATEGORIES`
(src/lib/goals/category.ts) carry the same surfaces; change all three
together, with a migration that moves existing goals. Goal cards look up a
category color's authored pigment and ink with `goalCategoryTones` so glass,
alloy, and chromatic cards read in the category; custom colors fall back to
tones derived in CSS.

## Changing or adding a theme

1. Edit or add `themes/<id>.ts` (TypeScript fails until every role is filled)
   and list it in `themes/index.ts`. New typefaces go in `fonts.ts` and get a
   `next/font` loader in `src/lib/brand/fonts.ts` with the same variable.
2. Run `pnpm themes:css` and commit the regenerated `src/app/themes.css`.
   A test fails if the checked-in stylesheet is stale.

Adding a role means adding it to `roles.ts`; every theme then has to supply it.
