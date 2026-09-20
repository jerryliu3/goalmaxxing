export const DESTINATION_TODAY = {
  day: "Thursday",
  date: "September 3",
  shortDate: "Sep 3",
  monthLabel: "September 2026",
  partner: "Maya",
} as const;

export type ProgressGoalKind = "recurring" | "task" | "milestone";

export interface MilestoneSeed {
  name: string;
  date: string | null;
  done: boolean;
  cell: number | null;
}

export interface ProgressGoalSeed {
  id: string;
  title: string;
  detail: string;
  category: string;
  kind: ProgressGoalKind;
  percent: number;
  currentStreak: number;
  longestStreak: number;
  countLabel: string;
  tone: string;
  milestones?: readonly MilestoneSeed[];
}

export const PROGRESS_GOALS: readonly ProgressGoalSeed[] = [
  {
    id: "tempo",
    title: "Tempo run",
    detail: "45 min · Endurance",
    category: "Endurance",
    kind: "recurring",
    percent: 78,
    currentStreak: 4,
    longestStreak: 9,
    countLabel: "12 / 16",
    tone: "bg-[#c5ddf7]",
  },
  {
    id: "launch",
    title: "Launch notes",
    detail: "Task · Product",
    category: "Product",
    kind: "task",
    percent: 40,
    currentStreak: 0,
    longestStreak: 2,
    countLabel: "2 / 5",
    tone: "bg-[#7eace6]",
  },
  {
    id: "review",
    title: "Review offer",
    detail: "Task · Flexible",
    category: "Product",
    kind: "task",
    percent: 0,
    currentStreak: 0,
    longestStreak: 0,
    countLabel: "unplanned",
    tone: "bg-[#eab308]/40",
  },
  {
    id: "strength",
    title: "Strength",
    detail: "30 min · Missed Tuesday",
    category: "Strength",
    kind: "recurring",
    percent: 22,
    currentStreak: 0,
    longestStreak: 6,
    countLabel: "3 / 14",
    tone: "bg-[#7ed7b2]",
  },
  {
    id: "deep-work",
    title: "Deep work",
    detail: "90 min · Product",
    category: "Product",
    kind: "recurring",
    percent: 90,
    currentStreak: 6,
    longestStreak: 12,
    countLabel: "18 / 20",
    tone: "bg-[#0f64bf]/30",
  },
  {
    id: "thesis",
    title: "Thesis",
    detail: "10 milestones · Product",
    category: "Product",
    kind: "milestone",
    percent: 40,
    currentStreak: 0,
    longestStreak: 0,
    countLabel: "4 / 10",
    tone: "bg-[#f2c45b]",
    milestones: [
      { name: "Topic lock", date: "Aug 31", done: true, cell: 0 },
      { name: "Proposal", date: "Sep 1", done: true, cell: 1 },
      { name: "Advisor notes", date: "Sep 2", done: true, cell: 2 },
      { name: "Outline", date: "Sep 4", done: true, cell: 4 },
      { name: "Lit review", date: null, done: false, cell: 11 },
      { name: "Methods", date: null, done: false, cell: 16 },
      { name: "Chapter 1", date: null, done: false, cell: null },
      { name: "Chapter 2", date: null, done: false, cell: null },
      { name: "Full draft", date: null, done: false, cell: null },
      { name: "Defense", date: null, done: false, cell: null },
    ],
  },
];

export const OVERALL_STATS = {
  weekPercent: 70,
  weekTrend: "+8 vs last week",
  monthPercent: 62,
  monthTrend: "+4 vs last month",
  activeStreakWeeks: 4,
  longestActiveStreakWeeks: 12,
  activities: 186,
  goalsCompleted: 41,
  todayActivities: 2,
  weekActivities: 7,
  monthActivities: 24,
  activeDaysPercent: 58,
  totalDays: 94,
};

export const TEAM_STATS = {
  weekPercent: 81,
  monthPercent: 74,
  streak: 6,
  activities: 210,
};

export const WEEKDAY_RATES = [
  { label: "Mon", percent: 80 },
  { label: "Tue", percent: 40 },
  { label: "Wed", percent: 72 },
  { label: "Thu", percent: 50 },
  { label: "Fri", percent: 86 },
  { label: "Sat", percent: 22 },
  { label: "Sun", percent: 30 },
] as const;

export const CATEGORY_RATES = [
  { label: "Endurance", percent: 78 },
  { label: "Product", percent: 61 },
  { label: "Strength", percent: 22 },
] as const;

export const RATE_SERIES = [
  48, 52, 44, 61, 58, 40, 66, 70, 55, 49, 72, 68, 60, 41, 77, 64, 59, 73, 50,
  62, 69, 45, 80, 71, 58, 63, 74, 52, 70, 62,
];

export const COUNT_SERIES = [
  2, 3, 1, 4, 3, 0, 5, 4, 2, 1, 4, 3, 3, 0, 5, 2, 3, 4, 1, 3, 4, 0, 5, 3, 2, 3,
  4, 1, 4, 2,
];

/** 5 weeks × 7 days, Monday-start, intensity 0–4. Today is week 1, Thursday. */
export const HEATMAP_CELLS: readonly number[] = [
  0, 1, 2, 3, 1, 0, 0, 2, 0, 3, 2, 4, 1, 0, 1, 2, 2, 3, 1, 0, 1, 3, 1, 4, 2, 2,
  0, 0, 1, 0, 2, 1, 3, 1, 0,
];

export const COMMUNITY_STANDINGS = [
  { rank: 1, name: "Alex", xp: 2840, you: false, partner: false },
  { rank: 2, name: "Priya", xp: 2610, you: false, partner: false },
  { rank: 3, name: "Maya", xp: 2400, you: false, partner: true },
  { rank: 4, name: "Chris", xp: 2215, you: false, partner: false },
  { rank: 14, name: "You", xp: 1180, you: true, partner: false },
] as const;

export const COMMUNITY_CHALLENGES = [
  {
    id: "distance",
    title: "September Distance",
    metric: "12 / 20 km",
    audience: "Solo · Global",
    joined: true,
    closed: false,
    participants: 28,
    detail: "Log endurance completions toward 20 km this month.",
  },
  {
    id: "miles",
    title: "Morning miles",
    metric: "3 / 8 runs",
    audience: "Team · Global",
    joined: true,
    closed: false,
    participants: 16,
    detail: "Eight easy runs with Maya’s cohort before month end.",
  },
  {
    id: "deep",
    title: "Deep Work Sprint",
    metric: "4 / 5 sessions",
    audience: "Team · Group",
    joined: false,
    closed: false,
    participants: 11,
    detail: "Five 90-minute product blocks before Sep 12.",
  },
  {
    id: "steps",
    title: "Office steps",
    metric: "Join to track",
    audience: "Solo · Group",
    joined: false,
    closed: false,
    participants: 9,
    detail: "Twelve thousand steps on workdays.",
  },
] as const;

export const CHALLENGE_PEOPLE: Record<
  string,
  readonly {
    rank: number;
    name: string;
    progress: number;
    you: boolean;
    partner: boolean;
  }[]
> = {
  distance: [
    { rank: 1, name: "Alex", progress: 90, you: false, partner: false },
    { rank: 2, name: "Maya", progress: 75, you: false, partner: true },
    { rank: 3, name: "You", progress: 60, you: true, partner: false },
    { rank: 4, name: "Priya", progress: 45, you: false, partner: false },
  ],
  miles: [
    { rank: 1, name: "Maya", progress: 88, you: false, partner: true },
    { rank: 2, name: "You", progress: 38, you: true, partner: false },
    { rank: 3, name: "Chris", progress: 25, you: false, partner: false },
  ],
  deep: [
    { rank: 1, name: "Maya", progress: 80, you: false, partner: true },
    { rank: 2, name: "Chris", progress: 40, you: false, partner: false },
  ],
  steps: [
    { rank: 1, name: "Priya", progress: 70, you: false, partner: false },
    { rank: 2, name: "Alex", progress: 55, you: false, partner: false },
  ],
};

export const COMMUNITY_SEASONS = [
  {
    id: "fall",
    title: "Fall 2026",
    metric: "Completions",
    joined: true,
    closed: false,
    detail: "Live season · you are 14th",
    people: COMMUNITY_STANDINGS,
  },
  {
    id: "summer",
    title: "Summer 2026",
    metric: "XP",
    joined: true,
    closed: true,
    detail: "Closed · you finished 9th",
    people: [
      { rank: 1, name: "Maya", xp: 3100, you: false, partner: true },
      { rank: 2, name: "Alex", xp: 2900, you: false, partner: false },
      { rank: 9, name: "You", xp: 1540, you: true, partner: false },
    ],
  },
  {
    id: "endurance",
    title: "Endurance group",
    metric: "Km",
    joined: false,
    closed: false,
    detail: "Private board · join with group code",
    people: [
      { rank: 1, name: "Priya", xp: 40, you: false, partner: false },
      { rank: 2, name: "Chris", xp: 28, you: false, partner: false },
    ],
  },
] as const;

export const SHARED_GOALS = [
  { title: "Tempo run", you: true, partner: true },
  { title: "Strength", you: true, partner: false },
  { title: "Yoga", you: false, partner: true },
] as const;
