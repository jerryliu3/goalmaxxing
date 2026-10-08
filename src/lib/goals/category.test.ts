import { describe, expect, it } from "vitest";
import { GOAL_CATEGORY_COLORS } from "@cadence/shared/brand";
import {
  buildCategoryFilterOptions,
  categoryFilterValue,
  CATEGORY_CUSTOM_VALUE,
  DEFAULT_GOAL_CATEGORIES,
  getCategoryBadgeStyle,
  getCategoryKeyForSelection,
  getCategorySelectionFromValue,
  getCategoryValueForWrite,
  resolveCategoryKey,
} from "@/lib/goals/category";

describe("goal category helpers", () => {
  it("resolves explicit labels/keys and keeps unknowns on other", () => {
    expect(resolveCategoryKey("Health", DEFAULT_GOAL_CATEGORIES)).toBe("health");
    expect(resolveCategoryKey("career", DEFAULT_GOAL_CATEGORIES)).toBe("career");
    expect(resolveCategoryKey("fitness", DEFAULT_GOAL_CATEGORIES)).toBe("other");
  });

  it("treats unknown labels as custom when category key is other", () => {
    expect(
      getCategorySelectionFromValue("Learning Japanese", DEFAULT_GOAL_CATEGORIES, "other")
    ).toEqual({
      selection: CATEGORY_CUSTOM_VALUE,
      customValue: "Learning Japanese",
    });
  });

  it("returns explicit category keys from selection writes", () => {
    expect(
      getCategoryValueForWrite("health", "ignored", DEFAULT_GOAL_CATEGORIES)
    ).toEqual({
      category: "Health",
      categoryKey: "health",
    });
    expect(
      getCategoryValueForWrite(
        CATEGORY_CUSTOM_VALUE,
        "Deep Work",
        DEFAULT_GOAL_CATEGORIES
      )
    ).toEqual({
      category: "Deep Work",
      categoryKey: "other",
    });
  });

  it("keeps defaults constrained to fixed category keys", () => {
    expect(DEFAULT_GOAL_CATEGORIES.map((category) => category.key)).toEqual([
      "health",
      "career",
      "personal",
      "relationships",
      "finance",
      "other",
    ]);
    expect(DEFAULT_GOAL_CATEGORIES.find((category) => category.key === "relationships")?.label).toBe(
      "Interpersonal"
    );
  });

  it("resolves the Finance preset like the other presets", () => {
    expect(
      getCategorySelectionFromValue("Finance", DEFAULT_GOAL_CATEGORIES, "finance").selection
    ).toBe("finance");
    expect(resolveCategoryKey("Finance", DEFAULT_GOAL_CATEGORIES)).toBe("finance");
    expect(getCategoryKeyForSelection("finance")).toBe("finance");
    expect(getCategoryBadgeStyle("finance")?.backgroundColor).toBe(GOAL_CATEGORY_COLORS.finance);
    expect(getCategoryBadgeStyle("Relationships")?.backgroundColor).toBe(
      GOAL_CATEGORY_COLORS.relationships
    );
    expect(getCategoryBadgeStyle("Deep Work")).toBeUndefined();
  });

  it("gives defaults their key and each custom label its own filter value", () => {
    expect(categoryFilterValue("Health", "health")).toBe("health");
    expect(categoryFilterValue("Relationships")).toBe("relationships");
    expect(categoryFilterValue("Other", "other")).toBe("other");
    expect(categoryFilterValue("Music", "other")).toBe("custom:music");
    expect(categoryFilterValue(" music ")).toBe("custom:music");
  });

  it("lists every default category, then the custom labels goals use", () => {
    const options = buildCategoryFilterOptions([
      { category: "Music", category_key: "other" },
      { category: "Health", category_key: "health" },
      { category: "music" },
      { category: "Deep Work", category_key: "other" },
    ]);

    expect(options.map((option) => option.value)).toEqual([
      ...DEFAULT_GOAL_CATEGORIES.map((category) => category.key),
      "custom:deep work",
      "custom:music",
    ]);
    expect(options.at(-1)).toEqual({ value: "custom:music", label: "Music" });
  });
});
