import { describe, expect, it } from "vitest";
import { getUiStyle } from "@/lib/brand/ui-style";
import { appIconHref, buildAppIconSvg } from "@/lib/brand/app-icon";

describe("app icon", () => {
  it("defaults original to identity blue instead of stamp rust", () => {
    expect(getUiStyle("original").themeColor).toBe("#0F64BF");
    expect(buildAppIconSvg(getUiStyle("original").themeColor)).toContain("#0F64BF");
    expect(buildAppIconSvg(getUiStyle("original").themeColor)).not.toContain("#9A4F2C");
  });

  it("uses gazetteer stamp rust when that style is active", () => {
    expect(buildAppIconSvg(getUiStyle("gazetteer").themeColor)).toContain("#9A4F2C");
  });

  it("points the favicon route at the active style", () => {
    expect(appIconHref("original")).toBe("/brand-icon?style=original");
    expect(appIconHref("gazetteer")).toBe("/brand-icon?style=gazetteer");
  });
});
