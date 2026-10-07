import { goalCategoryColor } from "@cadence/shared/brand";

export const INSIGHTS_CHART_COLORS = {
  primary: "var(--primary)",
  secondary: "var(--gm-gain)",
  accent: "color-mix(in srgb, var(--primary) 55%, var(--gm-gain))",
  highlight: "var(--gm-recover)",
  grid: "color-mix(in srgb, var(--border) 80%, transparent)",
  axis: "var(--muted-foreground)",
  tooltipBg: "var(--popover)",
  tooltipText: "var(--popover-foreground)",
  tooltipBorder: "var(--border)",
  cursor: "color-mix(in srgb, var(--primary) 12%, transparent)",
} as const;

/** Categories keep their shared palette color in every theme. */
export function insightsCategoryFill(categoryKey: string) {
  return goalCategoryColor(categoryKey);
}
