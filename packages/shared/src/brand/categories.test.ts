import { describe, expect, it } from "vitest";
import { GOAL_CATEGORY_COLORS, goalCategoryTones } from "./categories";
import { COLOR_LIBRARY } from "./colors";

describe("goal category tones", () => {
  it("resolves every category surface to its authored pigment and ink", () => {
    expect(goalCategoryTones(GOAL_CATEGORY_COLORS.health)).toEqual({
      pigment: COLOR_LIBRARY.vermilion.pigment,
      ink: COLOR_LIBRARY.vermilion.ink,
    });
    for (const surface of Object.values(GOAL_CATEGORY_COLORS)) {
      expect(goalCategoryTones(surface)).not.toBeNull();
    }
  });

  it("matches stored colors regardless of case and whitespace", () => {
    expect(goalCategoryTones(` ${GOAL_CATEGORY_COLORS.career.toUpperCase()} `)).toEqual(
      goalCategoryTones(GOAL_CATEGORY_COLORS.career)
    );
  });

  it("returns null for custom and missing colors", () => {
    expect(goalCategoryTones("#123456")).toBeNull();
    expect(goalCategoryTones(null)).toBeNull();
  });
});
