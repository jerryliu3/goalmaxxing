import type {
  AchievementGoalCategory,
  AwardTier,
} from "@/features/achievements/types";

export type { AwardTier };
export type GoalCategory = AchievementGoalCategory;

export interface SeedLevelAward {
  id: string;
  level: number;
  title: string;
  description: string;
  unlockedAt: string | null;
  revokedAt: string | null;
  tier: AwardTier;
}

export interface SeedGoalAchievement {
  id: string;
  title: string;
  rewardText: string | null;
  achievedOn: string;
  category: GoalCategory;
}

export interface SeedPersonalRecord {
  id: string;
  label: string;
  value: string;
  hint: string;
  accent: "stamp" | "sage" | "gain" | "copper" | "ink";
}

export const COLLECTION = {
  level: 8,
  totalXp: 2840,
  levelProgress: 0.62,
  unlockedAwards: 4,
  totalAwards: 8,
  achievedGoals: 5,
  newestId: "award-level-8",
} as const;

export const PERSONAL_RECORDS: readonly SeedPersonalRecord[] = [
  {
    id: "rec-streak",
    label: "Best streak",
    value: "21d",
    hint: "Current 9d · no shame reset",
    accent: "stamp",
  },
  {
    id: "rec-week",
    label: "Best week",
    value: "94%",
    hint: "Week of Aug 11",
    accent: "gain",
  },
  {
    id: "rec-goals",
    label: "Goals finished",
    value: "5",
    hint: "First finish in 18 days",
    accent: "sage",
  },
  {
    id: "rec-level",
    label: "Highest level",
    value: "8",
    hint: "2,840 XP total",
    accent: "copper",
  },
] as const;

export const LEVEL_AWARDS: readonly SeedLevelAward[] = [
  {
    id: "award-level-2",
    level: 2,
    title: "Level 2 unlocked",
    description: "First real altitude. The climb is on.",
    unlockedAt: "2026-03-12T14:20:00.000Z",
    revokedAt: null,
    tier: "bronze",
  },
  {
    id: "award-level-4",
    level: 4,
    title: "Level 4 unlocked",
    description: "You held the trail through a busy month.",
    unlockedAt: "2026-05-02T09:10:00.000Z",
    revokedAt: null,
    tier: "copper",
  },
  {
    id: "award-level-6",
    level: 6,
    title: "Level 6 unlocked",
    description: "Six seasons of showing up.",
    unlockedAt: "2026-07-18T18:40:00.000Z",
    revokedAt: null,
    tier: "sage",
  },
  {
    id: "award-level-8",
    level: 8,
    title: "Level 8 unlocked",
    description: "A summit mark. Keep the cairn.",
    unlockedAt: "2026-09-01T11:05:00.000Z",
    revokedAt: null,
    tier: "gold",
  },
  {
    id: "award-level-10",
    level: 10,
    title: "Level 10 unlocked",
    description: "Double digits. Still locked for now.",
    unlockedAt: null,
    revokedAt: null,
    tier: "gold",
  },
  {
    id: "award-level-12",
    level: 12,
    title: "Level 12 unlocked",
    description: "A year of measured ascent.",
    unlockedAt: null,
    revokedAt: null,
    tier: "ink",
  },
  {
    id: "award-level-15",
    level: 15,
    title: "Level 15 unlocked",
    description: "Ridge line. Reserved.",
    unlockedAt: null,
    revokedAt: null,
    tier: "ink",
  },
  {
    id: "award-level-20",
    level: 20,
    title: "Level 20 unlocked",
    description: "The high pass.",
    unlockedAt: null,
    revokedAt: null,
    tier: "ink",
  },
] as const;

export const GOAL_ACHIEVEMENTS: readonly SeedGoalAchievement[] = [
  {
    id: "goal-thesis",
    title: "Thesis defense",
    rewardText: "Weekend off-grid with Maya",
    achievedOn: "2026-08-22",
    category: "career",
  },
  {
    id: "goal-5k",
    title: "Run a 5K without stopping",
    rewardText: "New trail shoes",
    achievedOn: "2026-06-14",
    category: "health",
  },
  {
    id: "goal-letters",
    title: "Write twelve letters home",
    rewardText: null,
    achievedOn: "2026-04-30",
    category: "relationships",
  },
  {
    id: "goal-budget",
    title: "Three months under budget",
    rewardText: "Dinner at the ridge lodge",
    achievedOn: "2026-07-01",
    category: "personal",
  },
  {
    id: "goal-reading",
    title: "Finish the field-notes stack",
    rewardText: "Framed map of the climb",
    achievedOn: "2026-05-19",
    category: "other",
  },
] as const;

export { formatAwardDate } from "@/features/achievements/format";

export function formatGoalDate(value: string | null) {
  if (!value) {
    return "—";
  }
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
