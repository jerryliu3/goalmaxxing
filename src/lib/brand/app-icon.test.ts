import { describe, expect, it } from "vitest";
import { getTheme } from "@cadence/shared/brand";
import { appIconHref, buildAppIconSvg } from "@/lib/brand/app-icon";

describe("app icon", () => {
  it("defaults original to identity blue instead of stamp rust", () => {
    expect(getTheme("original").themeColor).toBe("#0F64BF");
    expect(buildAppIconSvg(getTheme("original").themeColor)).toContain("#0F64BF");
    expect(buildAppIconSvg(getTheme("original").themeColor)).not.toContain("#9A4F2C");
  });

  it("uses the active gazetteer theme color when that style is active", () => {
    expect(buildAppIconSvg(getTheme("gazetteer").themeColor)).toContain(
      getTheme("gazetteer").themeColor
    );
  });

  it("points the favicon route at the active style", () => {
    expect(appIconHref("original")).toBe("/brand-icon?style=original");
    expect(appIconHref("gazetteer")).toBe("/brand-icon?style=gazetteer");
    expect(appIconHref("a b")).toBe("/brand-icon?style=a%20b");
  });
});
