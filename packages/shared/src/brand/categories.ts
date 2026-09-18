import { z } from "zod";
import { getColorPair, type ColorId } from "./colors";

/** Category identity is independent of the brand theme. Stored custom colors remain user-owned. */
export const GOAL_CATEGORY_DESIGN = {
  health: { label: "Health", colorId: "vermilion", sortOrder: 10 },
  career: { label: "Career", colorId: "klein-blue", sortOrder: 20 },
  personal: { label: "Personal", colorId: "ultraviolet", sortOrder: 30 },
  relationships: { label: "Relationships", colorId: "black-cherry", sortOrder: 40 },
  finance: { label: "Finance", colorId: "malachite", sortOrder: 50 },
  other: { label: "Other", colorId: "saffron", sortOrder: 999 },
} as const satisfies Record<string, { label: string; colorId: ColorId; sortOrder: number }>;

export type GoalCategoryDesignId = keyof typeof GOAL_CATEGORY_DESIGN;
export const GOAL_CATEGORY_DESIGN_IDS = Object.keys(GOAL_CATEGORY_DESIGN) as [
  GoalCategoryDesignId, ...GoalCategoryDesignId[],
];
export const goalCategoryDesignIdSchema = z.enum(GOAL_CATEGORY_DESIGN_IDS);

/** Mineral Candy treatment: rich surface + deep ink, reversed for dark surfaces. */
export function getCategoryColorPair(category: GoalCategoryDesignId, appearance: "light" | "dark" = "light") {
  return getColorPair(GOAL_CATEGORY_DESIGN[category].colorId, appearance);
}
export const MINERAL_CANDY_CATEGORY_COLORS = GOAL_CATEGORY_DESIGN_IDS.map(
  (id) => GOAL_CATEGORY_DESIGN[id].colorId
);
