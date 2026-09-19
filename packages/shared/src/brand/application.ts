import { BRAND_THEMES, type BrandThemeId } from "./themes";
import { PRODUCTION_CHROME } from "./chrome";

export type ApplicationBrandId = Exclude<BrandThemeId, "original-dark" | "gazetteer-dark">;

/** Dark companions follow the appearance of the host; authored study worlds keep their own appearance. */
export function applicationTheme(id: ApplicationBrandId, appearance: "light" | "dark" = "light") {
  const themeId: BrandThemeId = appearance === "dark" && (id === "original" || id === "gazetteer") ? `${id}-dark` : id;
  return BRAND_THEMES[themeId];
}

export function applicationChrome(id: BrandThemeId): Record<`--${string}`, string> {
  if (Object.hasOwn(PRODUCTION_CHROME, id)) return PRODUCTION_CHROME[id as keyof typeof PRODUCTION_CHROME];
  const theme = BRAND_THEMES[id];
  const p = theme.palette;
  return {
    "--gm-page": p.page, "--gm-gain": p.secondary, "--gm-recover": p.secondary,
    "--gm-warning": p.secondary, "--gm-warning-fill": p.surface,
    "--gm-selection": p.secondary, "--gm-selection-foreground": p.onSecondary,
    "--gm-today": p.primary, "--gm-today-foreground": p.onPrimary,
    "--gm-day-selected": p.secondary, "--gm-day-selected-foreground": p.onSecondary,
    "--gm-adjacent": p.surface, "--gm-adjacent-foreground": p.surfaceInk,
    "--gm-stamp-light": p.primary,
    "--gm-heatmap-0": p.page,
    "--gm-heatmap-1": `color-mix(in srgb, ${p.primary} 25%, ${p.page})`,
    "--gm-heatmap-2": `color-mix(in srgb, ${p.primary} 50%, ${p.page})`,
    "--gm-heatmap-3": p.primary, "--gm-heatmap-4": p.secondary,
  };
}

export const APPLICATION_BRANDS = Object.fromEntries(
  Object.entries(BRAND_THEMES).filter(([id]) => id !== "original-dark" && id !== "gazetteer-dark").map(([id, theme]) => [id, {
    name: theme.name, description: theme.concept.premise,
    page: theme.colors.background,
    iconColor: theme.colors.primary,
    completionMark: id === "gazetteer" ? "nest" as const : "circle" as const,
    tabChrome: id === "gazetteer" ? "underline" as const : "pills" as const,
  }])
) as Record<ApplicationBrandId, { name: string; description: string; page: string; iconColor: string; completionMark: "circle" | "nest"; tabChrome: "pills" | "underline" }>;
