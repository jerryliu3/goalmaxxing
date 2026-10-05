import { afterEach, describe, expect, it } from "vitest";
import {
  TAB_ONBOARDING_COMPLETED_PREFIX,
  TAB_ONBOARDING_TOURS,
  clearAllTabOnboardingProgress,
  isTabOnboardingCompleted,
  markTabOnboardingCompleted,
} from "@/features/onboarding/tab-onboarding";

describe("tab onboarding storage", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("treats missing keys as incomplete in the browser", () => {
    expect(isTabOnboardingCompleted("insights.main")).toBe(false);
  });

  it("clears every completed key by prefix, including leftover suffixes", () => {
    markTabOnboardingCompleted("insights.main");
    markTabOnboardingCompleted("planner.calendar");
    window.localStorage.setItem(
      `${TAB_ONBOARDING_COMPLETED_PREFIX}settings.profile`,
      "done"
    );
    window.localStorage.setItem("unrelated", "keep");
    expect(isTabOnboardingCompleted("insights.main")).toBe(true);

    clearAllTabOnboardingProgress();

    expect(isTabOnboardingCompleted("insights.main")).toBe(false);
    expect(isTabOnboardingCompleted("planner.calendar")).toBe(false);
    expect(
      window.localStorage.getItem(`${TAB_ONBOARDING_COMPLETED_PREFIX}insights.main`)
    ).toBeNull();
    expect(
      window.localStorage.getItem(`${TAB_ONBOARDING_COMPLETED_PREFIX}settings.profile`)
    ).toBeNull();
    expect(window.localStorage.getItem("unrelated")).toBe("keep");
  });

  it("keeps community, insights, and calendar tours on the intended targets", () => {
    expect(TAB_ONBOARDING_TOURS["social.main"].map((step) => step.target)).toEqual([
      "social.leaderboards",
      "social.team",
    ]);
    expect(TAB_ONBOARDING_TOURS["insights.main"].map((step) => step.target)).toEqual([
      "insights.achievements",
      "insights.past-goals",
    ]);
    expect(TAB_ONBOARDING_TOURS["planner.calendar"].map((step) => [
      step.target,
      ...(step.fallbackTargets ?? []),
    ])).toEqual([
      ["planner.calendar.controls"],
      ["planner.calendar.today", "planner.calendar.item", "planner.calendar.board"],
    ]);
  });
});
