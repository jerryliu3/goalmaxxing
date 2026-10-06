import { describe, expect, it } from "vitest";
import {
  PLAN_MORPH_CLASS,
  PLAN_VIEW_SWAP_CLASS,
  planDayViewTransitionName,
  planEntryViewTransitionName,
  planMorphEasing,
  smootherstep,
} from "@/features/planner/plan-view-transition";

describe("plan view transition names", () => {
  it("uses a CSS-safe shared name per local date", () => {
    expect(planDayViewTransitionName("2026-09-06")).toBe("plan-day-2026-09-06");
  });

  it("sanitizes entry keys for CSS view-transition names", () => {
    expect(planEntryViewTransitionName("goal-a:total:1")).toBe("plan-entry-goal-a-total-1");
  });

  it("shares one morph class for day surfaces and session pills", () => {
    expect(PLAN_MORPH_CLASS).toBe("plan-morph");
    expect(PLAN_VIEW_SWAP_CLASS).toBe("plan-view-swap");
  });
});

describe("plan morph easing", () => {
  it("starts and ends at rest", () => {
    expect(smootherstep(0)).toBe(0);
    expect(smootherstep(0.5)).toBe(0.5);
    expect(smootherstep(1)).toBe(1);
    expect(smootherstep(0.02)).toBeLessThan(0.001);
  });

  it("falls back to a cubic where CSS linear() is unavailable", () => {
    // jsdom has no CSS.supports.
    expect(planMorphEasing()).toBe("cubic-bezier(0.65, 0, 0.35, 1)");
  });
});
