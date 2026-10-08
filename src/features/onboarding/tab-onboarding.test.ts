import { describe, expect, it } from "vitest";
import { APP_TAB_TOUR_STEPS, TAB_ONBOARDING_TOURS } from "./tab-onboarding";

describe("onboarding tour targets", () => {
  it("introduces the actual app tabs independently of required setup", () => {
    expect(APP_TAB_TOUR_STEPS.map(step => step.target)).toEqual(["nav.calendar", "nav.goals", "nav.growth", "nav.social"]);
  });
  it("keeps page guides on their owning surfaces", () => {
    expect(TAB_ONBOARDING_TOURS["social.main"].map(step => step.target)).toEqual(["social.leaderboards", "social.team"]);
    expect(TAB_ONBOARDING_TOURS["insights.main"].map(step => step.target)).toEqual(["insights.achievements", "insights.history"]);
    expect(TAB_ONBOARDING_TOURS["planner.calendar"][1].fallbackTargets).toContain("planner.calendar.board");
  });
});
