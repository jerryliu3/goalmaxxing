import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_THEME_ID, getTheme } from "@cadence/shared/brand";
import {
  applyDocumentUiStyle,
  parseUiStyleId,
  resolveUiStyleId,
  uiStyleOptions,
} from "@/lib/brand/ui-style";

describe("ui style catalog", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-ui-style");
  });

  it("defaults unknown values to original", () => {
    expect(parseUiStyleId(undefined)).toBe("original");
    expect(parseUiStyleId("col")).toBe("original");
    expect(DEFAULT_THEME_ID).toBe("original");
  });

  it("offers all registered themes without a rollout flag", () => {
    expect(uiStyleOptions().map((style) => style.id)).toEqual([
      "original",
      "gazetteer",
      "undertow",
      "kiln",
      "court",
      "opaline",
      "bloodstone",
      "pitlane",
    ]);
  });

  it("honors a study-theme cookie", () => {
    expect(parseUiStyleId("pitlane")).toBe("pitlane");
  });

  it("reads the document dataset when no explicit id is passed", () => {
    document.documentElement.dataset.uiStyle = "gazetteer";
    expect(resolveUiStyleId()).toBe("gazetteer");
    expect(getTheme(resolveUiStyleId()).completionMark).toBe("nest");
  });

  it("selects the theme through the html data attribute", () => {
    applyDocumentUiStyle(getTheme("gazetteer"));
    expect(document.documentElement.dataset.uiStyle).toBe("gazetteer");

    applyDocumentUiStyle(getTheme("original"));
    expect(document.documentElement.dataset.uiStyle).toBe("original");
  });

  it("marks dark-appearance themes so dark: utilities follow the theme", () => {
    applyDocumentUiStyle(getTheme("undertow"));
    expect(document.documentElement.dataset.appearance).toBe("dark");

    applyDocumentUiStyle(getTheme("original"));
    expect(document.documentElement.dataset.appearance).toBe("light");
  });

  it("updates theme-color and status bar when switching styles", () => {
    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement("meta");
      themeMeta.setAttribute("name", "theme-color");
      document.head.append(themeMeta);
    }

    applyDocumentUiStyle(getTheme("gazetteer"));
    expect(themeMeta.getAttribute("content")).toBe("#fbf7ef");
    expect(
      document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
        ?.getAttribute("content")
    ).toBe("black-translucent");

    applyDocumentUiStyle(getTheme("original"));
    expect(themeMeta.getAttribute("content")).toBe("#fafafa");
    expect(
      document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
        ?.getAttribute("content")
    ).toBe("default");
  });

  it("updates the favicon to the active style color", () => {
    const icon = document.createElement("link");
    icon.rel = "icon";
    icon.href = "/cadence-icon.svg";
    document.head.append(icon);

    applyDocumentUiStyle(getTheme("original"));
    expect(icon.getAttribute("href")).toBe("/brand-icon?style=original");

    applyDocumentUiStyle(getTheme("gazetteer"));
    expect(icon.getAttribute("href")).toBe("/brand-icon?style=gazetteer");

    icon.remove();
  });
});
