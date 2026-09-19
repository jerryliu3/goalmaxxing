import { APPLICATION_BRANDS, applicationTheme, applicationChrome, getCategoryColorPair, GOAL_CATEGORY_DESIGN_IDS, type ApplicationBrandId, type BrandFontId } from "@cadence/shared/brand";
import { getBrandThemeStyle } from "./theme-library";

// Static next/font declarations are in fonts.next.ts; these aliases are safe in client code.
export const APPLICATION_FONT_FAMILIES = {
  geist: "var(--font-geist-sans), sans-serif",
  "geist-mono": "var(--font-geist-mono), monospace",
  newsreader: "var(--font-newsreader), serif",
  "source-sans-3": "var(--font-source-sans), sans-serif",
  "ibm-plex-mono": "var(--font-plex-mono), monospace",
} satisfies Partial<Record<BrandFontId, string>>;

/** Emit both appearances before paint. CSS owns appearance changes; no inline light-token overrides. */
export function getApplicationThemeCss() {
  return (Object.keys(APPLICATION_BRANDS) as ApplicationBrandId[]).flatMap((id) =>
    (["light", "dark"] as const).map((appearance) => {
      const theme = applicationTheme(id, appearance);
      const variables = { ...getBrandThemeStyle(theme.id as Parameters<typeof getBrandThemeStyle>[0], APPLICATION_FONT_FAMILIES), ...applicationChrome(theme.id as Parameters<typeof applicationChrome>[0]) };
      for (const category of GOAL_CATEGORY_DESIGN_IDS) {
        const pair = getCategoryColorPair(category, theme.appearance);
        variables[`--category-${category}-surface`] = pair.surface;
        variables[`--category-${category}-ink`] = pair.ink;
      }
      const selector = `html${appearance === "dark" ? ".dark" : ""}[data-ui-style="${id}"]`;
      const declarations = Object.entries(variables).filter(([key]) => key.startsWith("--")).map(([key, value]) => `${key}:${value}`).join(";");
      return `${selector}{${declarations};color-scheme:${theme.appearance}}`;
    })
  ).join("\n");
}
