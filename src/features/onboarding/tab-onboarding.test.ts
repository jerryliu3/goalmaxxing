import { afterEach, describe, expect, it } from "vitest";
import {
  TAB_ONBOARDING_COMPLETED_PREFIX,
  clearAllTabOnboardingProgress,
  isTabOnboardingCompleted,
  markTabOnboardingCompleted,
} from "@/features/onboarding/tab-onboarding";

describe("tab onboarding storage", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("clears every completed key by prefix, including unknown suffixes", () => {
    markTabOnboardingCompleted("insights.main");
    window.localStorage.setItem(
      `${TAB_ONBOARDING_COMPLETED_PREFIX}future.surface`,
      "done"
    );
    window.localStorage.setItem("unrelated", "keep");

    clearAllTabOnboardingProgress();

    expect(isTabOnboardingCompleted("insights.main")).toBe(false);
    expect(
      window.localStorage.getItem(`${TAB_ONBOARDING_COMPLETED_PREFIX}future.surface`)
    ).toBeNull();
    expect(window.localStorage.getItem("unrelated")).toBe("keep");
  });
});
