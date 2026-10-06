# Theme registry

This directory is the single source of truth for how Goalmaxxing looks. Every
color, typeface, radius, and per-theme component variant is defined here;
web and native read from it, and nothing else names a concrete value.

| File | Owns |
| --- | --- |
| `roles.ts` | The contract: every color role, the type slots, chrome, variants |
| `fonts.ts` | Every typeface a theme may use, and its CSS variable |
| `themes/*.ts` | One file per theme, filling every role |
| `themes/index.ts` | Theme order (first is the default) and lookup |
| `css.ts` | Renders the web stylesheet `src/app/themes.css` |
| `gazetteer.ts` | Gazetteer palette swatches and goal-category colors |

## How components use it

- Web: Tailwind role utilities (`bg-card`, `text-muted-foreground`,
  `bg-selection`, `font-display`, `font-mono`) or the CSS variables in CSS
  (`var(--primary)`, `var(--font-app-display)`). Never a hex value, a family
  name, or one theme's font variable (`--font-newsreader`); a source test
  fails on those.
- Per-theme component variants (`completionMark`, `tabChrome`) come from
  `useUiStyle().style`.
- Native: `GAZETTEER_THEME.colors` / `.darkColors` (the roles native reads are
  plain hex).

A theme applies to the document through `data-ui-style="<id>"` on `<html>`,
or to any subtree with the same attribute.

## Changing or adding a theme

1. Edit or add `themes/<id>.ts` (TypeScript fails until every role is filled)
   and list it in `themes/index.ts`. New typefaces go in `fonts.ts` and get a
   `next/font` loader in `src/lib/brand/fonts.ts` with the same variable.
2. Run `pnpm themes:css` and commit the regenerated `src/app/themes.css`.
   A test fails if the checked-in stylesheet is stale.

Adding a role means adding it to `roles.ts`; every theme then has to supply it.
