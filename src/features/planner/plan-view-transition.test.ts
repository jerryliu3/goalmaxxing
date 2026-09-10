import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PLAN_MORPH_CLASS,
  PLAN_VIEW_SWAP_CLASS,
  planDayViewTransitionName,
  planEntryViewTransitionName,
  runPlanViewTransition,
} from "@/features/planner/plan-view-transition";

describe("plan view transition names", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

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

  it("updates inside startViewTransition so the browser can snapshot both views", () => {
    const update = vi.fn();
    const startViewTransition = vi.fn((callback: () => void) => {
      callback();
      return {
        finished: Promise.resolve(),
        ready: Promise.resolve(),
        skipTransition: () => {},
      };
    });
    vi.stubGlobal("document", {
      ...document,
      startViewTransition,
    });
    vi.stubGlobal(
      "window",
      Object.assign(window, {
        matchMedia: vi.fn().mockReturnValue({
          matches: false,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }),
      })
    );

    runPlanViewTransition(update);

    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("still updates when the View Transition API is missing", () => {
    const update = vi.fn();
    vi.stubGlobal("document", {
      ...document,
      startViewTransition: undefined,
    });

    runPlanViewTransition(update);

    expect(update).toHaveBeenCalledTimes(1);
  });
});
