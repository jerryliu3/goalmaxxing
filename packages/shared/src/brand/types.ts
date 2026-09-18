import type { ThemeTokenName } from "../tokens";
import type { BrandFontId } from "./fonts";

export type BrandAppearance = "light" | "dark";
export interface BrandThemeDefinition {
  readonly id: string;
  readonly name: string;
  readonly group: "production" | "pairings" | "worlds" | "strong";
  readonly appearance: BrandAppearance;
  readonly status: "production" | "shortlisted" | "exploration" | "archived-study";
  readonly concept: {
    readonly premise: string;
    readonly materials: string;
    readonly geometry: string;
    readonly completion: string;
    readonly composition: string;
  };
  readonly fonts: Readonly<Record<"display" | "body" | "mono", BrandFontId>>;
  readonly display: {
    readonly weight: number;
    readonly letterSpacingEm: number;
    readonly lineHeight: number;
    readonly style?: "normal" | "italic";
    readonly textTransform?: "none" | "uppercase";
  };
  readonly palette: {
    readonly page: string;
    readonly surface: string;
    readonly ink: string;
    readonly surfaceInk: string;
    readonly muted: string;
    readonly primary: string;
    readonly onPrimary: string;
    readonly secondary: string;
    readonly onSecondary: string;
    readonly border: string;
    readonly display: string;
  };
  readonly geometry: { readonly radiusPx: number; readonly borderWidthPx: number };
  readonly effects: {
    readonly pageBackgroundImage: string;
    readonly surfaceBackgroundImage: string;
    readonly shadow: string;
  };
}
export interface BrandTheme extends BrandThemeDefinition {
  readonly colors: Readonly<Record<ThemeTokenName, string>>;
}
