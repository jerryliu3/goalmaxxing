import { describe, expect, it } from "vitest";
import { getApplicationThemeCss } from "@/lib/brand/application-theme";

describe("application theme css", () => {
  it("emits document selectors for the shortlisted picker skins", () => {
    const css = getApplicationThemeCss();
    for (const id of ["undertow", "kiln", "court", "opaline", "bloodstone", "pitlane"]) {
      expect(css).toContain(`html[data-ui-style="${id}"]`);
    }
  });
});
