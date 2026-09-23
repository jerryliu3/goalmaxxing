import { describe, expect, it } from "vitest";
import { getApplicationThemeCss } from "@/lib/brand/application-theme";
import { APPLICATION_BRANDS, applicationTheme, type ApplicationBrandId, type BrandThemeId } from "@cadence/shared/brand";
import { getBrandThemeStyle } from "./theme-library";

describe("application theme css", () => {
  it("emits document selectors for the shortlisted picker skins", () => {
    const css = getApplicationThemeCss();
    for (const id of ["undertow", "kiln", "court", "opaline", "bloodstone", "pitlane"]) {
      expect(css).toContain(`html[data-ui-style="${id}"]`);
    }
  });

  it("uses the same authored secondary pair in scoped previews and both document appearances", () => {
    const css = getApplicationThemeCss();
    for (const id of Object.keys(APPLICATION_BRANDS) as ApplicationBrandId[]) {
      for (const appearance of ["light", "dark"] as const) {
        const theme = applicationTheme(id, appearance);
        const scope = getBrandThemeStyle(theme.id as BrandThemeId);
        const selector = `html${appearance === "dark" ? ".dark" : ""}[data-ui-style="${id}"]`;
        const rule = css.split("\n").find((line) => line.startsWith(`${selector}{`));
        for (const role of ["selection", "today"]) {
          expect(scope[`--gm-${role}`]).toBe(theme.colors.secondary);
          expect(scope[`--gm-${role}-foreground`]).toBe(theme.colors.secondaryForeground);
          expect(rule).toContain(`--gm-${role}:${theme.colors.secondary};`);
          expect(rule).toContain(`--gm-${role}-foreground:${theme.colors.secondaryForeground};`);
        }
        expect(scope["--primary"]).toBe(theme.colors.primary);
        expect(scope["--primary-foreground"]).toBe(theme.colors.primaryForeground);
        expect(scope["--gm-day-selected"]).toContain("var(--secondary) 18%");
      }
    }
  });
});
