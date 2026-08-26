import { describe, expect, it, vi } from "vitest";
import {
  completeGoalEditor,
  dismissGoalEditor,
  goalEditorFallbackHref,
} from "@/features/goals/goal-editor-navigation";

describe("goal editor navigation", () => {
  it("falls back to the calendar when browser history is empty", () => {
    const router = {
      back: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
    };

    dismissGoalEditor(router);

    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith(goalEditorFallbackHref);
  });

  it("uses browser back when history is available", () => {
    const router = {
      back: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
    };
    window.history.pushState({}, "", "/calendar");
    window.history.pushState({}, "", "/goals/goal-1");

    dismissGoalEditor(router);

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("refreshes after dismissing on complete", () => {
    const router = {
      back: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
    };
    window.history.pushState({}, "", "/calendar");
    window.history.pushState({}, "", "/goals/goal-1");

    completeGoalEditor(router);

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.refresh).toHaveBeenCalledTimes(1);
  });
});
