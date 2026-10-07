import { describe, expect, it } from "vitest";
import { GOAL_CATEGORY_COLORS, goalCategoryColor, goalCategoryPair, goalCategoryPigment, goalCategoryTones } from "./categories";
import { COLOR_LIBRARY } from "./colors";

describe("goal category tones", () => {
  it("keeps renamed and legacy interpersonal labels on black cherry", () => {
    for (const label of ["Interpersonal", "Relationships", "Relationship", " interpersonal "]) {
      expect(goalCategoryColor(label)).toBe(GOAL_CATEGORY_COLORS.relationships);
      expect(goalCategoryPair(label)).toEqual(goalCategoryPair("relationships"));
    }
    expect(goalCategoryColor("My custom category")).toBe(GOAL_CATEGORY_COLORS.other);
  });
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

  it("swaps a category surface for its pigment and passes custom colors through", () => {
    expect(goalCategoryPigment(GOAL_CATEGORY_COLORS.finance)).toBe(COLOR_LIBRARY.malachite.pigment);
    expect(goalCategoryPigment("#123456")).toBe("#123456");
  });
});
