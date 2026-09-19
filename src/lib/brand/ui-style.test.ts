import { afterEach, describe, expect, it } from "vitest";
import {
  applyDocumentUiStyle,
  DEFAULT_UI_STYLE_ID,
  getUiStyle,
  parseUiStyleId,
  resolveUiStyleId,
  UI_STYLE_OPTIONS,
} from "@/lib/brand/ui-style";

describe("ui style catalog", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-ui-style");
    document.documentElement.classList.remove("gm-gazetteer");
  });

  it("defaults unknown values to original", () => {
    expect(parseUiStyleId(undefined)).toBe("original");
    expect(parseUiStyleId("col")).toBe("original");
    expect(DEFAULT_UI_STYLE_ID).toBe("original");
  });

  it("lists original then gazetteer so later skins can append", () => {
    expect(UI_STYLE_OPTIONS.map((style) => style.id)).toEqual(["original", "gazetteer"]);
  });

  it("reads the document dataset when no explicit id is passed", () => {
    document.documentElement.dataset.uiStyle = "gazetteer";
    expect(resolveUiStyleId()).toBe("gazetteer");
    expect(getUiStyle(resolveUiStyleId()).htmlClass).toBe("gm-gazetteer");
  });

  it("applies and clears the html overlay class", () => {
    applyDocumentUiStyle(getUiStyle("gazetteer"));
    expect(document.documentElement).toHaveClass("gm-gazetteer");
    expect(document.documentElement.dataset.uiStyle).toBe("gazetteer");

    applyDocumentUiStyle(getUiStyle("original"));
    expect(document.documentElement).not.toHaveClass("gm-gazetteer");
    expect(document.documentElement.dataset.uiStyle).toBe("original");
  });

  it("updates theme-color and status bar when switching styles", () => {
    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement("meta");
      themeMeta.setAttribute("name", "theme-color");
      document.head.append(themeMeta);
    }

    applyDocumentUiStyle(getUiStyle("gazetteer"));
    expect(themeMeta.getAttribute("content")).toBe("#f3ead8");
    expect(
      document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
        ?.getAttribute("content")
    ).toBe("black-translucent");

    applyDocumentUiStyle(getUiStyle("original"));
    expect(themeMeta.getAttribute("content")).toBe("#F8F7FB");
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

    applyDocumentUiStyle(getUiStyle("original"));
    expect(icon.getAttribute("href")).toBe("/brand-icon?style=original");

    applyDocumentUiStyle(getUiStyle("gazetteer"));
    expect(icon.getAttribute("href")).toBe("/brand-icon?style=gazetteer");

    icon.remove();
  });
});
