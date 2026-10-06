import { type CategorySelection, getCategorySwatchColor } from "@/lib/goals/category";

/** Card colours offered as overrides, named so they never read as categories. */
export const CARD_COLOURS: ReadonlyArray<{ name: string; hex: string }> = [
  { name: "Stamp", hex: "#9a4f2c" },
  { name: "Rust", hex: "#b5522a" },
  { name: "Clay", hex: "#c88968" },
  { name: "Ochre", hex: "#8a6a3a" },
  { name: "Moss", hex: "#4a6740" },
  { name: "Sage", hex: "#6f8175" },
  { name: "Pine", hex: "#3f4a3a" },
  { name: "Earth", hex: "#5c4e3f" },
  { name: "Sky", hex: "#5b8db8" },
  { name: "Plum", hex: "#8a5a8c" },
];

/** A card colour tracks its category until someone picks a colour of their own. */
export function colourFollowsCategory(color: string, category: CategorySelection): boolean {
  return color.trim().toLowerCase() === getCategorySwatchColor(category).toLowerCase();
}

/**
 * The patch for a category change: the card is recoloured only while its colour still
 * follows the old category, so a chosen colour survives later category changes.
 */
export function categoryChangePatch(
  current: { color: string; category_selection: CategorySelection },
  next: CategorySelection,
): { category_selection: CategorySelection; color?: string } {
  return colourFollowsCategory(current.color, current.category_selection)
    ? { category_selection: next, color: getCategorySwatchColor(next) }
    : { category_selection: next };
}

export function cardColourName(color: string, category: CategorySelection): string {
  if (colourFollowsCategory(color, category)) return "Matches category";
  const hex = color.trim().toLowerCase();
  return CARD_COLOURS.find((colour) => colour.hex === hex)?.name ?? "Custom";
}
