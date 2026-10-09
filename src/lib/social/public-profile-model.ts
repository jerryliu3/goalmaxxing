import { eachDayOfInterval, endOfYear, format, parseISO, startOfYear } from "date-fns";
import {
  PUBLIC_PROFILE_DEFAULT_BIO,
  PUBLIC_PROFILE_PIN_LIMIT,
  PUBLIC_PROFILE_RECORD_LIMIT,
  type PublicProfileBundle,
  type PublicProfileCurrentGoal,
  type PublicProfileGlobalAchievement,
  type PublicProfileGrowPoint,
  type PublicProfileOverallStats,
  type PublicProfileShowcaseCatalog,
  type PublicProfileShowcaseItem,
  type PublicProfileShowcasePin,
} from "@cadence/shared/social/public-profile";
import { resolveAchievedOn } from "@/features/achievements/build-showcase";
import { buildPersonalRecords } from "@/features/achievements/personal-records";
import { resolveTempoCardMaterial } from "@/features/goals/card-material/tempo-card-material";
import { getGoalVisual } from "@/features/planner/goal-visuals";
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
  | "bio"
  | "social_activity_visible"
  | "week_starts_on"
  | "created_at"
  | "timezone"
> & {
  /** False until the owner saves the card. Absent on older fixtures. */
  profile_card_configured?: boolean;
};

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
  pins?: PublicProfileShowcasePin[];
  selectedYear: number;
  memberNumber?: number | null;
  /** False until the owner saves the card. Omitted means already configured. */
  cardConfigured?: boolean;
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
    visibility: subjectProfile.social_activity_visible === false ? "private" as const : "public" as const,
    createdAt: subjectProfile.created_at,
    memberNumber,
  };
}

/** The owner gets every current goal so they can choose what to feature. */
function serializeCurrentGoals(
  goals: Goal[],
  summaries: GoalProgressSnapshot[],
  userId: string,
  isOwner: boolean
): PublicProfileCurrentGoal[] {
  return selectCurrentGoals(goals, summaries, userId, { publicOnly: !isOwner })
    .filter(({ goal }) => isOwner || goal.featured_on_profile !== false)
    .map(({ goal, progress }) => ({
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
    isPrivate: goal.is_private === true,
    featuredOnProfile: goal.featured_on_profile !== false,
  }));
}

/** Finished goals, newest finish first. `snapshots` is index-aligned with `goals`. */
function listFinishedGoals({
  goals,
  snapshots,
  completionsByGoal,
}: {
  goals: Goal[];
  snapshots: GoalProgressSnapshot[];
  completionsByGoal: ReadonlyMap<string, Completion[]>;
}) {
  return goals
    .flatMap((goal, index) =>
      snapshots[index]?.outcome === "achieved"
        ? [{ goal, achievedOn: resolveAchievedOn(snapshots[index], completionsByGoal.get(goal.id) ?? []) }]
        : []
    )
    .sort((left, right) => (right.achievedOn ?? "").localeCompare(left.achievedOn ?? ""));
}

function buildShowcaseCatalog({
  achievements,
  goals,
  snapshots,
  completionsByGoal,
  completions,
  asOfDate,
  weekStartsOn,
  level,
  totalXp,
}: {
  achievements: PublicProfileGlobalAchievement[];
  goals: Goal[];
  snapshots: GoalProgressSnapshot[];
  completionsByGoal: ReadonlyMap<string, Completion[]>;
  completions: Completion[];
  asOfDate: string;
  weekStartsOn: number;
  level: number;
  totalXp: number;
}): PublicProfileShowcaseCatalog {
  const achievedGoals = listFinishedGoals({ goals, snapshots, completionsByGoal });
  const privateGoalIds = new Set(goals.filter((goal) => goal.is_private).map((goal) => goal.id));
  const records = buildPersonalRecords({
    achievedGoalsCount: achievedGoals.length,
    achievedGoalDates: achievedGoals.flatMap((goal) => (goal.achievedOn ? [goal.achievedOn] : [])),
    asOfDate,
    goalSnapshots: snapshots,
    completions,
    level,
    totalXp,
    weekStartsOn,
    truncated: { goals: false, completions: false },
  });
  return {
    medals: achievements.flatMap((award) =>
      award.revokedAt === null && award.level !== null
        ? [{ kind: "medal" as const, ref: award.id, level: award.level, title: award.title, unlockedAt: award.unlockedAt }]
        : []
    ),
    goals: achievedGoals
      .filter(({ goal }) => !privateGoalIds.has(goal.id))
      .map(({ goal, achievedOn }) => ({
        kind: "goal" as const,
        ref: goal.id,
        title: goal.title,
        rewardText: goal.reward_text ?? null,
        achievedOn,
        material: resolveTempoCardMaterial(goal.difficulty),
        color: getGoalVisual({ goalId: goal.id, color: goal.color, category: goal.category }).color,
      })),
    records: records
      .filter((record) => record.value !== "—")
      .map((record) => ({
        kind: "record" as const,
        ref: record.id,
        label: record.label,
        value: record.value,
        hint: record.hint,
      })),
  };
}

const DEFAULT_RECORD_ORDER = ["rec-streak", "rec-week", "rec-level", "rec-goals"];

/** Highest medal and latest finished goal first, then whatever else is earned. */
function defaultShowcasePins(catalog: PublicProfileShowcaseCatalog): PublicProfileShowcasePin[] {
  const medals = [...catalog.medals].sort((left, right) => right.level - left.level);
  const goals = [...catalog.goals].sort((left, right) =>
    (right.achievedOn ?? "").localeCompare(left.achievedOn ?? "")
  );
  const picked: PublicProfileShowcasePin[] = [];
  const take = (item: { kind: PublicProfileShowcasePin["kind"]; ref: string } | undefined) => {
    if (item && picked.length < PUBLIC_PROFILE_PIN_LIMIT) {
      picked.push({ kind: item.kind, ref: item.ref });
    }
  };
  take(medals[0]);
  take(goals[0]);
  for (const medal of medals.slice(1)) take(medal);
  for (const goal of goals.slice(1)) take(goal);
  return picked;
}

function defaultRecordPins(catalog: PublicProfileShowcaseCatalog): PublicProfileShowcasePin[] {
  const preferred = DEFAULT_RECORD_ORDER.flatMap((ref) => {
    const record = catalog.records.find((item) => item.ref === ref);
    return record ? [record] : [];
  });
  const rest = catalog.records.filter((record) => !DEFAULT_RECORD_ORDER.includes(record.ref));
  return [...preferred, ...rest]
    .slice(0, PUBLIC_PROFILE_RECORD_LIMIT)
    .map((record) => ({ kind: "record" as const, ref: record.ref }));
}

/**
 * An unsaved card shows a description, records, and showcase pins so the
 * sections are visible. A saved card, including one saved empty, is left alone.
 * Saved pins in a category win over the defaults for that category.
 */
function applyCardDefaults({
  cardConfigured,
  bio,
  pins,
  catalog,
}: {
  cardConfigured: boolean;
  bio: string | null;
  pins: PublicProfileShowcasePin[];
  catalog: PublicProfileShowcaseCatalog;
}): { bio: string | null; pins: PublicProfileShowcasePin[] } {
  if (cardConfigured) {
    return { bio, pins };
  }
  const savedRecords = pins.filter((pin) => pin.kind === "record");
  const savedShowcase = pins.filter((pin) => pin.kind !== "record");
  return {
    bio: bio?.trim() ? bio : PUBLIC_PROFILE_DEFAULT_BIO,
    pins: [
      ...(savedShowcase.length > 0 ? savedShowcase : defaultShowcasePins(catalog)),
      ...(savedRecords.length > 0 ? savedRecords : defaultRecordPins(catalog)),
    ],
  };
}

function resolveShowcase(
  pins: PublicProfileShowcasePin[],
  catalog: PublicProfileShowcaseCatalog
): PublicProfileShowcaseItem[] {
  const byKey = new Map<string, PublicProfileShowcaseItem>(
    [...catalog.medals, ...catalog.goals, ...catalog.records].map((item) => [`${item.kind}:${item.ref}`, item])
  );
  return pins.flatMap((pin) => {
    const item = byKey.get(`${pin.kind}:${pin.ref}`);
    return item ? [item] : [];
  });
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

interface ProfileHistory {
  asOfDate: string;
  weekStartsOn: number;
  completableGoals: Goal[];
  completableCompletions: Completion[];
  resolvedCreatedDate: string;
  earliestCompletionDate: string | null;
}

/** The subject's own goals and completions, dated in their timezone. */
export function resolveProfileHistory({
  subjectProfile,
  goals,
  completions,
}: {
  subjectProfile: Pick<ProfileRow, "id" | "timezone" | "week_starts_on" | "created_at">;
  goals: Goal[];
  completions: Completion[];
}): ProfileHistory {
  const timezone = resolveUserTimezone(subjectProfile.timezone);
  const asOfDate = getDateInTimezone(new Date(), timezone);
  const weekStartsOn = normalizeWeekStartsOn(subjectProfile.week_starts_on);
  const completableGoalIds = buildCompletableGoalIds({
    goals,
    userId: subjectProfile.id,
    memberTeamIds: [],
  });
  const completableGoals = selectCompletableGoals(goals, completableGoalIds);
  const completableCompletions = filterCompletionsForGoalIds(completions, completableGoalIds);
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
  return {
    asOfDate,
    weekStartsOn,
    completableGoals,
    completableCompletions,
    resolvedCreatedDate,
    earliestCompletionDate,
  };
}

/** The Goal score history shown on Growth and public profiles, back to the first day. */
export function buildProfileGrowSeries(history: ProfileHistory): PublicProfileGrowPoint[] {
  return mapGrowSeries({
    completions: history.completableCompletions,
    goals: history.completableGoals,
    asOfDate: history.asOfDate,
    displayFrom:
      getEarliestDate([history.resolvedCreatedDate, history.earliestCompletionDate]) ??
      history.resolvedCreatedDate,
    weekStartsOn: history.weekStartsOn,
  });
}

/** Rank 1 is the highest score; rounds to the nearest whole percent, never below 1%. */
export function growScoreTopPercent(rank: number, total: number): number | null {
  if (total <= 0 || rank <= 0) return null;
  return Math.min(100, Math.max(1, Math.round((rank / total) * 100)));
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
    growTopPercent: null,
    currentGoals: [],
    bio: null,
    showcase: [],
    showcaseCatalog: null,
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
  pins = [],
  selectedYear,
  memberNumber = null,
  cardConfigured = true,
}: BuildPublicProfileBundleInput): PublicProfileBundle {
  const isOwner = viewerUserId !== null && viewerUserId === subjectProfile.id;
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

  const history = resolveProfileHistory({ subjectProfile, goals, completions });
  const { asOfDate, weekStartsOn, completableGoals, completableCompletions, resolvedCreatedDate } = history;
  const weeklyAnchor: WeeklyAnchorContext = { weekStartsOn };
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

  const statsGroup = buildInsightsStatsGroup({
    goals: completableGoals,
    completions: completableCompletions,
    summariesByGoal,
    asOfDate,
    weekStartsOn,
    accountCreatedDate: resolvedCreatedDate,
  });

  const mappedAchievements = mapGlobalAchievements(globalAchievements);
  const showcaseCatalog = buildShowcaseCatalog({
    achievements: mappedAchievements,
    goals: completableGoals,
    snapshots: completableGoals.map((goal) => summariesByGoal.get(goal.id)!),
    completionsByGoal,
    completions: completableCompletions,
    asOfDate,
    weekStartsOn,
    level: xp.currentLevel,
    totalXp,
  });
  const card = applyCardDefaults({
    cardConfigured,
    bio: subjectProfile.bio,
    pins,
    catalog: showcaseCatalog,
  });

  return {
    schemaVersion: "1",
    profile,
    xp,
    globalAchievements: mappedAchievements,
    awardCatalogCount,
    overallStats: mapOverallStats(statsGroup),
    yearHeatmap: buildYearHeatmap({
      completions: completableCompletions,
      year: selectedYear,
    }),
    growSeries: buildProfileGrowSeries(history),
    growTopPercent: null,
    currentGoals: serializeCurrentGoals(
      completableGoals,
      [...summariesByGoal.values()],
      subjectProfile.id,
      isOwner
    ),
    bio: card.bio,
    showcase: resolveShowcase(card.pins, showcaseCatalog),
    showcaseCatalog: isOwner ? showcaseCatalog : null,
  };
}
