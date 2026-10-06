import { describe, expect, it } from "vitest";
import { GOAL_CATEGORY_COLORS } from "@cadence/shared/brand";
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

  it("fills categories from the shared category palette", () => {
    expect(insightsCategoryFill("health")).toBe(GOAL_CATEGORY_COLORS.health);
    expect(insightsCategoryFill("career")).toBe(GOAL_CATEGORY_COLORS.career);
    expect(insightsCategoryFill("mystery")).toBe(GOAL_CATEGORY_COLORS.other);
  });

  it("gives every preset category its own fill, distinct from Other", () => {
    const presets = ["health", "career", "personal", "relationships", "finance"];
    const fills = presets.map(insightsCategoryFill);
    expect(new Set(fills).size).toBe(presets.length);
    expect(fills).not.toContain(insightsCategoryFill("other"));
  });
});
