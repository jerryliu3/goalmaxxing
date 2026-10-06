import { colorPair, COLOR_LIBRARY, type ColorId } from "./colors";

/**
 * Goal category colors: the Mineral Candy palette from the brand library,
 * shared by every theme. Each category is a surface/ink pair, so text on a
 * category fill uses its authored ink instead of a computed contrast color.
 * The goal_categories table holds the same surfaces (see the migration that
 * adopted this palette); keep the two in step.
 */
export const GOAL_CATEGORY_PALETTE = {
  health: "vermilion",
  career: "klein-blue",
  personal: "ultraviolet",
  relationships: "black-cherry",
  finance: "malachite",
  other: "saffron",
} as const satisfies Record<string, ColorId>;

export type GoalCategoryKey = keyof typeof GOAL_CATEGORY_PALETTE;

export const GOAL_CATEGORY_COLORS = Object.fromEntries(
  Object.entries(GOAL_CATEGORY_PALETTE).map(([key, colorId]) => [
    key,
    COLOR_LIBRARY[colorId].surface,
  ])
) as Record<GoalCategoryKey, string>;

function isGoalCategoryKey(value: string): value is GoalCategoryKey {
  return Object.prototype.hasOwnProperty.call(GOAL_CATEGORY_PALETTE, value);
}

/** The palette color for a category key; unknown and custom categories use Other. */
export function goalCategoryColor(categoryKey: string | null | undefined): string {
  const key = categoryKey?.trim().toLowerCase() ?? "";
  return GOAL_CATEGORY_COLORS[isGoalCategoryKey(key) ? key : "other"];
}

/** Surface and ink for a category, reversed on dark surfaces. */
export function goalCategoryPair(
  categoryKey: string | null | undefined,
  appearance: "light" | "dark" = "light"
) {
  const key = categoryKey?.trim().toLowerCase() ?? "";
  return colorPair(GOAL_CATEGORY_PALETTE[isGoalCategoryKey(key) ? key : "other"], appearance);
}
