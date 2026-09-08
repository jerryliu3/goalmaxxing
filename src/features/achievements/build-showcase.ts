import { toAchievementGoalCategory } from "@/features/achievements/category";
import { buildPersonalRecords } from "@/features/achievements/personal-records";
import { awardTierForLevel } from "@/features/achievements/tier";
import type {
  AchievedGoalAchievement,
  AchievementsCollectionSummary,
  AchievementsShowcasePayload,
  LevelAward,
} from "@/features/achievements/types";
import { getGoalProgressSnapshot } from "@/lib/goals/progress";
import type { Completion, Goal } from "@/lib/goals/types";
import { levelForTotalXp } from "@/lib/xp/progression";

interface XpRewardRow {
  id: string;
  level: number;
  reward_code: string;
  reward_title: string;
  reward_description: string;
}

interface UserAwardRow {
  id: string;
  unlocked_at: string;
  acknowledged_at: string | null;
  revoked_at: string | null;
  xp_rewards:
    | {
        level: number;
        reward_code: string;
        reward_title: string;
        reward_description: string;
      }
    | Array<{
        level: number;
        reward_code: string;
        reward_title: string;
        reward_description: string;
      }>
    | null;
}

export interface BuildAchievementsShowcaseInput {
  goals: Goal[];
  completions: Completion[];
  asOfDate: string;
  totalXp: number;
  rewardCatalog: XpRewardRow[];
  userAwards: UserAwardRow[];
  truncated: {
    goals: boolean;
    completions: boolean;
  };
}

function summarizeAchievedGoal({
  goal,
  achievedOn,
}: {
  goal: Goal;
  achievedOn: string | null;
}): AchievedGoalAchievement {
  return {
    goalId: goal.id,
    title: goal.title,
    rewardText: goal.reward_text ?? null,
    achievedOn,
    category: toAchievementGoalCategory(goal.category_key, goal.category),
  };
}

function groupCompletionsByGoal(completions: Completion[]) {
  const grouped = new Map<string, Completion[]>();
  for (const completion of completions) {
    const existing = grouped.get(completion.goal_id) ?? [];
    existing.push(completion);
    grouped.set(completion.goal_id, existing);
  }
  return grouped;
}

function resolveUserAwardReward(award: UserAwardRow) {
  if (!award.xp_rewards) {
    return null;
  }
  return Array.isArray(award.xp_rewards) ? award.xp_rewards[0] : award.xp_rewards;
}

function buildLevelAwards(
  rewardCatalog: XpRewardRow[],
  userAwards: UserAwardRow[]
): LevelAward[] {
  const awardsByLevel = new Map<number, UserAwardRow>();
  for (const award of userAwards) {
    const reward = resolveUserAwardReward(award);
    if (reward) {
      awardsByLevel.set(reward.level, award);
    }
  }

  return rewardCatalog
    .slice()
    .sort((left, right) => left.level - right.level)
    .map((reward) => {
      const userAward = awardsByLevel.get(reward.level);
      const revoked = Boolean(userAward?.revoked_at);
      return {
        id: reward.id,
        awardId: userAward?.id ?? null,
        level: reward.level,
        title: reward.reward_title,
        description: reward.reward_description,
        unlockedAt: revoked ? null : userAward?.unlocked_at ?? null,
        revokedAt: userAward?.revoked_at ?? null,
        tier: awardTierForLevel(reward.level),
      };
    });
}

function buildCollectionSummary(
  levelAwards: LevelAward[],
  achievedGoalsCount: number,
  totalXp: number
): AchievementsCollectionSummary {
  const unlockedAwards = levelAwards.filter((award) => award.unlockedAt).length;
  const totalAwards = levelAwards.length;
  const claimed = unlockedAwards + achievedGoalsCount;
  const total = totalAwards + achievedGoalsCount;
  const featuredAward =
    [...levelAwards]
      .filter((award) => award.unlockedAt)
      .sort((left, right) => right.level - left.level)[0] ??
    levelAwards.find((award) => !award.unlockedAt) ??
    null;

  return {
    level: levelForTotalXp(totalXp),
    totalXp,
    unlockedAwards,
    totalAwards,
    achievedGoals: achievedGoalsCount,
    featuredAwardId: featuredAward?.id ?? null,
  };
}

export function buildAchievementsShowcasePayload(
  input: BuildAchievementsShowcaseInput
): AchievementsShowcasePayload {
  const completionsByGoal = groupCompletionsByGoal(input.completions);
  const goalSnapshots = input.goals.map((goal) =>
    getGoalProgressSnapshot(goal, completionsByGoal.get(goal.id) ?? [], input.asOfDate)
  );

  const achievedGoals = input.goals
    .map((goal, index) => ({
      goal,
      summary: goalSnapshots[index],
      completions: completionsByGoal.get(goal.id) ?? [],
    }))
    .filter((entry) => entry.summary.outcome === "achieved")
    .map((entry) => {
      const achievedOn =
        entry.completions.length === 0
          ? null
          : entry.completions.reduce<string | null>(
              (latest, completion) =>
                latest === null || completion.completed_on > latest
                  ? completion.completed_on
                  : latest,
              null
            );
      return summarizeAchievedGoal({ goal: entry.goal, achievedOn });
    })
    .sort((left, right) => {
      const leftDate = left.achievedOn ?? "";
      const rightDate = right.achievedOn ?? "";
      return rightDate.localeCompare(leftDate);
    });

  const levelAwards = buildLevelAwards(input.rewardCatalog, input.userAwards);
  const collection = buildCollectionSummary(
    levelAwards,
    achievedGoals.length,
    input.totalXp
  );

  const globalAchievements = input.userAwards
    .map((award) => {
      const reward = resolveUserAwardReward(award);
      return {
        id: award.id,
        unlockedAt: award.unlocked_at,
        acknowledgedAt: award.acknowledged_at,
        revokedAt: award.revoked_at,
        level: reward?.level ?? null,
        code: reward?.reward_code ?? null,
        title: reward?.reward_title ?? null,
        description: reward?.reward_description ?? null,
      };
    })
    .sort((left, right) => right.unlockedAt.localeCompare(left.unlockedAt));

  return {
    schemaVersion: "2",
    collection,
    personalRecords: buildPersonalRecords({
      achievedGoalsCount: achievedGoals.length,
      goalSnapshots,
      completions: input.completions,
      level: collection.level,
      totalXp: input.totalXp,
    }),
    levelAwards,
    achievedGoals,
    globalAchievements,
    truncated: input.truncated,
  };
}

export function claimedProgress(collection: AchievementsCollectionSummary) {
  const claimed = collection.unlockedAwards + collection.achievedGoals;
  const total = collection.totalAwards + collection.achievedGoals;
  const fill = total === 0 ? 0 : Math.round((claimed / total) * 100);
  return { claimed, total, fill };
}
