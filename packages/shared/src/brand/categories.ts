import { colorPair, COLOR_LIBRARY, type ColorId, type ColorSwatch } from "./colors";

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

// Mobile checklist rows carry the display label. Preserve the canonical key
// and both old labels when resolving the renamed Interpersonal category.
function paletteKey(value: string | null | undefined): GoalCategoryKey {
  const key = value?.trim().toLowerCase() ?? "";
  if (key === "interpersonal" || key === "relationship") return "relationships";
  return isGoalCategoryKey(key) ? key : "other";
}

/** The palette color for a category key or label; custom categories use Other. */
export function goalCategoryColor(categoryKey: string | null | undefined): string {
  return GOAL_CATEGORY_COLORS[paletteKey(categoryKey)];
}

/** Surface and ink for a category, reversed on dark surfaces. */
export function goalCategoryPair(
  categoryKey: string | null | undefined,
  appearance: "light" | "dark" = "light"
) {
  return colorPair(GOAL_CATEGORY_PALETTE[paletteKey(categoryKey)], appearance);
}

const TONES_BY_SURFACE = new Map(
  Object.values(GOAL_CATEGORY_PALETTE).map((colorId) => {
    const swatch: ColorSwatch = COLOR_LIBRARY[colorId];
    return [swatch.surface, { pigment: swatch.pigment ?? swatch.surface, ink: swatch.ink }] as const;
  })
);

/**
 * The authored pigment and ink behind a category surface color, so goal
 * cards can tint and letter in the category's stronger tones. Null for
 * custom colors, which cards derive their tones from instead.
 */
export function goalCategoryTones(
  color: string | null | undefined
): { pigment: string; ink: string } | null {
  return TONES_BY_SURFACE.get(color?.trim().toLowerCase() ?? "") ?? null;
}

/**
 * The hue to mix into paper for a goal color: a category's stronger pigment,
 * since its pastel surface washes out when mixed; custom colors pass through.
 */
export function goalCategoryPigment(color: string): string {
  return goalCategoryTones(color)?.pigment ?? color;
}
