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
  activeStreakDays: number;
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
  isPrivate: boolean;
  createdAt: string | null;
}

export interface PublicProfileGrowPoint {
  date: string;
  score: number;
  pace: number;
  rawCredits: number;
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
}
