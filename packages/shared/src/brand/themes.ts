import { z } from "zod";
import { darkTheme, lightTheme, type ThemeTokenName } from "../tokens";
import { gazetteerDarkTheme, gazetteerLightTheme } from "./gazetteer";
import { PAIRINGS_THEMES } from "./themes-pairings";
import { WORLDS_THEMES } from "./themes-worlds";
import { STRONG_THEMES } from "./themes-strong";
import type { BrandTheme, BrandThemeDefinition } from "./types";

function productionDefinition(id: "original" | "gazetteer", appearance: "light" | "dark", colors: Record<ThemeTokenName, string>): BrandThemeDefinition {
  const gazetteer = id === "gazetteer";
  return {
    id: appearance === "dark" ? `${id}-dark` : id,
    name: `${gazetteer ? "Gazetteer" : "Original"}${appearance === "dark" ? " Dark" : ""}`,
    group: "production", appearance, status: "production",
    concept: {
      premise: gazetteer ? "The surveyor's ledger" : "Original Goalmaxxing",
      materials: gazetteer ? "Paper, walnut ink and stamp rust" : "Neutral surfaces and blue identity",
      geometry: gazetteer ? "Soft paper corners and ledger rules" : "Rounded surfaces and pill tabs",
      completion: gazetteer ? "Nest" : "Filled circle",
      composition: "Existing application chrome and shared information architecture",
    },
    fonts: gazetteer ? { display: "newsreader", body: "source-sans-3", mono: "ibm-plex-mono" } : { display: "geist", body: "geist", mono: "geist-mono" },
    display: { weight: 400, letterSpacingEm: -0.035, lineHeight: 1.1 },
    palette: { page: colors.background, surface: colors.card, ink: colors.foreground, surfaceInk: colors.cardForeground, muted: colors.mutedForeground, primary: colors.primary, onPrimary: colors.primaryForeground, secondary: colors.secondary, onSecondary: colors.secondaryForeground, border: colors.border, display: colors.foreground },
    geometry: { radiusPx: gazetteer ? 12 : 14, borderWidthPx: 1 },
    effects: { pageBackgroundImage: "none", surfaceBackgroundImage: "none", shadow: "none" },
  };
}

function resolveTheme(definition: BrandThemeDefinition): BrandTheme {
  const p = definition.palette;
  return {
    ...definition,
    colors: {
      background: p.page, foreground: p.ink,
      card: p.surface, cardForeground: p.surfaceInk,
      popover: p.surface, popoverForeground: p.surfaceInk,
      primary: p.primary, primaryForeground: p.onPrimary,
      secondary: p.secondary, secondaryForeground: p.onSecondary,
      muted: p.page, mutedForeground: p.muted,
      accent: p.secondary, accentForeground: p.onSecondary,
      destructive: definition.appearance === "dark" ? "#FF969B" : "#A51F36",
      border: p.border, input: p.border,
      ring: p.secondary,
    },
  };
}

const productionThemes = {
  original: { ...productionDefinition("original", "light", lightTheme), colors: lightTheme },
  "original-dark": { ...productionDefinition("original", "dark", darkTheme), colors: darkTheme },
  gazetteer: { ...productionDefinition("gazetteer", "light", gazetteerLightTheme), colors: gazetteerLightTheme },
  "gazetteer-dark": { ...productionDefinition("gazetteer", "dark", gazetteerDarkTheme), colors: gazetteerDarkTheme },
} satisfies Record<string, BrandTheme>;

const studies = [...PAIRINGS_THEMES, ...WORLDS_THEMES, ...STRONG_THEMES];
export type BrandThemeId = keyof typeof productionThemes | (typeof studies)[number]["id"];

export const BRAND_THEMES: Readonly<Record<BrandThemeId, BrandTheme>> = {
  ...productionThemes,
  ...Object.fromEntries(studies.map((definition) => [definition.id, resolveTheme(definition)])),
} as Record<BrandThemeId, BrandTheme>;

export const BRAND_THEME_IDS = Object.keys(BRAND_THEMES) as [BrandThemeId, ...BrandThemeId[]];
export const brandThemeIdSchema = z.enum(BRAND_THEME_IDS);
/** Runtime input must be parsed explicitly. Unknown ids never silently select another design. */
export function getBrandTheme(id: BrandThemeId): BrandTheme {
  return BRAND_THEMES[brandThemeIdSchema.parse(id)];
}
