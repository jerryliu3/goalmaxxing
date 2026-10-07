import { colorPair, type ColorId } from "./colors";

/**
 * Mineral Candy: the category palette study from the brand library (#964).
 * Live category colors still come from the goal_categories table; adopting
 * this means migrating those rows.
 */
export const MINERAL_CANDY_CATEGORIES = {
  health: { label: "Health", colorId: "vermilion" },
  career: { label: "Career", colorId: "klein-blue" },
  personal: { label: "Personal", colorId: "ultraviolet" },
  relationships: { label: "Relationships", colorId: "black-cherry" },
  finance: { label: "Finance", colorId: "malachite" },
  other: { label: "Other", colorId: "saffron" },
} as const satisfies Record<string, { label: string; colorId: ColorId }>;

export function mineralCandyCategoryPair(
  category: keyof typeof MINERAL_CANDY_CATEGORIES,
  appearance: "light" | "dark" = "light"
) {
  return colorPair(MINERAL_CANDY_CATEGORIES[category].colorId, appearance);
}
