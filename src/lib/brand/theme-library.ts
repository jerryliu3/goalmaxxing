import type { CSSProperties } from "react";
import { BRAND_FONTS, brandFontStack, getBrandTheme, type BrandFontId, type BrandThemeId } from "@cadence/shared/brand";
import { cssTokenNames, type ThemeTokenName } from "@cadence/shared/tokens";

export type BrandThemeStyle = CSSProperties & Record<`--${string}`, string | number>;
export type BrandFontFamilies = Partial<Record<BrandFontId, string>>;

/** Font overrides accept next/font variable references or platform-owned font stacks. */
export function getBrandThemeStyle(id: BrandThemeId, fontFamilies: BrandFontFamilies = {}): BrandThemeStyle {
  const theme = getBrandTheme(id);
  const font = (role: "display" | "body" | "mono") => fontFamilies[theme.fonts[role]] ?? brandFontStack(theme.fonts[role]);
  const style: BrandThemeStyle = {
    colorScheme: theme.appearance,
    backgroundColor: theme.colors.background,
    backgroundImage: theme.effects.pageBackgroundImage,
    color: theme.colors.foreground,
    fontFamily: font("body"),
    "--font-app-sans": font("body"),
    "--font-app-display": font("display"),
    "--font-app-mono": font("mono"),
    "--font-sans": font("body"),
    "--font-display": font("display"),
    "--font-mono": font("mono"),
    "--radius": `${theme.geometry.radiusPx}px`,
    "--brand-border-width": `${theme.geometry.borderWidthPx}px`,
    "--brand-display-color": theme.palette.display,
    "--brand-display-weight": theme.display.weight,
    "--brand-display-tracking": `${theme.display.letterSpacingEm}em`,
    "--brand-display-leading": theme.display.lineHeight,
    "--brand-display-style": theme.display.style ?? "normal",
    "--brand-display-transform": theme.display.textTransform ?? "none",
    "--brand-surface-image": theme.effects.surfaceBackgroundImage,
    "--brand-shadow": theme.effects.shadow,
  };
  for (const name of Object.keys(cssTokenNames) as ThemeTokenName[]) {
    style[cssTokenNames[name]] = theme.colors[name];
  }
  return style;
}

/** Only request faces used by this theme; hosts can supply their own font loader instead. */
export function getBrandFontStylesheet(id: BrandThemeId): string {
  const theme = getBrandTheme(id);
  const families = [...new Set(Object.values(theme.fonts))].map((id) => {
    const font = BRAND_FONTS[id];
    const italic = id === theme.fonts.display && theme.display.style === "italic";
    const weights = font.weights.join(";");
    const axes = italic
      ? `ital,wght@${font.weights.map((weight) => `0,${weight}`).join(";")};${font.weights.map((weight) => `1,${weight}`).join(";")}`
      : `wght@${weights}`;
    return `family=${encodeURIComponent(font.family).replace(/%20/g, "+")}:${axes}`;
  });
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}
