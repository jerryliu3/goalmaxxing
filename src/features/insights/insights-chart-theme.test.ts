import { describe, expect, it } from "vitest";
import {
  INSIGHTS_CHART_COLORS,
  insightsCategoryFill,
} from "@/features/insights/insights-chart-theme";

describe("insights chart theme", () => {
  it("uses theme tokens instead of hardcoded greens", () => {
    expect(INSIGHTS_CHART_COLORS.primary).toBe("var(--primary)");
    expect(INSIGHTS_CHART_COLORS.secondary).toBe("var(--gm-gain)");
    expect(INSIGHTS_CHART_COLORS.highlight).toBe("var(--gm-recover)");
  });

  it("maps known categories onto themed fills", () => {
    expect(insightsCategoryFill("health")).toBe("var(--gm-gain)");
    expect(insightsCategoryFill("career")).toBe("var(--primary)");
    expect(insightsCategoryFill("mystery")).toBe("var(--muted-foreground)");
  });
});
