import type {
  PublicProfileIdentity,
  PublicProfileOverallStats,
} from "@cadence/shared/social/public-profile";
import type {
  ProfileDraft,
  ProfileGoal,
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

export const CURRENT_GOALS: readonly ProfileGoal[] = [
  { id: "goal-run", title: "Run 3 days a week", category: "health", cadence: "3 days a week", progress: 0.67, isPrivate: false },
  { id: "goal-japanese", title: "Conversational Japanese", category: "personal", cadence: "20 min daily", progress: 0.42, isPrivate: false },
  { id: "goal-ship", title: "Ship side project v2", category: "career", cadence: "6 milestones", progress: 0.5, isPrivate: false },
  { id: "goal-therapy", title: "Therapy every other week", category: "personal", cadence: "2 days a month", progress: 0.5, isPrivate: true },
];

export const INITIAL_DRAFT: ProfileDraft = {
  bio: "Training for a fall half. Slowly learning Japanese. Shipping on Sundays.",
  pins: ["medal-8", "plaque-half", "record-streak"],
  featuredGoalIds: ["goal-run", "goal-japanese"],
  audience: { bio: "everyone", showcase: "everyone", goals: "everyone" },
};

export const PROFILE: ProfileSnapshot = {
  identity: IDENTITY,
  stats: OVERALL_STATS,
  level: LEVEL,
  catalog: SHOWCASE_CATALOG,
  goals: CURRENT_GOALS,
};
