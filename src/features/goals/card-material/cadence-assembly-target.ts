import {
  addDaysToDateString,
  compareDateStrings,
  getAnchoredPeriod,
  type WeeklyAnchorContext,
} from "@/lib/goals/periods";
import type { Goal } from "@/lib/goals/types";
import { isPeriodCadenceGoal } from "@/lib/goals/target-basis";

/** ≈2 months when the goal has no end date. Stable from start_date, not "today". */
export const CADENCE_ASSEMBLY_SOFT_HORIZON_DAYS = 62;
const MIN_TARGET = 1;
const MAX_TARGET = 20;
const HORIZON_FRACTION = 0.9;

/**
 * Full cadence periods whose last day falls on or before `effectiveEnd`.
 * A trailing period that would extend past the window is excluded.
 */
export function countFullCadencePeriodsInWindow(
  goal: Pick<Goal, "start_date" | "recurrence_interval">,
  effectiveEnd: string,
  weeklyAnchor?: WeeklyAnchorContext | null
) {
  if (compareDateStrings(effectiveEnd, goal.start_date) < 0) {
    return 0;
  }
  const interval = goal.recurrence_interval ?? "daily";
  const atEnd = getAnchoredPeriod(
    goal.start_date,
    interval,
    effectiveEnd,
    weeklyAnchor ?? null
  );
  return compareDateStrings(atEnd.end, effectiveEnd) <= 0
    ? atEnd.index + 1
    : atEnd.index;
}

/**
 * Presentation-only shard count for recurring period goals. Milestones and
 * lifetime totals keep their real expected units elsewhere.
 */
export function artificialCadenceAssemblyTarget(
  goal: Goal,
  weeklyAnchor?: WeeklyAnchorContext | null
): number | null {
  if (!isPeriodCadenceGoal(goal)) {
    return null;
  }

  const effectiveEnd =
    goal.end_date ??
    addDaysToDateString(goal.start_date, CADENCE_ASSEMBLY_SOFT_HORIZON_DAYS);
  const fullPeriods = countFullCadencePeriodsInWindow(
    goal,
    effectiveEnd,
    weeklyAnchor
  );
  const rounded = Math.round(fullPeriods * HORIZON_FRACTION);
  return Math.min(MAX_TARGET, Math.max(MIN_TARGET, rounded));
}
