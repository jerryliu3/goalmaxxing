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
});
