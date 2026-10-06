export type AwardTier = "bronze" | "copper" | "sage" | "gold" | "ink";

export type AchievementGoalCategory =
  | "health"
  | "career"
  | "personal"
  | "relationships"
  | "finance"
  | "other";

export type PersonalRecordAccent = "stamp" | "sage" | "gain" | "copper" | "ink";

export interface PersonalRecord {
  id: string;
  label: string;
  value: string;
  hint: string;
  accent: PersonalRecordAccent;
}

export interface LevelAward {
  id: string;
  awardId: string | null;
  level: number;
  title: string;
  description: string;
  unlockedAt: string | null;
  revokedAt: string | null;
  tier: AwardTier;
}

export interface AchievedGoalAchievement {
  goalId: string;
  title: string;
  rewardText: string | null;
  achievedOn: string | null;
  category: AchievementGoalCategory;
}

export interface AchievementsCollectionSummary {
  level: number;
  totalXp: number;
  unlockedAwards: number;
  totalAwards: number;
  achievedGoals: number;
  featuredAwardId: string | null;
}

export interface AchievementsShowcasePayload {
  schemaVersion: "2";
  collection: AchievementsCollectionSummary;
  personalRecords: PersonalRecord[];
  levelAwards: LevelAward[];
  achievedGoals: AchievedGoalAchievement[];
  truncated: {
    goals: boolean;
    completions: boolean;
  };
}
