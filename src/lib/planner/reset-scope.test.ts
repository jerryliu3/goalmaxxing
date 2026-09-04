import { describe, expect, it } from "vitest";
import { buildPlannerHorizonScopeMonths } from "@/lib/planner/reset-scope";

describe("buildPlannerHorizonScopeMonths", () => {
  it("includes scope month, viewed month, and 24 months from as-of", () => {
    const scopeMonths = buildPlannerHorizonScopeMonths({
      asOfDate: "2026-08-15",
      scopeMonth: "2026-08",
      viewedMonth: "2026-10",
    });

    expect(scopeMonths).toContain("2026-08");
    expect(scopeMonths).toContain("2026-10");
    expect(scopeMonths[0]).toBe("2026-08");
    expect(scopeMonths).toContain("2027-07");
    expect(scopeMonths).toHaveLength(24);
  });
});
