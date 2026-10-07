import { GOAL_CATEGORY_COLORS, goalCategoryTones } from "@cadence/shared/brand";
import { describe, expect, it } from "vitest";
import { goalColorStyle } from "./goal-color-style";

describe("goalColorStyle", () => {
  it("passes a category goal's pigment and ink alongside its color", () => {
    const color = GOAL_CATEGORY_COLORS.finance;
    const tones = goalCategoryTones(color)!;

    expect(goalColorStyle(color)).toEqual({
      "--goal-color": color,
      "--goal-pigment": tones.pigment,
      "--goal-ink": tones.ink,
    });
  });

  it("leaves tones to the CSS fallback for a custom color", () => {
    expect(goalColorStyle("#6366f1")).toEqual({ "--goal-color": "#6366f1" });
  });
});
