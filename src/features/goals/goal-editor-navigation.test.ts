import { describe, expect, it, vi } from "vitest";
import type { useAppRouter } from "@/lib/navigation/use-app-router";
import {
  completeGoalEditor,
  dismissGoalEditor,
  goalEditorFallbackHref,
  isGoalSheetPath,
} from "@/features/goals/goal-editor-navigation";

function createRouterMock() {
  return {
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
  } satisfies ReturnType<typeof useAppRouter>;
}

describe("goal editor navigation", () => {
  it("falls back to the calendar when browser history is empty", () => {
    const router = createRouterMock();

    dismissGoalEditor(router);

    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith(goalEditorFallbackHref);
  });

  it("uses browser back when history is available", () => {
    const router = createRouterMock();
    window.history.pushState({}, "", "/calendar");
    window.history.pushState({}, "", "/goals/goal-1");

    dismissGoalEditor(router);

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("refreshes after dismissing on complete", () => {
    const router = createRouterMock();
    window.history.pushState({}, "", "/calendar");
    window.history.pushState({}, "", "/goals/goal-1");

    completeGoalEditor(router);

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.refresh).toHaveBeenCalledTimes(1);
  });
});

describe("goal sheet paths", () => {
  it("matches the routes the goal sheet opens over the current page", () => {
    expect(isGoalSheetPath("/goals/new")).toBe(true);
    expect(isGoalSheetPath("/goals/10000000-0000-4000-8000-000000000005")).toBe(true);
    expect(isGoalSheetPath("/demo/goals/abc")).toBe(true);
    expect(isGoalSheetPath("/goals")).toBe(false);
    expect(isGoalSheetPath("/goals/library")).toBe(false);
    expect(isGoalSheetPath("/goals/bulk")).toBe(false);
    expect(isGoalSheetPath("/calendar")).toBe(false);
  });
});
