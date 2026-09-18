import { describe, expect, it } from "vitest";
import { getBrandTheme } from "@cadence/shared/brand";
import { getBrandFontStylesheet, getBrandThemeStyle } from "./theme-library";

describe("web brand adapter", () => {
  it("switches the semantic colors, type and geometry together", () => {
    const bloodstone = getBrandThemeStyle("bloodstone");
    const pitlane = getBrandThemeStyle("pitlane");
    expect(bloodstone["--primary"]).toBe(getBrandTheme("bloodstone").colors.primary);
    expect(pitlane["--secondary-foreground"]).toBe(getBrandTheme("pitlane").colors.secondaryForeground);
    expect(bloodstone["--font-app-display"]).not.toBe(pitlane["--font-app-display"]);
    expect(bloodstone["--radius"]).toBe("0px");
    expect(bloodstone.colorScheme).toBe("dark");
  });

  it("accepts host-loaded fonts without changing theme metadata", () => {
    expect(getBrandThemeStyle("bloodstone", { "playfair-display": "var(--font-local-playfair)" })["--font-app-display"])
      .toBe("var(--font-local-playfair)");
    expect(getBrandTheme("bloodstone").fonts.display).toBe("playfair-display");
  });

  it("loads just the chosen theme's distinct families", () => {
    const original = new URL(getBrandFontStylesheet("original"));
    expect(original.searchParams.getAll("family")).toEqual([
      "Geist:wght@400;500;600;700", "Geist Mono:wght@400;500;600;700",
    ]);
    expect(original.searchParams.get("display")).toBe("swap");
    expect(getBrandFontStylesheet("bloodstone")).toContain("Playfair+Display:wght@400;500;600;700;800;900");
  });
});
