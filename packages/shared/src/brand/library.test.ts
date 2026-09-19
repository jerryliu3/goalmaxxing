import { describe, expect, it } from "vitest";
import { darkTheme, lightTheme, cssTokenNames } from "../tokens";
import { gazetteerLightTheme } from "./gazetteer";
import { BRAND_FONTS, BRAND_THEMES, brandThemeIdSchema, getBrandTheme, getCategoryColorPair, getColorPair, GOAL_CATEGORY_DESIGN } from "./index";

describe("brand catalog", () => {
  it("reuses the existing production token sources", () => {
    expect(getBrandTheme("original").colors).toBe(lightTheme);
    expect(getBrandTheme("original-dark").colors).toBe(darkTheme);
    expect(getBrandTheme("gazetteer").colors).toBe(gazetteerLightTheme);
  });

  it("requires a known theme at an input boundary", () => {
    expect(brandThemeIdSchema.safeParse("missing-brand").success).toBe(false);
    expect(brandThemeIdSchema.parse("bloodstone")).toBe("bloodstone");
  });

  it("provides complete semantic roles and loadable display weights", () => {
    for (const [id, theme] of Object.entries(BRAND_THEMES)) {
      expect(theme.id).toBe(id);
      expect(Object.keys(theme.colors).sort()).toEqual(Object.keys(cssTokenNames).sort());
      expect(BRAND_FONTS[theme.fonts.display].weights).toContain(theme.display.weight);
      expect(theme.palette.primary).not.toBe(theme.palette.secondary);
    }
  });

  it("keeps category identity independent of theme and reverses the authored pair in dark mode", () => {
    expect(Object.keys(GOAL_CATEGORY_DESIGN)).toHaveLength(6);
    expect(new Set(Object.values(GOAL_CATEGORY_DESIGN).map((c) => c.colorId)).size).toBe(6);
    expect(GOAL_CATEGORY_DESIGN.relationships.label).toBe("Interpersonal");
    expect(GOAL_CATEGORY_DESIGN.finance.label).toBe("Finances");
    expect(getCategoryColorPair("finance")).toEqual(getColorPair("malachite"));
    const light = getCategoryColorPair("health");
    expect(getCategoryColorPair("health", "dark")).toEqual({ surface: light.ink, ink: light.surface, pigment: light.pigment });
  });
});
