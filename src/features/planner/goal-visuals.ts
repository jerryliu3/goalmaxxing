import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Briefcase,
  Dumbbell,
  Heart,
  Lightbulb,
  Rocket,
  Star,
  Target,
} from "lucide-react";
import { toGazetteerDisplayColor } from "@cadence/shared/brand/gazetteer";
import { getTheme, goalCategoryPigment, type ThemeId } from "@cadence/shared/brand";
import { resolveUiStyleId } from "@/lib/brand/ui-style";
import {
  getCategorySwatchColor,
  resolveCategoryKey,
  type CategoryPresetId,
  type CategorySelection,
} from "@/lib/goals/category";

const GOAL_ICONS: readonly LucideIcon[] = [
  Target,
  Rocket,
  BookOpen,
  Briefcase,
  Dumbbell,
  Heart,
  Lightbulb,
  Star,
];

const FALLBACK_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#0891b2",
  "#0f766e",
  "#15803d",
  "#ca8a04",
  "#c2410c",
  "#be123c",
] as const;

const HEX_COLOR_REGEX = /^#?[0-9a-f]{6}$/i;
/** Width of a work pill's goal-colour edge; matches Goal View's lane labels. */
export const WORK_PILL_EDGE_PX = 3;
/** How much goal colour a draft placement mixes into the page behind it. */
export const WORK_PILL_DRAFT_HUE_PERCENT = 30;
export const WORK_PILL_NEW_DRAFT_HUE_PERCENT = 42;
type GoalVisualCategoryKey = Exclude<CategoryPresetId, "other">;

export interface GoalVisualInput {
  goalId: string;
  color: string | null;
  category: string | null;
}

export interface GoalVisual {
  Icon: LucideIcon;
  color: string;
}

function stableHash(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

export function toStyleDisplayColor(color: string, styleId?: ThemeId) {
  const withHash = color.startsWith("#") ? color : `#${color}`;
  if (getTheme(resolveUiStyleId(styleId)).remapDisplayColors) {
    return toGazetteerDisplayColor(withHash);
  }
  return withHash;
}

export function getDisplayCategorySwatchColor(
  selection: CategorySelection,
  styleId?: ThemeId
) {
  return toStyleDisplayColor(getCategorySwatchColor(selection), styleId);
}

export function normalizeGoalColor(color: string | null, styleId?: ThemeId) {
  if (!color) {
    return null;
  }
  const trimmed = color.trim();
  if (!HEX_COLOR_REGEX.test(trimmed)) {
    return null;
  }
  const hex = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return toStyleDisplayColor(hex, styleId);
}

function resolveCategorySwatchColor(category: string | null): string | null {
  if (!category || category.trim().length === 0) {
    return null;
  }
  const categoryKey = resolveCategoryKey(category);
  if (categoryKey === "other") {
    // Preserve goal-level colors for custom/unknown categories instead of forcing "other".
    return null;
  }
  return getCategorySwatchColor(categoryKey as GoalVisualCategoryKey);
}

function workPillGoalColor(color: string, styleId?: ThemeId) {
  return goalCategoryPigment(
    toStyleDisplayColor(normalizeGoalColor(color, styleId) ?? FALLBACK_COLORS[0], styleId)
  );
}

/**
 * Work pills share one neutral surface in every theme, so they sit quietly on
 * light and dark pages alike. The goal colour is a 3px left edge, the same
 * mark Goal View's lane labels carry, so it costs the title no room.
 */
export function getWorkPillFillStyle(
  color: string,
  credited = false,
  styleId?: ThemeId
): CSSProperties {
  return {
    backgroundColor: "var(--muted)",
    borderColor: "transparent",
    borderLeftColor: workPillGoalColor(color, styleId),
    borderLeftWidth: WORK_PILL_EDGE_PX,
    color: credited ? "var(--muted-foreground)" : "var(--foreground)",
  };
}

/** Draft placements stand out with the goal colour mixed into the page itself. */
export function getWorkPillDraftFillStyle(
  color: string,
  kind: "moved_to" | "new",
  styleId?: ThemeId
): CSSProperties {
  const hex = workPillGoalColor(color, styleId);
  const percent =
    kind === "new" ? WORK_PILL_NEW_DRAFT_HUE_PERCENT : WORK_PILL_DRAFT_HUE_PERCENT;
  return {
    backgroundColor: `color-mix(in srgb, ${hex} ${percent}%, var(--background))`,
    borderColor: hex,
    borderLeftWidth: WORK_PILL_EDGE_PX,
    color: "var(--foreground)",
  };
}

export function getGoalVisual(input: GoalVisualInput, styleId?: ThemeId): GoalVisual {
  const hash = stableHash(input.goalId);
  const categoryColor = resolveCategorySwatchColor(input.category);
  return {
    Icon: GOAL_ICONS[hash % GOAL_ICONS.length],
    color: toStyleDisplayColor(
      categoryColor ??
        normalizeGoalColor(input.color, styleId) ??
        FALLBACK_COLORS[hash % FALLBACK_COLORS.length],
      styleId
    ),
  };
}
