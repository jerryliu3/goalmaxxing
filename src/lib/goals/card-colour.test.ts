import { describe, expect, it } from "vitest";
import { getCategorySwatchColor } from "@/lib/goals/category";
import { cardColourName, categoryChangePatch, colourFollowsCategory } from "./card-colour";

describe("card colour override", () => {
  const health = getCategorySwatchColor("health");

  it("treats the category's own swatch as following the category", () => {
    expect(colourFollowsCategory(health, "health")).toBe(true);
    expect(colourFollowsCategory(health.toUpperCase(), "health")).toBe(true);
    expect(colourFollowsCategory("#8a5a8c", "health")).toBe(false);
  });

  it("recolours on a category change only while the colour follows the category", () => {
    expect(categoryChangePatch({ color: health, category_selection: "health" }, "career")).toEqual({
      category_selection: "career",
      color: getCategorySwatchColor("career"),
    });
    expect(categoryChangePatch({ color: "#8a5a8c", category_selection: "health" }, "career")).toEqual({
      category_selection: "career",
    });
  });

  it("names a colour by palette, not by category", () => {
    expect(cardColourName(health, "health")).toBe("Matches category");
    expect(cardColourName("#8A5A8C", "health")).toBe("Plum");
    expect(cardColourName("#123456", "health")).toBe("Custom");
  });
});
