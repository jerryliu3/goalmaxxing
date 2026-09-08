import { describe, expect, it } from "vitest";
import { buildAchievementsShowcasePayload, claimedProgress } from "@/features/achievements/build-showcase";
import type { Completion, Goal } from "@/lib/goals/types";

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "goal-1",
    owner_id: "user-1",
    title: "Run a 5K",
    description: null,
    category: "Health",
    category_key: "health",
    color: null,
    frequency_type: "recurring",
    recurrence_interval: "daily",
    target_count: 1,
    target_basis: "period",
    milestone_names: null,
    start_date: "2026-01-01",
    end_date: null,
    reward_text: "New shoes",
    is_deleted: false,
    archived_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeCompletion(overrides: Partial<Completion> = {}): Completion {
  return {
    id: "completion-1",
    goal_id: "goal-1",
    user_id: "user-1",
    completed_on: "2026-03-01",
    source: "manual",
    created_at: "2026-03-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildAchievementsShowcasePayload", () => {
  it("merges reward catalog with user unlocks and keeps locked mounts", () => {
    const payload = buildAchievementsShowcasePayload({
      goals: [],
      completions: [],
      asOfDate: "2026-09-01",
      totalXp: 800,
      rewardCatalog: [
        {
          id: "reward-2",
          level: 2,
          reward_code: "xp.level.2",
          reward_title: "Level 2 unlocked",
          reward_description: "You reached Level 2.",
        },
        {
          id: "reward-4",
          level: 4,
          reward_code: "xp.level.4",
          reward_title: "Level 4 unlocked",
          reward_description: "You reached Level 4.",
        },
      ],
      userAwards: [
        {
          id: "award-2",
          unlocked_at: "2026-03-01T00:00:00.000Z",
          acknowledged_at: null,
          revoked_at: null,
          xp_rewards: {
            level: 2,
            reward_code: "xp.level.2",
            reward_title: "Level 2 unlocked",
            reward_description: "You reached Level 2.",
          },
        },
      ],
      truncated: { goals: false, completions: false },
    });

    expect(payload.levelAwards).toHaveLength(2);
    expect(payload.levelAwards[0]?.unlockedAt).toBeTruthy();
    expect(payload.levelAwards[1]?.unlockedAt).toBeNull();
    expect(payload.collection.unlockedAwards).toBe(1);
    expect(payload.collection.featuredAwardId).toBe("reward-2");
  });

  it("maps achieved goals and personal records from goal snapshots", () => {
    const payload = buildAchievementsShowcasePayload({
      goals: [
        makeGoal({
          id: "goal-achieved",
          title: "Thesis defense",
          category_key: "career",
          target_count: 1,
          frequency_type: "fixed_milestones",
          milestone_names: ["Done"],
        }),
      ],
      completions: [
        makeCompletion({
          goal_id: "goal-achieved",
          completed_on: "2026-08-22",
        }),
        makeCompletion({ completed_on: "2026-08-20" }),
        makeCompletion({ completed_on: "2026-08-21" }),
      ],
      asOfDate: "2026-09-01",
      totalXp: 1200,
      rewardCatalog: [],
      userAwards: [],
      truncated: { goals: false, completions: false },
    });

    expect(payload.achievedGoals).toHaveLength(1);
    expect(payload.achievedGoals[0]?.title).toBe("Thesis defense");
    expect(payload.achievedGoals[0]?.category).toBe("career");
    expect(payload.personalRecords.map((record) => record.label)).toEqual([
      "Best streak",
      "Best week",
      "Goals finished",
      "Highest level",
    ]);
    expect(payload.personalRecords[2]?.value).toBe("1");
  });
});

describe("claimedProgress", () => {
  it("computes claimed fill from awards and goals", () => {
    const progress = claimedProgress({
      level: 4,
      totalXp: 400,
      unlockedAwards: 2,
      totalAwards: 5,
      achievedGoals: 3,
      featuredAwardId: null,
    });

    expect(progress).toEqual({ claimed: 5, total: 8, fill: 63 });
  });
});
