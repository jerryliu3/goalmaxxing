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
import { GAZETTEER } from "@cadence/shared/brand/gazetteer";
import { normalizeCategoryDisplayColor } from "@cadence/shared/brand";
import { getUiStyle, resolveUiStyleId, type UiStyleId } from "@/lib/brand/ui-style";
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
export const WORK_PILL_HUE_AMOUNT = 0.24;
export const WORK_PILL_DRAFT_HUE_AMOUNT = 0.48;
export const WORK_PILL_NEW_DRAFT_HUE_AMOUNT = 0.62;
const ORIGINAL_WORK_PILL_PAPER = "#ffffff";
const WORK_PILL_INK = "#1c1917";
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

export function toStyleDisplayColor(color: string, styleId?: UiStyleId) {
  const withHash = color.startsWith("#") ? color : `#${color}`;
  if (getUiStyle(resolveUiStyleId(styleId)).remapDisplayColors) {
    return normalizeCategoryDisplayColor(withHash);
  }
  return withHash;
}

export function getDisplayCategorySwatchColor(
  selection: CategorySelection,
  styleId?: UiStyleId
) {
  return toStyleDisplayColor(getCategorySwatchColor(selection), styleId);
}

export function normalizeGoalColor(color: string | null, styleId?: UiStyleId) {
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

function parseHexChannels(hex: string): [number, number, number] {
  const normalized = hex.startsWith("#") ? hex.slice(1) : hex;
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function toHexChannel(value: number) {
  return Math.round(Math.min(255, Math.max(0, value)))
    .toString(16)
    .padStart(2, "0");
}

export function mixOpaqueHex(hex: string, paper: string, amount: number): string {
  const [red, green, blue] = parseHexChannels(hex);
  const [paperRed, paperGreen, paperBlue] = parseHexChannels(paper);
  const rest = 1 - amount;
  return `#${toHexChannel(red * amount + paperRed * rest)}${toHexChannel(
    green * amount + paperGreen * rest
  )}${toHexChannel(blue * amount + paperBlue * rest)}`;
}

function workPillPaper(styleId?: UiStyleId) {
  return getUiStyle(resolveUiStyleId(styleId)).remapDisplayColors
    ? GAZETTEER.paper
    : ORIGINAL_WORK_PILL_PAPER;
}

function srgbChannel(value: number) {
  const channel = value / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

export function contrastingInkForColor(color: string, styleId?: UiStyleId) {
  const hex = toStyleDisplayColor(
    normalizeGoalColor(color, styleId) ?? FALLBACK_COLORS[0],
    styleId
  );
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  const luminance =
    0.2126 * srgbChannel(red) +
    0.7152 * srgbChannel(green) +
    0.0722 * srgbChannel(blue);
  return luminance > 0.55 ? "#1c1917" : "#ffffff";
}

export function getWorkPillFillStyle(color: string, credited = false, styleId?: UiStyleId) {
  const hex = toStyleDisplayColor(
    normalizeGoalColor(color, styleId) ?? FALLBACK_COLORS[0],
    styleId
  );
  const fill = mixOpaqueHex(hex, workPillPaper(styleId), credited ? WORK_PILL_HUE_AMOUNT * 0.45 : WORK_PILL_HUE_AMOUNT);
  return {
    backgroundColor: fill,
    borderColor: fill,
    color: credited ? "#57534e" : WORK_PILL_INK,
  };
}

export function getWorkPillDraftFillStyle(
  color: string,
  kind: "moved_to" | "new",
  styleId?: UiStyleId
) {
  const hex = toStyleDisplayColor(
    normalizeGoalColor(color, styleId) ?? FALLBACK_COLORS[0],
    styleId
  );
  const amount =
    kind === "new" ? WORK_PILL_NEW_DRAFT_HUE_AMOUNT : WORK_PILL_DRAFT_HUE_AMOUNT;
  const fill = mixOpaqueHex(hex, workPillPaper(styleId), amount);
  const border = mixOpaqueHex(hex, workPillPaper(styleId), Math.min(1, amount + 0.18));
  return {
    backgroundColor: fill,
    borderColor: border,
    color: contrastingInkForColor(fill, styleId),
  };
}

export function getGoalVisual(input: GoalVisualInput, styleId?: UiStyleId): GoalVisual {
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
