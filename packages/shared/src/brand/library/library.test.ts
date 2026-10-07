import { describe, expect, it } from "vitest";
import { THEMES } from "../themes";
import { studyTheme } from "../themes/study";
import { ARCHIVED_STUDY_SKINS } from "./archived-skins";
import { MINERAL_CANDY_CATEGORIES, mineralCandyCategoryPair } from "./category-palettes";
import { STUDY_SKIN_NOTES } from "./skin-notes";

describe("brand library", () => {
  it("keeps archived skins promotable into complete themes", () => {
    expect(ARCHIVED_STUDY_SKINS).toHaveLength(10);
    for (const skin of ARCHIVED_STUDY_SKINS) {
      const theme = studyTheme(skin);
      expect(Object.values(theme.colors).every((value) => /^#[0-9a-f]{6}$/.test(value))).toBe(true);
    }
  });

  it("has notes for every registry study skin and every archived skin", () => {
    const studyIds = THEMES.filter((theme) => theme.status === "study").map((theme) => theme.id);
    for (const id of [...studyIds, ...ARCHIVED_STUDY_SKINS.map((skin) => skin.id)]) {
      expect(STUDY_SKIN_NOTES[id], id).toBeDefined();
    }
  });

  it("keeps the Mineral Candy category study, including Finance", () => {
    expect(MINERAL_CANDY_CATEGORIES.finance.colorId).toBe("malachite");
    const light = mineralCandyCategoryPair("health");
    const dark = mineralCandyCategoryPair("health", "dark");
    expect(dark.surface).toBe(light.ink);
  });
});
