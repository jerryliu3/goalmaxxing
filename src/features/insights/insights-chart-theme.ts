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

const CATEGORY_FILLS: Record<string, string> = {
  health: "var(--gm-gain)",
  career: "var(--primary)",
  personal: "var(--secondary-foreground)",
  relationships: "color-mix(in srgb, var(--primary) 62%, var(--gm-recover))",
  other: "var(--muted-foreground)",
};

export function insightsCategoryFill(categoryKey: string) {
  return CATEGORY_FILLS[categoryKey] ?? CATEGORY_FILLS.other;
}
