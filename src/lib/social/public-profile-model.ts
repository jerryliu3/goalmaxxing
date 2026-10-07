import { eachDayOfInterval, endOfYear, format, parseISO, startOfYear } from "date-fns";
import type {
  PublicProfileBundle,
  PublicProfileCurrentGoal,
  PublicProfileGlobalAchievement,
  PublicProfileGrowPoint,
  PublicProfileOverallStats,
} from "@cadence/shared/social/public-profile";
import { buildGrowScoreSeries } from "@/lib/grow-score";
import {
  buildCompletableGoalIds,
  filterCompletionsForGoalIds,
  selectCompletableGoals,
} from "@cadence/shared/goals/completable-goals";
import { getDateInTimezone, resolveUserTimezone } from "@/lib/dates/timezone";
import { normalizeWeekStartsOn } from "@/lib/dates/week-start";
import { selectCurrentGoals } from "@/lib/goals/current-goals";
import type { Completion, Goal } from "@/lib/goals/types";
import { getGoalProgressSnapshot, type GoalProgressSnapshot } from "@/lib/goals/progress";
import { compareDateStrings, type WeeklyAnchorContext } from "@/lib/goals/periods";
import { buildInsightsStatsGroup } from "@/lib/insights/metrics";
import type { Database } from "@/lib/supabase/database.types";
import { progressionForTotalXp } from "@/lib/xp/progression";

export type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  | "id"
  | "username"
  | "display_name"
  | "avatar_url"
  | "social_activity_visible"
  | "week_starts_on"
  | "created_at"
  | "timezone"
>;

type XpProfileRow = Pick<
  Database["public"]["Tables"]["xp_profiles"]["Row"],
  "total_xp"
>;

type UserAwardRewardRow = {
  level: number | null;
  reward_code: string | null;
  reward_title: string | null;
  reward_description: string | null;
};

export type UserAwardRow = {
  id: string;
  unlocked_at: string;
  revoked_at: string | null;
  xp_rewards: UserAwardRewardRow | UserAwardRewardRow[] | null;
};

export interface BuildPublicProfileBundleInput {
  viewerUserId: string | null;
  subjectProfile: ProfileRow;
  globalXpProfile: XpProfileRow | null;
  globalAchievements: UserAwardRow[];
  awardCatalogCount: number;
  goals: Goal[];
  completions: Completion[];
  selectedYear: number;
  memberNumber?: number | null;
}

function toDateOnly(value: string | null | undefined) {
  const candidate = (value ?? "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : null;
}

function getEarliestDate(candidates: Array<string | null>) {
  let earliest: string | null = null;
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    if (!earliest || compareDateStrings(candidate, earliest) < 0) {
      earliest = candidate;
    }
  }
  return earliest;
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

function mapGlobalAchievements(rows: UserAwardRow[]): PublicProfileGlobalAchievement[] {
  return rows.map((row) => {
    const reward = Array.isArray(row.xp_rewards) ? row.xp_rewards[0] : row.xp_rewards;
    return {
      id: row.id,
      unlockedAt: row.unlocked_at,
      revokedAt: row.revoked_at,
      level: reward?.level ?? null,
      code: reward?.reward_code ?? null,
      title: reward?.reward_title ?? null,
      description: reward?.reward_description ?? null,
    };
  });
}

function mapOverallStats(stats: ReturnType<typeof buildInsightsStatsGroup>): PublicProfileOverallStats {
  return {
    totalActivities: stats.totalActivities,
    totalGoalsCompleted: stats.totalGoalsCompleted,
    todayActivities: stats.todayActivities,
    activeStreakWeeks: stats.activeStreakWeeks,
    currentWeekActivities: stats.currentWeekActivities,
    currentMonthActivities: stats.currentMonthActivities,
  };
}

function buildYearHeatmap({
  completions,
  year,
}: {
  completions: Completion[];
  year: number;
}) {
  const yearStart = parseISO(`${year}-01-01`);
  const yearEnd = parseISO(`${year}-12-31`);
  const countsByDate = new Map<string, number>();

  for (const completion of completions) {
    const date = completion.completed_on;
    if (date < `${year}-01-01` || date > `${year}-12-31`) {
      continue;
    }
    countsByDate.set(date, (countsByDate.get(date) ?? 0) + 1);
  }

  return eachDayOfInterval({ start: startOfYear(yearStart), end: endOfYear(yearEnd) }).map(
    (date) => {
      const key = format(date, "yyyy-MM-dd");
      return {
        date: key,
        count: countsByDate.get(key) ?? 0,
      };
    }
  );
}

function buildProfileIdentity(
  subjectProfile: ProfileRow,
  isPrivate: boolean,
  memberNumber: number | null = null,
) {
  return {
    subjectUserId: subjectProfile.id,
    username: subjectProfile.username,
    displayName: subjectProfile.display_name,
    avatarUrl: subjectProfile.avatar_url,
    isPrivate,
    createdAt: subjectProfile.created_at,
    memberNumber,
  };
}

function serializeCurrentGoals(
  goals: Goal[],
  summaries: GoalProgressSnapshot[],
  userId: string
): PublicProfileCurrentGoal[] {
  return selectCurrentGoals(goals, summaries, userId, { publicOnly: true }).map(({ goal, progress }) => ({
    id: goal.id,
    ownerId: goal.owner_id,
    title: goal.title,
    description: goal.description,
    category: goal.category,
    color: goal.color,
    frequencyType: goal.frequency_type,
    recurrenceInterval: goal.recurrence_interval,
    difficulty: goal.difficulty ?? null,
    targetCount: goal.target_count,
    targetBasis: goal.target_basis,
    milestoneNames: goal.milestone_names,
    startDate: goal.start_date,
    endDate: goal.end_date,
    rewardText: goal.reward_text ?? null,
    defaultLocalTime: goal.default_local_time ?? null,
    createdAt: goal.created_at,
    progress,
  }));
}

function mapGrowSeries({
  completions,
  goals,
  asOfDate,
  displayFrom,
  weekStartsOn,
}: {
  completions: Completion[];
  goals: Goal[];
  asOfDate: string;
  /** First charted day: the account creation date, so history scrolls back to signup. */
  displayFrom: string;
  weekStartsOn: number;
}): PublicProfileGrowPoint[] {
  return buildGrowScoreSeries({
    completions,
    goals,
    asOfDate,
    displayFrom,
    warmupDays: 56,
    weekStartsOn,
  }).map((point) => ({
    date: point.date,
    score: point.score,
    pace: point.pace,
    rawCredits: point.rawCredits,
  }));
}

export function isPrivateForViewer(viewerUserId: string | null, subjectProfile: ProfileRow) {
  const isViewerSubject = viewerUserId !== null && viewerUserId === subjectProfile.id;
  return !isViewerSubject && subjectProfile.social_activity_visible === false;
}

export function buildPrivatePublicProfileBundle(
  subjectProfile: ProfileRow,
  memberNumber: number | null = null,
): PublicProfileBundle {
  return {
    schemaVersion: "1",
    profile: buildProfileIdentity(subjectProfile, true, memberNumber),
    xp: null,
    globalAchievements: [],
    awardCatalogCount: 0,
    overallStats: null,
    yearHeatmap: [],
    growSeries: [],
    currentGoals: [],
  };
}

export function buildPublicProfileBundle({
  viewerUserId,
  subjectProfile,
  globalXpProfile,
  globalAchievements,
  awardCatalogCount,
  goals,
  completions,
  selectedYear,
  memberNumber = null,
}: BuildPublicProfileBundleInput): PublicProfileBundle {
  const isPrivate = isPrivateForViewer(viewerUserId, subjectProfile);
  const profile = buildProfileIdentity(subjectProfile, isPrivate, memberNumber);

  if (isPrivate) {
    return buildPrivatePublicProfileBundle(subjectProfile, memberNumber);
  }

  const totalXp = globalXpProfile?.total_xp ?? 0;
  const progression = progressionForTotalXp(totalXp);
  const xp = {
    totalXp,
    currentLevel: progression.currentLevel,
    currentLevelMinXp: progression.currentLevelMinXp,
    nextLevel: progression.nextLevel,
    nextLevelMinXp: progression.nextLevelMinXp,
    xpToNextLevel: progression.xpToNextLevel,
  };

  const timezone = resolveUserTimezone(subjectProfile.timezone);
  const asOfDate = getDateInTimezone(new Date(), timezone);
  const weekStartsOn = normalizeWeekStartsOn(subjectProfile.week_starts_on);
  const weeklyAnchor: WeeklyAnchorContext = { weekStartsOn };
  const completableGoalIds = buildCompletableGoalIds({
    goals,
    userId: subjectProfile.id,
    memberTeamIds: [],
  });
  const completableGoals = selectCompletableGoals(goals, completableGoalIds);
  const completableCompletions = filterCompletionsForGoalIds(completions, completableGoalIds);
  const completionsByGoal = groupCompletionsByGoal(completableCompletions);

  const summariesByGoal = new Map<string, GoalProgressSnapshot>();
  for (const goal of completableGoals) {
    summariesByGoal.set(
      goal.id,
      getGoalProgressSnapshot(goal, completionsByGoal.get(goal.id) ?? [], asOfDate, {
        weeklyAnchor,
      })
    );
  }

  const profileCreatedDate = toDateOnly(subjectProfile.created_at);
  const earliestGoalStart = getEarliestDate(completableGoals.map((goal) => goal.start_date));
  const earliestCompletionDate = getEarliestDate(
    completableCompletions.map((completion) => completion.completed_on)
  );
  const fallbackCreatedDate =
    getEarliestDate([asOfDate, earliestGoalStart, earliestCompletionDate]) ?? asOfDate;
  const resolvedCreatedDate =
    profileCreatedDate && compareDateStrings(profileCreatedDate, asOfDate) <= 0
      ? profileCreatedDate
      : fallbackCreatedDate;

  const statsGroup = buildInsightsStatsGroup({
    goals: completableGoals,
    completions: completableCompletions,
    summariesByGoal,
    asOfDate,
    weekStartsOn,
    accountCreatedDate: resolvedCreatedDate,
  });

  return {
    schemaVersion: "1",
    profile,
    xp,
    globalAchievements: mapGlobalAchievements(globalAchievements),
    awardCatalogCount,
    overallStats: mapOverallStats(statsGroup),
    yearHeatmap: buildYearHeatmap({
      completions: completableCompletions,
      year: selectedYear,
    }),
    growSeries: mapGrowSeries({
      completions: completableCompletions,
      goals: completableGoals,
      asOfDate,
      // Signup, or earlier imported history, so the chart scrolls back to the first day.
      displayFrom:
        getEarliestDate([resolvedCreatedDate, earliestCompletionDate]) ?? resolvedCreatedDate,
      weekStartsOn,
    }),
    currentGoals: serializeCurrentGoals(
      completableGoals,
      [...summariesByGoal.values()],
      subjectProfile.id
    ),
  };
}
