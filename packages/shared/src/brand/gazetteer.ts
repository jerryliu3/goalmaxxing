import type { ThemeTokenName } from "../tokens";

/**
 * Production Gazetteer lock (paper, walnut, stamp rust, sage/copper chrome, Nest).
 * Keep hexes here so web, native, planner fills, and chrome share one palette.
 */
export const GAZETTEER = {
  page: "#f3ead8",
  paper: "#f8f1e3",
  ink: "#241c14",
  muted: "#7a6a56",
  mutedDeep: "#5c4e3f",
  rule: "#d4c4a4",
  stamp: "#9a4f2c",
  stampLight: "#c88968",
  gain: "#4a6740",
  sage: "#6f8175",
  recover: "#eab308",
  colRust: "#b5522a",
} as const;

export const GAZETTEER_CATEGORY_COLORS = {
  health: GAZETTEER.gain,
  career: GAZETTEER.stamp,
  personal: GAZETTEER.mutedDeep,
  relationships: GAZETTEER.colRust,
  other: GAZETTEER.muted,
} as const;

export const GAZETTEER_FALLBACK_COLORS = [
  GAZETTEER.stamp,
  GAZETTEER.gain,
  GAZETTEER.mutedDeep,
  GAZETTEER.colRust,
  GAZETTEER.muted,
  "#8a6a3a",
  "#3f4a3a",
  "#6e341c",
] as const;

export const GAZETTEER_HEATMAP_SCALE = [
  "#efe4d0",
  "#e2c4b0",
  "#c88968",
  "#9a4f2c",
  "#6e341c",
] as const;

export const GAZETTEER_RADIUS_PX = {
  sm: 8,
  md: 12,
  lg: 16,
} as const;

export type GazetteerThemeColors = Record<ThemeTokenName, string> & {
  page: string;
  gain: string;
  recover: string;
};

export const gazetteerLightTheme: GazetteerThemeColors = {
  background: GAZETTEER.page,
  foreground: GAZETTEER.ink,
  card: GAZETTEER.paper,
  cardForeground: GAZETTEER.ink,
  popover: GAZETTEER.paper,
  popoverForeground: GAZETTEER.ink,
  primary: GAZETTEER.stamp,
  primaryForeground: GAZETTEER.paper,
  secondary: "#efe4d0",
  secondaryForeground: GAZETTEER.ink,
  muted: "#efe4d0",
  mutedForeground: GAZETTEER.muted,
  accent: "#e8d9c0",
  accentForeground: GAZETTEER.ink,
  destructive: GAZETTEER.stamp,
  border: GAZETTEER.rule,
  input: GAZETTEER.rule,
  ring: GAZETTEER.stamp,
  page: GAZETTEER.page,
  gain: GAZETTEER.gain,
  recover: GAZETTEER.recover,
};

export const gazetteerDarkTheme: GazetteerThemeColors = {
  background: "#1c1610",
  foreground: GAZETTEER.page,
  card: GAZETTEER.ink,
  cardForeground: GAZETTEER.page,
  popover: GAZETTEER.ink,
  popoverForeground: GAZETTEER.page,
  primary: GAZETTEER.stampLight,
  primaryForeground: "#1c1610",
  secondary: "#2a2218",
  secondaryForeground: GAZETTEER.page,
  muted: "#2a2218",
  mutedForeground: "#c4b49a",
  accent: "#3a2f24",
  accentForeground: GAZETTEER.page,
  destructive: GAZETTEER.stampLight,
  border: GAZETTEER.mutedDeep,
  input: GAZETTEER.mutedDeep,
  ring: GAZETTEER.stampLight,
  page: "#1c1610",
  gain: GAZETTEER.gain,
  recover: GAZETTEER.recover,
};

const LEGACY_GOAL_COLOR_TO_GAZETTEER: Record<string, string> = {
  "#10b981": GAZETTEER_CATEGORY_COLORS.health,
  "#8b5cf6": GAZETTEER_CATEGORY_COLORS.career,
  "#6366f1": GAZETTEER_CATEGORY_COLORS.personal,
  "#f43f5e": GAZETTEER_CATEGORY_COLORS.relationships,
  "#64748b": GAZETTEER_CATEGORY_COLORS.other,
  "#22c55e": GAZETTEER.gain,
  "#2563eb": GAZETTEER.stamp,
  "#7c3aed": GAZETTEER.stamp,
  "#0891b2": GAZETTEER.mutedDeep,
  "#0f766e": GAZETTEER.gain,
  "#15803d": GAZETTEER.gain,
  "#ca8a04": "#8a6a3a",
  "#c2410c": GAZETTEER.colRust,
  "#be123c": GAZETTEER.colRust,
};

export function toGazetteerDisplayColor(color: string): string {
  const withHash = color.startsWith("#") ? color : `#${color}`;
  return LEGACY_GOAL_COLOR_TO_GAZETTEER[withHash.toLowerCase()] ?? withHash;
}

export function gazetteerCategoryColor(category: string | null | undefined): string {
  const normalized = category?.trim().toLowerCase() ?? "";
  if (normalized === "health") {
    return GAZETTEER_CATEGORY_COLORS.health;
  }
  if (normalized === "career") {
    return GAZETTEER_CATEGORY_COLORS.career;
  }
  if (normalized === "personal") {
    return GAZETTEER_CATEGORY_COLORS.personal;
  }
  if (normalized === "relationships") {
    return GAZETTEER_CATEGORY_COLORS.relationships;
  }
  return GAZETTEER_CATEGORY_COLORS.other;
}

export function gazetteerFillForGoal(
  color: string | null | undefined,
  category: string | null | undefined
): string {
  const trimmed = color?.trim();
  if (trimmed) {
    return toGazetteerDisplayColor(trimmed);
  }
  return gazetteerCategoryColor(category);
}

export function getGazetteerHeatmapScaleHex(count: number) {
  if (count <= 0) {
    return GAZETTEER_HEATMAP_SCALE[0];
  }
  if (count === 1) {
    return GAZETTEER_HEATMAP_SCALE[1];
  }
  if (count === 2) {
    return GAZETTEER_HEATMAP_SCALE[2];
  }
  if (count === 3) {
    return GAZETTEER_HEATMAP_SCALE[3];
  }
  return GAZETTEER_HEATMAP_SCALE[4];
}
