import { z } from "zod";
import { getColorPair, type ColorId } from "./colors";

/** Category identity is independent of the brand theme. Stored custom colors remain user-owned. */
export const GOAL_CATEGORY_DESIGN = {
  health: { label: "Health", colorId: "vermilion", sortOrder: 10 },
  career: { label: "Career", colorId: "klein-blue", sortOrder: 20 },
  personal: { label: "Personal", colorId: "ultraviolet", sortOrder: 30 },
  relationships: {
    label: "Interpersonal",
    colorId: "black-cherry",
    sortOrder: 40,
    aliases: ["Relationships", "Relationship"],
  },
  finance: { label: "Finances", colorId: "malachite", sortOrder: 50, aliases: ["Finance"] },
  other: { label: "Other", colorId: "saffron", sortOrder: 999 },
} as const satisfies Record<
  string,
  { label: string; colorId: ColorId; sortOrder: number; aliases?: readonly string[] }
>;

export type GoalCategoryDesignId = keyof typeof GOAL_CATEGORY_DESIGN;
export const GOAL_CATEGORY_DESIGN_IDS = Object.keys(GOAL_CATEGORY_DESIGN) as [
  GoalCategoryDesignId, ...GoalCategoryDesignId[],
];
export const goalCategoryDesignIdSchema = z.enum(GOAL_CATEGORY_DESIGN_IDS);

export function categoryDesignAliases(id: GoalCategoryDesignId): readonly string[] {
  return GOAL_CATEGORY_DESIGN[id].aliases ?? [];
}

/** Mineral Candy treatment: rich surface + deep ink, reversed for dark surfaces. */
export function getCategoryColorPair(category: GoalCategoryDesignId, appearance: "light" | "dark" = "light") {
  return getColorPair(GOAL_CATEGORY_DESIGN[category].colorId, appearance);
}
export const MINERAL_CANDY_CATEGORY_COLORS = GOAL_CATEGORY_DESIGN_IDS.map(
  (id) => GOAL_CATEGORY_DESIGN[id].colorId
);

export const CATEGORY_COLORS = Object.fromEntries(GOAL_CATEGORY_DESIGN_IDS.map((id) => [id, getCategoryColorPair(id).surface])) as Record<GoalCategoryDesignId, string>;

export function categoryColor(category: string | null | undefined): string {
  const key = category?.trim().toLowerCase();
  return key && Object.hasOwn(CATEGORY_COLORS, key) ? CATEGORY_COLORS[key as GoalCategoryDesignId] : CATEGORY_COLORS.other;
}

export function normalizeCategoryDisplayColor(color: string): string {
  const hex = color.startsWith("#") ? color : `#${color}`;
  const legacy: Record<string, string> = {
    "#10b981": "#4a6740", "#8b5cf6": "#9a4f2c", "#6366f1": "#5c4e3f",
    "#f43f5e": "#b5522a", "#64748b": "#7a6a56",
  };
  return legacy[hex.toLowerCase()] ?? hex;
}

export function categoryFillForGoal(color: string | null | undefined, category: string | null | undefined): string {
  const key = category?.trim().toLowerCase();
  if (key && key !== "other" && Object.hasOwn(CATEGORY_COLORS, key)) return categoryColor(key);
  return color?.trim() ? normalizeCategoryDisplayColor(color.trim()) : categoryColor(category);
}

/** Match authored surfaces so pills retain their authored ink, including in dark mode. */
export function categoryPairForColor(color: string, appearance: "light" | "dark" = "light") {
  const id = GOAL_CATEGORY_DESIGN_IDS.find((id) => CATEGORY_COLORS[id].toLowerCase() === color.toLowerCase());
  return id ? getCategoryColorPair(id, appearance) : null;
}
