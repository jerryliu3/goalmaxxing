import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import { buildGoalFolios } from "@/features/insights/folio/folio-model";
import type { Goal } from "@/lib/goals/types";

export const MILESTONE_NAMES = ["Outline", "First draft", "Publish"] as const;
export const INITIAL_MILESTONES: readonly boolean[] = [true, false, false];
const OWNER = "motion-study-sample";
export const SAMPLE_DATE = "2026-09-18";

export const PORTFOLIO_GOAL: Goal = {
  id: "motion-portfolio", owner_id: OWNER, title: "Launch my portfolio",
  description: "A home for the work I want to share.", category: "career", color: "#785a3a",
  frequency_type: "fixed_milestones", recurrence_interval: null, difficulty: "medium",
  target_count: 3, target_basis: "lifetime", milestone_names: [...MILESTONE_NAMES],
  start_date: "2026-09-01", end_date: "2026-09-30", reward_text: "A slow Saturday morning",
  photo_path: null, team_id: null, is_deleted: false, archived_at: null,
  created_at: "2026-09-01T12:00:00Z", updated_at: "2026-09-18T12:00:00Z",
};

const previousGoal: Goal = {
  ...PORTFOLIO_GOAL, id: "motion-reading", title: "A month of reading", category: "personal",
  frequency_type: "recurring", recurrence_interval: "daily", target_count: 30,
  milestone_names: null, start_date: "2026-07-01", end_date: "2026-08-31",
};

/** Local sample data only. Production must consume its canonical progress response. */
export function portfolioSummary(completed: readonly boolean[]): ProgressContextSummary {
  const count = completed.filter(Boolean).length;
  const achieved = count === MILESTONE_NAMES.length;
  return {
    goalId: PORTFOLIO_GOAL.id, admissibleCompletionCount: count, creditedUnitCount: count,
    expectedUnitCount: 3, percent: count / 3 * 100, lifecycle: "active",
    outcome: achieved ? "achieved" : "in_progress", placementTerminal: achieved,
    achievementDate: achieved ? SAMPLE_DATE : null, periodSatisfied: false,
    currentPeriodCompletionCount: 0, currentPeriodTarget: null,
    closedPeriodHitRatePercent: null, currentStreak: 0, longestStreak: 0,
    milestoneDates: completed.flatMap((done, index) => done ? [index === 0 ? "2026-09-10" : SAMPLE_DATE] : []),
  };
}

export function completeSampleMilestone(completed: readonly boolean[], index: number): readonly boolean[] {
  if (!Number.isInteger(index) || index < 0 || index >= MILESTONE_NAMES.length || completed[index]) return completed;
  return completed.map((done, position) => done || position === index);
}

export function sampleFolios(completed: readonly boolean[]) {
  const current = portfolioSummary(completed);
  const previous: ProgressContextSummary = {
    ...current, goalId: previousGoal.id, admissibleCompletionCount: 30, creditedUnitCount: 30,
    expectedUnitCount: 30, percent: 100, lifecycle: "ended", outcome: "achieved",
    placementTerminal: true, achievementDate: "2026-08-15", milestoneDates: [],
  };
  return buildGoalFolios([previousGoal, PORTFOLIO_GOAL], [previous, current], OWNER);
}
