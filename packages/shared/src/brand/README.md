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
| `css.ts` | Renders the web stylesheet `src/app/themes.css` |
| `gazetteer.ts` | Gazetteer palette swatches and goal-category colors |

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

## Changing or adding a theme

1. Edit or add `themes/<id>.ts` (TypeScript fails until every role is filled)
   and list it in `themes/index.ts`. New typefaces go in `fonts.ts` and get a
   `next/font` loader in `src/lib/brand/fonts.ts` with the same variable.
2. Run `pnpm themes:css` and commit the regenerated `src/app/themes.css`.
   A test fails if the checked-in stylesheet is stale.

Adding a role means adding it to `roles.ts`; every theme then has to supply it.
