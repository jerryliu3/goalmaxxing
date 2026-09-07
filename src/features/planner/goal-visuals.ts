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
import {
  GAZETTEER_FALLBACK_COLORS,
  toGazetteerDisplayColor,
} from "@/lib/brand/gazetteer";
import {
  getCategorySwatchColor,
  resolveCategoryKey,
  type CategoryPresetId,
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

const FALLBACK_COLORS = GAZETTEER_FALLBACK_COLORS;

const HEX_COLOR_REGEX = /^#?[0-9a-f]{6}$/i;
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

export function normalizeGoalColor(color: string | null) {
  if (!color) {
    return null;
  }
  const trimmed = color.trim();
  if (!HEX_COLOR_REGEX.test(trimmed)) {
    return null;
  }
  const hex = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return toGazetteerDisplayColor(hex);
}

function resolveCategorySwatchColor(category: string | null): string | null {
  if (!category || category.trim().length === 0) {
    return null;
  }
  const categoryKey = resolveCategoryKey(category);
  if (
    categoryKey !== "health" &&
    categoryKey !== "career" &&
    categoryKey !== "personal" &&
    categoryKey !== "relationships"
  ) {
    // Preserve goal-level colors for custom/unknown categories instead of forcing "other".
    return null;
  }
  return getCategorySwatchColor(categoryKey as GoalVisualCategoryKey);
}

export function colorWithAlpha(color: string, alpha: number) {
  const hex = normalizeGoalColor(color) ?? FALLBACK_COLORS[0];
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function getWorkPillFillStyle(color: string, credited = false) {
  return {
    backgroundColor: colorWithAlpha(color, credited ? 0.4 : 0.18),
    borderColor: color,
  };
}

export function getGoalVisual(input: GoalVisualInput): GoalVisual {
  const hash = stableHash(input.goalId);
  const categoryColor = resolveCategorySwatchColor(input.category);
  return {
    Icon: GOAL_ICONS[hash % GOAL_ICONS.length],
    color: toGazetteerDisplayColor(
      categoryColor ??
        normalizeGoalColor(input.color) ??
        FALLBACK_COLORS[hash % FALLBACK_COLORS.length]
    ),
  };
}
