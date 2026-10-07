import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getTheme } from "@cadence/shared/brand";
import { StudyThemeAssets } from "./study-theme-assets";

describe("theme assets", () => {
  it("makes study CSS available without downloading study fonts for bundled themes", () => {
    for (const id of ["original", "gazetteer"] as const) {
      const html = renderToStaticMarkup(<StudyThemeAssets theme={getTheme(id)} />);
      expect(html).toContain('data-ui-style="pitlane"');
      expect(html).not.toContain("fonts.googleapis.com");
    }
  });

  it("loads only the selected skin's extra faces", () => {
    const html = renderToStaticMarkup(<StudyThemeAssets theme={getTheme("pitlane")} />);
    expect(html).toContain("family=DM+Sans");
    expect(html).toContain("family=Barlow+Condensed");
    expect(html).not.toContain("family=Manrope");
    expect(html).not.toContain("family=Instrument+Serif");
  });
});
