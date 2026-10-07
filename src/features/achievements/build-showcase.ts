import { buildPersonalRecords } from "@/features/achievements/personal-records";
import { awardTierForLevel } from "@/features/achievements/tier";
import type {
  AchievementsCollectionSummary,
  AchievementsShowcasePayload,
  LevelAward,
} from "@/features/achievements/types";
import {
  getGoalProgressSnapshot,
  type GoalProgressSnapshot,
} from "@/lib/goals/progress";
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
  weeklyAnchor?: { weekStartsOn: number };
  truncated: {
    goals: boolean;
    completions: boolean;
  };
}

function resolveAchievedOn(
  summary: GoalProgressSnapshot,
  completions: Completion[]
): string | null {
  if (summary.achievementDate) {
    return summary.achievementDate;
  }
  if (summary.milestoneDates.length > 0) {
    return summary.milestoneDates.at(-1) ?? null;
  }
  if (completions.length === 0) {
    return null;
  }
  return completions.reduce<string | null>(
    (latest, completion) =>
      latest === null || completion.completed_on > latest
        ? completion.completed_on
        : latest,
    null
  );
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
    getGoalProgressSnapshot(
      goal,
      completionsByGoal.get(goal.id) ?? [],
      input.asOfDate,
      { weeklyAnchor: input.weeklyAnchor }
    )
  );

  const achievedOnDates = input.goals.flatMap((goal, index) =>
    goalSnapshots[index].outcome === "achieved"
      ? [resolveAchievedOn(goalSnapshots[index], completionsByGoal.get(goal.id) ?? [])]
      : []
  );

  const levelAwards = buildLevelAwards(input.rewardCatalog, input.userAwards);
  const collection = buildCollectionSummary(
    levelAwards,
    achievedOnDates.length,
    input.totalXp
  );
  const weekStartsOn = input.weeklyAnchor?.weekStartsOn ?? 1;

  return {
    schemaVersion: "3",
    collection,
    personalRecords: buildPersonalRecords({
      achievedGoalsCount: achievedOnDates.length,
      achievedGoalDates: achievedOnDates.filter((date): date is string => Boolean(date)),
      asOfDate: input.asOfDate,
      goalSnapshots,
      completions: input.completions,
      level: collection.level,
      totalXp: input.totalXp,
      weekStartsOn,
      truncated: input.truncated,
    }),
    levelAwards,
    truncated: input.truncated,
  };
}

export function claimedProgress(collection: AchievementsCollectionSummary) {
  const claimed = collection.unlockedAwards + collection.achievedGoals;
  const total = collection.totalAwards + collection.achievedGoals;
  const fill = total === 0 ? 0 : Math.round((claimed / total) * 100);
  return { claimed, total, fill };
}
