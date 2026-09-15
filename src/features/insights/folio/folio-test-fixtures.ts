import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";

export function summary(goalId: string, overrides: Partial<ProgressContextSummary> = {}): ProgressContextSummary {
  return {
    goalId, admissibleCompletionCount: 8, creditedUnitCount: 8, expectedUnitCount: 10,
    percent: 80, lifecycle: "ended", outcome: "ended_with_shortfall", placementTerminal: true,
    periodSatisfied: false, currentPeriodCompletionCount: 0, currentPeriodTarget: 1,
    closedPeriodHitRatePercent: 80, currentStreak: 0, longestStreak: 3, milestoneDates: [],
    ...overrides,
  };
}
