# Brand and category library

The code source of truth for the new color studies is `@cadence/shared/brand`
(`packages/shared/src/brand/index.ts`). It is platform-independent and performs
no font loading or preference writes. The web adapter lives in
`src/lib/brand/theme-library.ts`; `BrandThemeScope` applies it to a subtree.

## Catalog

| Group | Theme IDs |
| --- | --- |
| Existing shared production tokens | `original`, `original-dark`, `gazetteer`, `gazetteer-dark` |
| Archived pairing studies | `fig-porcelain`, `tidal-orchard`, `garnet-glacier`, `blue-hour`, `night-garden`, `guava-club` |
| Brand worlds | `undertow`, `kiln`, `court` (Centre Court), `longplay`, `lido`, `opaline` |
| Strong brands | `bloodstone`, `pitlane`, `quarry`, `fieldwork` |

Bloodstone combines deep red, dark mineral surfaces, monumental Playfair Display,
and **cold steel blue** in place of bronze. Pitlane uses condensed racing type,
asphalt, **electric cobalt**, and lime timing strips in place of the orange accent.
The `status` field distinguishes shortlisted, exploratory, and archived ideas.

Each theme owns its primary/on-primary and secondary/on-secondary pairs,
semantic UI colors, display/body/mono font IDs, display weight/tracking/leading,
corner radius, border width, backgrounds, and shadow. Concept notes preserve
material, geometry, composition, and completion intent. Those notes are design
direction; the scope does not generate bespoke layouts or completion animations.
Shared motion defaults remain in `@cadence/shared/tokens`.

`BRAND_FONTS` contains 19 font definitions with families, weights, italic support,
and fallbacks. `COLOR_LIBRARY` contains 12 full five-tone pigment scales and
15 archived surface/ink study pairs. `COLOR_COLLECTIONS` groups these entries.
These are authored digital hex colors, not official Pantone specifications.

## Use a theme on web

```tsx
import { BrandThemeScope } from "@/components/brand/brand-theme-scope";

<BrandThemeScope themeId="pitlane" className="p-6">
  <h1>Your next lap</h1>
  <section data-brand-surface className="mt-6 p-4">
    <p className="font-sans">Finish what matters today.</p>
    <button className="bg-primary text-primary-foreground rounded-lg px-4 py-2">
      Start session
    </button>
    <button className="bg-secondary text-secondary-foreground rounded-lg px-4 py-2">
      View plan
    </button>
  </section>
</BrandThemeScope>
```

Changing `themeId` switches the complete token set. The scope applies heading
styles to h1–h3 and `.font-display`; body and mono use the existing font utilities.
`data-brand-surface` opts a panel into its material, border, radius, and shadow.
Use semantic color utilities rather than hardcoded colors inside the scope.

By default the scope requests only its selected font families from Google Fonts.
For a shipped application surface, load the selected faces through the existing
`next/font` setup, set `loadFonts={false}`, and pass `fontFamilies`, for example
`{ "barlow-condensed": "var(--font-barlow-condensed)" }`. Next font declarations
must be static; do not attempt to call font loaders dynamically from the catalog.
Hosts using a CSP must allow the Google stylesheet/font origins when using the
default external loader. System fallbacks apply while fonts load.

`getBrandThemeStyle(themeId, fontFamilies?)` is available for an existing wrapper
that does not need the component. `brandThemeIdSchema.parse(value)` validates a
URL or stored selection; invalid input must be handled at the owning boundary.
The library never silently substitutes a theme.

Portals must render inside the scope or receive their own scope to inherit its
variables. App-specific `--gm-*` status, calendar, and completion styles are not
remapped by this generic adapter. The document-level Original/Gazetteer selector
and its cookie remain owned by `ui-style.ts`, but its semantic variables, radius,
and font aliases now resolve through the shared production entries. `layout.tsx`
applies those variables to the document, and switching the picker updates them
in place. `globals.css` keeps only app-specific Gazetteer treatments and no
longer redeclares Gazetteer's semantic palette or font stack. The selector still exposes only the two
approved production styles and does not change the current default.

The application runtime emits the registry’s semantic variables in a small
server-rendered stylesheet before the app paints. Original and Gazetteer dark
companions follow the existing `dark` class. Study themes remain available
through `BrandThemeScope` for previews and future opt-in settings. The mobile
theme hook reads the same shared Gazetteer theme and geometry.

## Category identity: Mineral Candy

Category identity stays independent of the selected brand. The selected six
colors are available in `GOAL_CATEGORY_DESIGN`:

| Category | Color ID | Surface | Ink |
| --- | --- | --- | --- |
| Health | `vermilion` | `#FFA583` | `#632310` |
| Career | `klein-blue` | `#AABAFB` | `#18245F` |
| Personal | `ultraviolet` | `#C4A8F5` | `#351655` |
| Interpersonal | `black-cherry` | `#DE93B6` | `#3E132A` |
| Finances | `malachite` | `#83D3A3` | `#103E2E` |
| Other | `saffron` | `#F4D35E` | `#4D3C0B` |

```tsx
import { getCategoryColorPair, getColorPair, COLOR_LIBRARY } from "@cadence/shared/brand";

const finance = getCategoryColorPair("finance");
const custom = getColorPair("petroleum", "dark");
const scale = COLOR_LIBRARY.malachite; // mist, surface, pigment, shade, ink

<span style={{ backgroundColor: finance.surface, color: finance.ink }}>Finances</span>
```

Surface and ink are a pair. Dark treatment reverses the pair; it does not dim
text through opacity. Pigment is for decoration, not a substitute text color.
Some archived study pairs have no full scale; `getColorPair` returns their
surface as the pigment fallback. Always retain text/icon category labels.

This is now the approved persisted preset assignment. The forward-only
`20260918120000_mineral_candy_goal_categories.sql` migration updates the shared
category rows, adds Finances, and renames the Relationships display label to
Interpersonal while keeping the `relationships` key and a Relationships alias.
Existing goal-level custom colors remain user-owned; the migration does not
rewrite those values. Denormalized `goals.category` text for `relationships`
rows is backfilled to Interpersonal.

## Extend

1. Add a typed theme definition to its study group, or a new group array in
   `themes.ts`. Semantic UI tokens are resolved centrally from its palette.
2. Register any new font in `fonts.ts` with its actual supported weights.
3. Add a color in `colors.ts` and its collection. Add full scales when authored;
   do not invent intermediate stops for archived two-color pairs.
4. Change category assignments only in `categories.ts`.
5. Consume the exported registry and adapter; avoid copying values into pages.

Native clients can read `getBrandTheme(id).colors`, the font manifest, geometry,
and category helpers directly. Web CSS background images/shadows need
platform-specific rendering; they are not React Native style objects.

Coverage is included for catalog invariants, existing token reuse, category
pair behavior, web variable mapping, and selected font loading. It has not been
run, in accordance with the repository's explicit verification gate.
