import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import type {
  PublicProfileIdentity,
  PublicProfileOverallStats,
} from "@cadence/shared/social/public-profile";
import type { Goal } from "@/lib/goals/types";
import type {
  ProfileDraft,
  ProfileSnapshot,
  ShowcaseItem,
} from "@/features/ux-profile/model";

export const IDENTITY: PublicProfileIdentity = {
  subjectUserId: "seed-maya",
  username: "mayaruns",
  displayName: "Maya Chen",
  avatarUrl: null,
  isPrivate: false,
  createdAt: "2026-01-04T00:00:00.000Z",
  memberNumber: 146,
};

/** Shown only on the owner's editable membership card, as production does. */

export const OVERALL_STATS: PublicProfileOverallStats = {
  totalActivities: 412,
  totalGoalsCompleted: 4,
  todayActivities: 2,
  activeStreakWeeks: 9,
  currentWeekActivities: { current: 11, previous: 9, delta: 2, deltaPercent: 22 },
  currentMonthActivities: { current: 38, previous: 33, delta: 5, deltaPercent: 15 },
};

export const LEVEL = 8;

/** Growth-only numbers: shown in the Growth mock, never on the profile. */
export const GROWTH_STATS = [
  { label: "Form", value: "72", hint: "+6 this week" },
  { label: "Completions", value: "412", hint: "38 this month" },
  { label: "Week streak", value: "9", hint: "Best 14" },
  { label: "On-time rate", value: "81%", hint: "Last 30 days" },
] as const;

export const MEDALS: readonly ShowcaseItem[] = [
  {
    kind: "medal",
    id: "medal-8",
    level: 8,
    tier: "gold",
    title: "Level 8 unlocked",
    detail: "Eight altitudes of steady work.",
    date: "Sep 28, 2026",
  },
  {
    kind: "medal",
    id: "medal-6",
    level: 6,
    tier: "sage",
    title: "Level 6 unlocked",
    detail: "Six seasons of showing up.",
    date: "Jul 14, 2026",
  },
  {
    kind: "medal",
    id: "medal-4",
    level: 4,
    tier: "copper",
    title: "Level 4 unlocked",
    detail: "The habit held through spring.",
    date: "Apr 2, 2026",
  },
  {
    kind: "medal",
    id: "medal-2",
    level: 2,
    tier: "bronze",
    title: "Level 2 unlocked",
    detail: "First week in the books.",
    date: "Jan 19, 2026",
  },
];

export const RECORDS: readonly ShowcaseItem[] = [
  { kind: "record", id: "record-streak", label: "Best streak", value: "21d", hint: "Set in August", accent: "stamp" },
  { kind: "record", id: "record-week", label: "Best week", value: "94%", hint: "Week of Aug 11", accent: "gain" },
  { kind: "record", id: "record-day", label: "Most in a day", value: "7", hint: "Sunday, Jun 8", accent: "copper" },
];

export const PLAQUES: readonly ShowcaseItem[] = [
  {
    kind: "plaque",
    id: "plaque-half",
    title: "Run a half marathon",
    rewardText: "New trail shoes",
    achievedOn: "Sep 21, 2026",
    category: "health",
  },
  {
    kind: "plaque",
    id: "plaque-portfolio",
    title: "Ship the portfolio site",
    rewardText: "Dinner at Kato",
    achievedOn: "Jun 30, 2026",
    category: "career",
  },
  {
    kind: "plaque",
    id: "plaque-books",
    title: "Read 12 books",
    rewardText: "A first edition",
    achievedOn: "May 3, 2026",
    category: "personal",
  },
  {
    kind: "plaque",
    id: "plaque-sundays",
    title: "Call Grandma every Sunday",
    rewardText: null,
    achievedOn: "Mar 29, 2026",
    category: "relationships",
  },
];

export const SHOWCASE_CATALOG: readonly ShowcaseItem[] = [...MEDALS, ...PLAQUES, ...RECORDS];

/* Goals and progress in the production shapes the Goals page loads, so the
   real selection (`selectCurrentGoals`) and card (`GoalProgressCard`) run. */

function seedGoal(goal: Pick<Goal, "id" | "title" | "category" | "frequency_type" | "start_date"> & Partial<Goal>): Goal {
  return {
    owner_id: IDENTITY.subjectUserId,
    description: null,
    color: null,
    recurrence_interval: null,
    difficulty: "medium",
    target_count: 1,
    target_basis: "period",
    milestone_names: null,
    end_date: null,
    reward_text: null,
    default_local_time: null,
    photo_path: null,
    team_id: null,
    is_deleted: false,
    archived_at: null,
    is_private: false,
    created_at: `${goal.start_date}T00:00:00.000Z`,
    updated_at: `${goal.start_date}T00:00:00.000Z`,
    ...goal,
  };
}

function seedProgress(goalId: string, progress: Partial<ProgressContextSummary>): ProgressContextSummary {
  return {
    goalId,
    admissibleCompletionCount: 0,
    creditedUnitCount: 0,
    expectedUnitCount: 0,
    percent: 0,
    lifecycle: "active",
    outcome: "in_progress",
    placementTerminal: false,
    periodSatisfied: false,
    currentPeriodCompletionCount: 0,
    currentPeriodTarget: 1,
    closedPeriodHitRatePercent: null,
    currentStreak: 0,
    longestStreak: 0,
    milestoneDates: [],
    ...progress,
  };
}

export const GOALS: readonly Goal[] = [
  seedGoal({
    id: "goal-run",
    title: "Run 3 days a week",
    category: "health",
    frequency_type: "recurring",
    recurrence_interval: "weekly",
    target_count: 3,
    start_date: "2026-08-03",
    default_local_time: "06:30",
    reward_text: "A race-day watch",
  }),
  seedGoal({
    id: "goal-japanese",
    title: "Conversational Japanese",
    category: "personal",
    frequency_type: "recurring",
    recurrence_interval: "daily",
    difficulty: "hard",
    start_date: "2026-06-01",
    default_local_time: "07:30",
  }),
  seedGoal({
    id: "goal-ship",
    title: "Ship side project v2",
    category: "career",
    frequency_type: "fixed_milestones",
    difficulty: "hard",
    target_count: 6,
    target_basis: "lifetime",
    milestone_names: ["Spec", "Auth", "Sync", "Billing", "Beta", "Launch"],
    start_date: "2026-09-01",
    end_date: "2026-12-15",
    reward_text: "A weekend in Big Sur",
  }),
  seedGoal({
    id: "goal-cycle",
    title: "Cycle to work twice a week",
    category: "health",
    frequency_type: "recurring",
    recurrence_interval: "weekly",
    difficulty: "easy",
    target_count: 2,
    start_date: "2026-11-02",
  }),
  seedGoal({
    id: "goal-therapy",
    title: "Therapy every other week",
    category: "personal",
    frequency_type: "recurring",
    recurrence_interval: "monthly",
    difficulty: "easy",
    target_count: 2,
    start_date: "2026-03-02",
    is_private: true,
  }),
  // Finished: the Goals page files it under Past goals, so it is never "current".
  seedGoal({
    id: "goal-books",
    title: "Read 12 books",
    category: "personal",
    frequency_type: "recurring",
    recurrence_interval: "weekly",
    target_count: 12,
    target_basis: "lifetime",
    start_date: "2026-01-05",
    end_date: "2026-05-03",
    reward_text: "A first edition",
  }),
];

export const GOAL_PROGRESS: readonly ProgressContextSummary[] = [
  seedProgress("goal-run", {
    admissibleCompletionCount: 24,
    creditedUnitCount: 24,
    expectedUnitCount: 27,
    percent: 89,
    currentPeriodCompletionCount: 2,
    currentPeriodTarget: 3,
    closedPeriodHitRatePercent: 89,
    currentStreak: 6,
    longestStreak: 9,
  }),
  seedProgress("goal-japanese", {
    admissibleCompletionCount: 102,
    creditedUnitCount: 102,
    expectedUnitCount: 127,
    percent: 80,
    periodSatisfied: true,
    currentPeriodCompletionCount: 1,
    closedPeriodHitRatePercent: 80,
    currentStreak: 12,
    longestStreak: 21,
  }),
  seedProgress("goal-ship", {
    admissibleCompletionCount: 3,
    creditedUnitCount: 3,
    expectedUnitCount: 6,
    percent: 50,
    currentPeriodTarget: null,
    milestoneDates: ["2026-09-09", "2026-09-24", "2026-10-02"],
  }),
  seedProgress("goal-cycle", { lifecycle: "upcoming", currentPeriodTarget: 2 }),
  seedProgress("goal-therapy", {
    admissibleCompletionCount: 15,
    creditedUnitCount: 15,
    expectedUnitCount: 16,
    percent: 94,
    currentPeriodCompletionCount: 1,
    currentPeriodTarget: 2,
  }),
  seedProgress("goal-books", {
    admissibleCompletionCount: 12,
    creditedUnitCount: 12,
    expectedUnitCount: 12,
    percent: 100,
    lifecycle: "ended",
    outcome: "achieved",
    placementTerminal: true,
    achievementDate: "2026-05-03",
  }),
];

export const INITIAL_DRAFT: ProfileDraft = {
  bio: "Training for a fall half. Slowly learning Japanese. Shipping on Sundays.",
  pins: ["medal-8", "plaque-half", "record-streak"],
  featuredGoalIds: ["goal-run", "goal-japanese", "goal-ship"],
  audience: { bio: "everyone", showcase: "everyone", goals: "everyone" },
};

export const PROFILE: ProfileSnapshot = {
  identity: IDENTITY,
  stats: OVERALL_STATS,
  level: LEVEL,
  catalog: SHOWCASE_CATALOG,
  goals: GOALS,
  progress: GOAL_PROGRESS,
};
