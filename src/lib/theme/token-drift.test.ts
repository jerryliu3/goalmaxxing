import { describe, expect, it } from "vitest";
import { getBrandTheme } from "@cadence/shared/brand";
import { cssTokenNames } from "@cadence/shared/tokens";

describe("design token registry", () => {
  it("contains every semantic CSS token for the production skins", () => {
    for (const id of ["original", "original-dark", "gazetteer", "gazetteer-dark"] as const) {
      const theme = getBrandTheme(id);
      expect(Object.keys(theme.colors).sort()).toEqual(Object.keys(cssTokenNames).sort());
      for (const value of Object.values(theme.colors)) expect(value).toMatch(/^(#|oklch|color-mix)/);
    }
  });
});
