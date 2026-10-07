import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import type { AchievementsShowcasePayload } from "@/features/achievements/types";
import { buildGoalFolios } from "@/features/insights/folio/folio-model";
import type { WeekRhythmGoalRow } from "@/features/insights/week-rhythm-model";
import type { CompletionDateFact, Goal } from "@/lib/goals/types";

/** Fixed, local-only account. No prototype component reads a real account. */
export const AS_OF = "2026-09-16";
export const INITIAL_MONTH = "2026-09";
const OWNER = "progress-overview-sample";

export const ACTIVE_GOALS = [
  { id: "run", title: "Run a half marathon", color: "#52734d", target: 3, interval: "weekly", days: [2, 5, 9, 14, 16], planned: [14, 16, 18] },
  { id: "strength", title: "Build strength", color: "#94724e", target: 2, interval: "weekly", days: [1, 4, 8, 11, 15], planned: [15, 17] },
  { id: "read", title: "Read every day", color: "#80748d", target: 1, interval: "daily", days: [1, 2, 3, 5, 7, 8, 10, 11, 14, 15, 16], planned: [14, 15, 16, 17, 18, 19, 20] },
  { id: "thesis", title: "Finish my thesis", color: "#57786a", target: 6, interval: "milestones", days: [3, 10], planned: [] },
] as const;

export const MILESTONES = [
  { name: "Proposal", date: "2026-08-27" },
  { name: "Literature review", date: "2026-09-03" },
  { name: "Research", date: "2026-09-10" },
  { name: "First draft", date: null },
  { name: "Revisions", date: null },
  { name: "Submit", date: null },
];

export const COMPLETIONS: CompletionDateFact[] = [
  ...ACTIVE_GOALS.flatMap(goal => goal.days.map(day => ({
    goal_id: goal.id,
    completed_on: `2026-09-${String(day).padStart(2, "0")}`,
    source: "manual" as const,
  }))),
  { goal_id: "thesis", completed_on: "2026-08-27", source: "manual" },
];

export const WEEK_ROWS: WeekRhythmGoalRow[] = ACTIVE_GOALS
  .filter(goal => goal.planned.length > 0)
  .map(goal => ({
    goalId: goal.id, title: goal.title, color: goal.color,
    days: Array.from({ length: 7 }, (_, index) => {
      const day = index + 14;
      const planned = (goal.planned as readonly number[]).includes(day);
      const complete = (goal.days as readonly number[]).includes(day);
      return {
        date: `2026-09-${String(day).padStart(2, "0")}`,
        weekdayLabel: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index],
        state: planned ? complete ? "complete" as const : "planned" as const : "empty" as const,
      };
    }),
  }));

const closedSeeds = [
  { id: "swim", title: "Learn to swim", end: "2026-06-28", status: "Completed", count: 24 },
  { id: "pages", title: "Morning pages", end: "2026-07-31", status: "Ended", count: 18 },
  { id: "italian", title: "Learn Italian", end: "2026-08-16", status: "Archived", count: 12 },
] as const;

const closedGoals: Goal[] = closedSeeds.map(seed => ({
  id: seed.id, owner_id: OWNER, title: seed.title,
  description: "A chapter of showing up, kept with the progress you made.",
  category: "personal", color: "#52734d", frequency_type: "recurring",
  recurrence_interval: "daily", target_count: 24, target_basis: "lifetime",
  milestone_names: null, start_date: "2026-05-01", end_date: seed.end,
  photo_path: null, team_id: null, is_deleted: false,
  archived_at: seed.status === "Archived" ? `${seed.end}T12:00:00Z` : null,
  created_at: "2026-05-01T12:00:00Z", updated_at: `${seed.end}T12:00:00Z`,
}));

const closedSummaries: ProgressContextSummary[] = closedSeeds.map(seed => ({
  goalId: seed.id, admissibleCompletionCount: seed.count, creditedUnitCount: seed.count,
  expectedUnitCount: 24, percent: seed.count / 24 * 100,
  lifecycle: seed.status === "Archived" ? "archived" : "ended",
  outcome: seed.status === "Completed" ? "achieved" : "ended_with_shortfall",
  achievementDate: seed.status === "Completed" ? seed.end : null,
  placementTerminal: true, periodSatisfied: false,
  currentPeriodCompletionCount: 0, currentPeriodTarget: null,
  closedPeriodHitRatePercent: null, currentStreak: 0, longestStreak: 3, milestoneDates: [],
}));

export const FOLIOS = buildGoalFolios(closedGoals, closedSummaries, OWNER);
export const SHOWCASE: AchievementsShowcasePayload = {
  schemaVersion: "3",
  collection: { level: 8, totalXp: 2840, unlockedAwards: 3, totalAwards: 4, achievedGoals: 1, featuredAwardId: "level-8" },
  levelAwards: [2, 4, 8, 10].map(level => ({
    id: `level-${level}`, awardId: null, level, title: `Level ${level}`,
    description: "A marker of the effort you’ve put in.",
    unlockedAt: level <= 8 ? "2026-09-12T12:00:00Z" : null,
    revokedAt: null, tier: level >= 8 ? "gold" : "sage",
  })),
  personalRecords: [
    { id: "milestones", label: "Thesis milestones", value: "3", hint: "Of six lifetime milestones", accent: "sage" },
    { id: "closed", label: "Goal achieved", value: "1", hint: "Learn to swim · June 28", accent: "gain" },
  ],
  truncated: { goals: false, completions: false },
};
