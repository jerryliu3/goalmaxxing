import { describe, expect, it } from "vitest";
import { toAchievementGoalCategory } from "@/features/achievements/category";
import { awardTierForLevel } from "@/features/achievements/tier";

describe("awardTierForLevel", () => {
  it("maps XP reward levels to medal tiers", () => {
    expect(awardTierForLevel(2)).toBe("bronze");
    expect(awardTierForLevel(4)).toBe("copper");
    expect(awardTierForLevel(6)).toBe("sage");
    expect(awardTierForLevel(8)).toBe("gold");
    expect(awardTierForLevel(12)).toBe("ink");
  });
});

describe("toAchievementGoalCategory", () => {
  it("prefers category keys and falls back to labels", () => {
    expect(toAchievementGoalCategory("health", "Fitness")).toBe("health");
    expect(toAchievementGoalCategory(null, "Work goals")).toBe("career");
    expect(toAchievementGoalCategory("custom", "Random")).toBe("other");
  });
});
