import type { ProgressContextSummary } from "../goals/progress-context";

export interface PublicProfileCountTrend {
  current: number;
  previous: number;
  delta: number;
  deltaPercent: number | null;
}

export interface PublicProfileXpSummary {
  totalXp: number;
  currentLevel: number;
  currentLevelMinXp: number;
  nextLevel: number | null;
  nextLevelMinXp: number | null;
  xpToNextLevel: number | null;
}

export interface PublicProfileGlobalAchievement {
  id: string;
  unlockedAt: string;
  revokedAt: string | null;
  level: number | null;
  code: string | null;
  title: string | null;
  description: string | null;
}

export interface PublicProfileOverallStats {
  totalActivities: number;
  totalGoalsCompleted: number;
  todayActivities: number;
  activeStreakWeeks: number;
  currentWeekActivities: PublicProfileCountTrend;
  currentMonthActivities: PublicProfileCountTrend;
}

export interface PublicProfileHeatmapPoint {
  date: string;
  count: number;
}

export interface PublicProfileIdentity {
  subjectUserId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  /** Whether this viewer is restricted to the private-account notice. */
  isPrivate: boolean;
  /** Saved profile visibility, including when the viewer is the owner. */
  visibility?: "public" | "private";
  createdAt: string | null;
  /** 1-based signup order among profiles. */
  memberNumber?: number | null;
}

export interface PublicProfileGrowPoint {
  date: string;
  score: number;
  pace: number;
  rawCredits: number;
}

export interface PublicProfileCurrentGoal {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  category: string;
  color: string | null;
  frequencyType: "fixed_milestones" | "recurring";
  recurrenceInterval: "daily" | "weekly" | "monthly" | null;
  difficulty: "easy" | "medium" | "hard" | null;
  targetCount: number | null;
  targetBasis: "period" | "lifetime";
  milestoneNames: string[] | null;
  startDate: string;
  endDate: string | null;
  rewardText: string | null;
  defaultLocalTime: string | null;
  createdAt: string;
  progress: ProgressContextSummary;
  /** Only the owner ever receives private or unfeatured goals. */
  isPrivate: boolean;
  featuredOnProfile: boolean;
}

export const PUBLIC_PROFILE_BIO_LIMIT = 140;
/** Shown on the card until the owner saves their own line, including clearing it. */
export const PUBLIC_PROFILE_DEFAULT_BIO = "Showing up for what I said I would.";
/** Medals and finished goals in the showcase. */
export const PUBLIC_PROFILE_PIN_LIMIT = 3;
/** Records on the membership card; separate from the showcase budget. */
export const PUBLIC_PROFILE_RECORD_LIMIT = 3;

export type PublicProfileShowcaseKind = "medal" | "goal" | "record";

export interface PublicProfileShowcasePin {
  kind: PublicProfileShowcaseKind;
  ref: string;
}

export interface PublicProfileShowcaseMedal {
  kind: "medal";
  ref: string;
  level: number;
  title: string | null;
  unlockedAt: string;
}

export interface PublicProfileShowcaseGoal {
  kind: "goal";
  ref: string;
  title: string;
  rewardText: string | null;
  achievedOn: string | null;
  material: "glass" | "alloy" | "chromatic";
  color: string;
}

export interface PublicProfileShowcaseRecord {
  kind: "record";
  ref: string;
  label: string;
  value: string;
  hint: string;
}

export type PublicProfileShowcaseItem =
  | PublicProfileShowcaseMedal
  | PublicProfileShowcaseGoal
  | PublicProfileShowcaseRecord;

/** Everything the owner may pin. Never sent to visitors. */
export interface PublicProfileShowcaseCatalog {
  medals: PublicProfileShowcaseMedal[];
  goals: PublicProfileShowcaseGoal[];
  records: PublicProfileShowcaseRecord[];
}

export interface PublicProfileBundle {
  schemaVersion: "1";
  profile: PublicProfileIdentity;
  xp: PublicProfileXpSummary | null;
  globalAchievements: PublicProfileGlobalAchievement[];
  awardCatalogCount: number;
  overallStats: PublicProfileOverallStats | null;
  yearHeatmap: PublicProfileHeatmapPoint[];
  growSeries: PublicProfileGrowPoint[];
  /** "Top N%" of real accounts by current Goal score; null when private or unranked. */
  growTopPercent: number | null;
  currentGoals: PublicProfileCurrentGoal[];
  bio: string | null;
  /** Resolved pins in slot order; pins whose source is gone are dropped. */
  showcase: PublicProfileShowcaseItem[];
  showcaseCatalog: PublicProfileShowcaseCatalog | null;
}
