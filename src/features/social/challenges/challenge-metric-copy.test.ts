import { describe, expect, it } from "vitest";
import {
  challengeUnitLabel,
  describeChallengeTarget,
} from "@/features/social/challenges/challenge-metric-copy";

describe("challengeUnitLabel", () => {
  it("names the unit behind each metric", () => {
    expect(challengeUnitLabel("total_xp", null)).toBe("XP");
    expect(challengeUnitLabel("completions_count", null)).toBe("sessions");
    expect(challengeUnitLabel("distinct_active_days", null)).toBe("active days");
    expect(challengeUnitLabel("max_streak_days", null)).toBe("day streak");
  });

  it("uses the track key for category XP when one is set", () => {
    expect(challengeUnitLabel("category_xp", "Fitness")).toBe("Fitness XP");
    expect(challengeUnitLabel("category_xp", null)).toBe("category XP");
  });
});

describe("describeChallengeTarget", () => {
  it("states the target as an action", () => {
    expect(describeChallengeTarget("completions_count", null, 10)).toBe(
      "Complete 10 sessions before this challenge ends."
    );
    expect(describeChallengeTarget("distinct_active_days", null, 20)).toBe(
      "Show up on 20 active days before this challenge ends."
    );
    expect(describeChallengeTarget("max_streak_days", null, 7)).toBe(
      "Build a 7 day streak before this challenge ends."
    );
  });

  it("groups digits on large targets", () => {
    expect(describeChallengeTarget("total_xp", null, 1000)).toBe(
      "Earn 1,000 XP before this challenge ends."
    );
  });
});
