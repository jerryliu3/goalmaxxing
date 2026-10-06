import { goalCategoryColor } from "./categories";

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
  ochre: "#8a6a3a",
  recover: "#eab308",
  colRust: "#b5522a",
} as const;

/**
 * Gazetteer's earth-tone category set, used by the /ux studies. The live app
 * colors categories from the shared palette in categories.ts.
 */
export const GAZETTEER_CATEGORY_COLORS = {
  health: GAZETTEER.gain,
  career: GAZETTEER.stamp,
  personal: GAZETTEER.mutedDeep,
  relationships: GAZETTEER.colRust,
  finance: GAZETTEER.ochre,
  other: GAZETTEER.muted,
} as const;

export const GAZETTEER_FALLBACK_COLORS = [
  GAZETTEER.stamp,
  GAZETTEER.gain,
  GAZETTEER.mutedDeep,
  GAZETTEER.colRust,
  GAZETTEER.muted,
  GAZETTEER.ochre,
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

/** Old Tailwind picker colors still saved on custom goals, re-inked for Gazetteer. */
const LEGACY_GOAL_COLOR_TO_GAZETTEER: Record<string, string> = {
  "#10b981": GAZETTEER.gain,
  "#8b5cf6": GAZETTEER.stamp,
  "#6366f1": GAZETTEER.mutedDeep,
  "#f43f5e": GAZETTEER.colRust,
  "#64748b": GAZETTEER.muted,
  "#22c55e": GAZETTEER.gain,
  "#2563eb": GAZETTEER.stamp,
  "#7c3aed": GAZETTEER.stamp,
  "#0891b2": GAZETTEER.mutedDeep,
  "#0f766e": GAZETTEER.gain,
  "#15803d": GAZETTEER.gain,
  "#ca8a04": GAZETTEER.ochre,
  "#c2410c": GAZETTEER.colRust,
  "#be123c": GAZETTEER.colRust,
};

export function toGazetteerDisplayColor(color: string): string {
  const withHash = color.startsWith("#") ? color : `#${color}`;
  return LEGACY_GOAL_COLOR_TO_GAZETTEER[withHash.toLowerCase()] ?? withHash;
}

export function gazetteerFillForGoal(
  color: string | null | undefined,
  category: string | null | undefined
): string {
  const trimmed = color?.trim();
  if (trimmed) {
    return toGazetteerDisplayColor(trimmed);
  }
  return goalCategoryColor(category);
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
