import { describe, expect, it } from "vitest";
import { planDayViewTransitionName } from "@/features/planner/plan-view-transition";

describe("planDayViewTransitionName", () => {
  it("uses a CSS-safe shared name per local date", () => {
    expect(planDayViewTransitionName("2026-09-06")).toBe("plan-day-2026-09-06");
  });
});
