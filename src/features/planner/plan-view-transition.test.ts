import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PLAN_ENTRY_MORPH_CLASS,
  PLAN_MORPH_CLASS,
  PLAN_MORPH_PILL_CLASS,
  PLAN_VIEW_ROOT_TRANSITION_NAME,
  PLAN_VIEW_SWAP_CLASS,
  PLAN_VIEW_TRANSITION_CLASS,
  PLAN_VIEW_WEEK_TO_MONTH_CLASS,
  planDayViewTransitionName,
  planEntryViewTransitionName,
  planViewTransitionKind,
  prefersPlanViewMotion,
  runPlanViewTransition,
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
    expect(PLAN_MORPH_PILL_CLASS).toBe("plan-morph-pill");
    expect(PLAN_ENTRY_MORPH_CLASS).toBe("plan-morph plan-morph-pill");
    expect(PLAN_VIEW_SWAP_CLASS).toBe("plan-view-swap");
    expect(PLAN_VIEW_ROOT_TRANSITION_NAME).toBe("plan-view-root");
  });
});

describe("runPlanViewTransition", () => {
  const originalMatchMedia = window.matchMedia;
  const originalStartViewTransition = document.startViewTransition;

  afterEach(() => {
    document.documentElement.classList.remove(
      PLAN_VIEW_TRANSITION_CLASS,
      PLAN_VIEW_WEEK_TO_MONTH_CLASS
    );
    delete document.documentElement.dataset.planPair;
    window.matchMedia = originalMatchMedia;
    if (originalStartViewTransition) {
      document.startViewTransition = originalStartViewTransition;
    } else {
      Reflect.deleteProperty(document, "startViewTransition");
    }
    vi.restoreAllMocks();
  });

  function mockMotionPreference(reduce: boolean) {
    window.matchMedia = vi.fn((query: string) => ({
      matches: reduce && query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;
  }

  function mockStartViewTransition() {
    const skipTransition = vi.fn();
    const startViewTransition = vi.fn((update: () => void) => {
      update();
      return {
        finished: Promise.resolve(),
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        skipTransition,
      };
    });
    document.startViewTransition = startViewTransition as unknown as typeof document.startViewTransition;
    return { skipTransition, startViewTransition };
  }

  it("updates immediately when view transitions are unavailable", () => {
    mockMotionPreference(false);
    Reflect.deleteProperty(document, "startViewTransition");
    const update = vi.fn();

    runPlanViewTransition(update);

    expect(update).toHaveBeenCalledTimes(1);
    expect(document.documentElement).not.toHaveClass(PLAN_VIEW_TRANSITION_CLASS);
  });

  it("updates immediately when the user prefers reduced motion", () => {
    mockMotionPreference(true);
    const { startViewTransition } = mockStartViewTransition();
    const update = vi.fn();

    expect(prefersPlanViewMotion()).toBe(false);
    runPlanViewTransition(update);

    expect(update).toHaveBeenCalledTimes(1);
    expect(startViewTransition).not.toHaveBeenCalled();
  });

  it("captures the update inside startViewTransition", () => {
    mockMotionPreference(false);
    const { startViewTransition } = mockStartViewTransition();
    const update = vi.fn();

    runPlanViewTransition(update);

    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
    expect(document.documentElement).toHaveClass(PLAN_VIEW_TRANSITION_CLASS);
  });

  it("skips an in-flight transition when a new view change starts", () => {
    mockMotionPreference(false);
    const firstSkip = vi.fn();
    let resolveFirst: (() => void) | undefined;
    const firstFinished = new Promise<void>((resolve) => {
      resolveFirst = resolve;
    });
    const startViewTransition = vi
      .fn()
      .mockImplementationOnce((update: () => void) => {
        update();
        return {
          finished: firstFinished,
          ready: Promise.resolve(),
          updateCallbackDone: Promise.resolve(),
          skipTransition: firstSkip,
        };
      })
      .mockImplementationOnce((update: () => void) => {
        update();
        return {
          finished: Promise.resolve(),
          ready: Promise.resolve(),
          updateCallbackDone: Promise.resolve(),
          skipTransition: vi.fn(),
        };
      });
    document.startViewTransition = startViewTransition as unknown as typeof document.startViewTransition;

    runPlanViewTransition(() => {});
    runPlanViewTransition(() => {});
    resolveFirst?.();

    expect(firstSkip).toHaveBeenCalledTimes(1);
    expect(startViewTransition).toHaveBeenCalledTimes(2);
  });
});

describe("planViewTransitionKind", () => {
  it("treats week and month as one grouped scale pair", () => {
    expect(planViewTransitionKind("week", "month")).toBe("week-to-month");
    expect(planViewTransitionKind("month", "week")).toBe("month-to-week");
    expect(planViewTransitionKind("week", "day")).toBe("default");
    expect(planViewTransitionKind("day", "week")).toBe("default");
  });
});

describe("week-to-month scale chrome", () => {
  const originalMatchMedia = window.matchMedia;
  const originalStartViewTransition = document.startViewTransition;

  afterEach(() => {
    document.documentElement.classList.remove(
      PLAN_VIEW_TRANSITION_CLASS,
      PLAN_VIEW_WEEK_TO_MONTH_CLASS
    );
    delete document.documentElement.dataset.planPair;
    window.matchMedia = originalMatchMedia;
    if (originalStartViewTransition) {
      document.startViewTransition = originalStartViewTransition;
    } else {
      Reflect.deleteProperty(document, "startViewTransition");
    }
    vi.restoreAllMocks();
  });

  it("marks week-to-month as the slower scale pair during capture", async () => {
    window.matchMedia = vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;
    const startViewTransition = vi.fn((update: () => void) => {
      expect(document.documentElement.dataset.planPair).toBe("scale");
      expect(document.documentElement).toHaveClass(PLAN_VIEW_WEEK_TO_MONTH_CLASS);
      update();
      return {
        finished: Promise.resolve(),
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        skipTransition: vi.fn(),
      };
    });
    document.startViewTransition =
      startViewTransition as unknown as typeof document.startViewTransition;

    runPlanViewTransition(() => {}, "week-to-month");
    await Promise.resolve();

    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(document.documentElement.dataset.planPair).toBeUndefined();
    expect(document.documentElement).not.toHaveClass(PLAN_VIEW_WEEK_TO_MONTH_CLASS);
  });
});
