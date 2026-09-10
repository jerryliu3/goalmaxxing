import { describe, expect, it } from "vitest";
import {
  PLAN_MORPH_CLASS,
  PLAN_VIEW_SWAP_CLASS,
  planDayViewTransitionName,
  planEntryViewTransitionName,
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
