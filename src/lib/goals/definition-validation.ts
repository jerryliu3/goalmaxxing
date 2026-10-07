import type { GoalFrequencyType, GoalTargetBasis, RecurrenceInterval } from "@/lib/goals/types";
import {
  addDaysToDateString,
  compareDateStrings,
  differenceInDateStrings,
  getAnchoredPeriod,
} from "@/lib/goals/periods";
import {
  MAX_GOAL_TARGET_COUNT,
  MAX_HORIZON_MONTHS,
} from "@/lib/planner/contracts/bounds";
import {
  enumerateMonthsInWindow,
} from "@/lib/planner/dates";
import { resolveGoalTargetBasisFromInput } from "@/lib/goals/target-basis";
import { formatGoalDateLabel } from "@/lib/goals/linked-goal-labels";

export interface GoalDefinitionValidationInput {
  frequencyType: GoalFrequencyType;
  targetCount: number | null;
  targetBasis?: GoalTargetBasis | null;
  recurrenceInterval?: RecurrenceInterval | null;
  startDate: string;
  endDate: string | null;
  asOfDate?: string;
  /** Opts into the soft "days left" warning (the editor passes it; servers do not). */
  schedule?: GoalScheduleInput;
  completedCount?: number;
  currentPeriodCompletedCount?: number;
}

export interface GoalScheduleInput {
  /** Profile week start (0=Sun … 6=Sat) so weekly periods match progress. */
  weekStartsOn?: number;
}

export type GoalDefinitionValidationCode =
  | "invalid_date_range"
  | "horizon_too_long"
  | "target_exceeds_limit"
  | "target_exceeds_period_limit"
  | "target_exceeds_capacity";

export interface GoalDefinitionValidationIssue {
  code: GoalDefinitionValidationCode;
  message: string;
}

const PERIOD_NOUN: Record<RecurrenceInterval, string> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
};

function dayWord(count: number) {
  return count === 1 ? "day" : "days";
}

function sessionWord(count: number) {
  return count === 1 ? "session" : "sessions";
}

function daysInclusive(start: string, end: string) {
  return differenceInDateStrings(end, start) + 1;
}

function remainingNeededCount(targetCount: number, completedCount?: number) {
  return Math.max(0, targetCount - Math.max(0, completedCount ?? 0));
}

function isIsoDate(value: string | null): value is string {
  if (typeof value !== "string") {
    return false;
  }
  try {
    compareDateStrings(value, value);
    return true;
  } catch {
    return false;
  }
}

function resolveTargetBasis(
  input: Pick<
    GoalDefinitionValidationInput,
    "frequencyType" | "recurrenceInterval" | "targetCount" | "targetBasis"
  >
): GoalTargetBasis {
  return resolveGoalTargetBasisFromInput({
    frequencyType: input.frequencyType,
    recurrenceInterval: input.recurrenceInterval,
    targetCount: input.targetCount,
    targetBasis: input.targetBasis,
  }).basis;
}

function maxPeriodTarget(interval: RecurrenceInterval | null | undefined) {
  if (interval === "weekly") {
    return 7;
  }
  if (interval === "monthly") {
    return 31;
  }
  return 1;
}

export function isOrdinalGoalDefinition(
  input: Pick<
    GoalDefinitionValidationInput,
    "frequencyType" | "recurrenceInterval" | "targetCount" | "targetBasis"
  >
) {
  if (input.frequencyType === "fixed_milestones") {
    return true;
  }
  return (
    input.frequencyType === "recurring" &&
    resolveTargetBasis(input) === "lifetime"
  );
}

export function getGoalHorizonEndDate(startDate: string): string | null {
  if (!isIsoDate(startDate)) {
    return null;
  }
  const [yearPart, monthPart] = startDate.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }
  const endMonthIndex = month - 1 + MAX_HORIZON_MONTHS - 1;
  const endYear = year + Math.floor(endMonthIndex / 12);
  const endMonth = (endMonthIndex % 12) + 1;
  const lastDay = new Date(Date.UTC(endYear, endMonth, 0)).getUTCDate();
  return `${endYear}-${String(endMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

function openEndedRecurringPlanningEnd(
  anchor: string,
  interval: RecurrenceInterval,
  targetCount: number,
) {
  const count = Math.max(1, targetCount);
  if (interval === "daily") {
    return addDaysToDateString(anchor, count - 1);
  }
  if (interval === "weekly") {
    return addDaysToDateString(anchor, count * 7 - 1);
  }
  if (interval === "monthly") {
    const [yearPart, monthPart, dayPart] = anchor.split("-");
    const year = Number(yearPart);
    const monthIndex = Number(monthPart) - 1 + count;
    const endYear = year + Math.floor(monthIndex / 12);
    const endMonth = (monthIndex % 12) + 1;
    const day = Number(dayPart);
    const lastDay = new Date(Date.UTC(endYear, endMonth, 0)).getUTCDate();
    const sameDay = `${endYear}-${String(endMonth).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
    return addDaysToDateString(sameDay, -1);
  }
  return null;
}

export function resolveGoalPlanningEndDate(
  input: Pick<
    GoalDefinitionValidationInput,
    | "frequencyType"
    | "recurrenceInterval"
    | "targetCount"
    | "targetBasis"
    | "startDate"
    | "endDate"
    | "asOfDate"
  >
) {
  if (isIsoDate(input.endDate)) {
    return input.endDate;
  }
  if (!isOrdinalGoalDefinition(input)) {
    return null;
  }
  if (!isIsoDate(input.startDate)) {
    return null;
  }
  const normalizedAsOfDate = input.asOfDate ?? null;
  const horizonAnchor =
    isIsoDate(normalizedAsOfDate) &&
    compareDateStrings(normalizedAsOfDate, input.startDate) > 0
      ? normalizedAsOfDate
      : input.startDate;
  const softHorizonEnd = getGoalHorizonEndDate(horizonAnchor);
  if (
    input.frequencyType === "recurring" &&
    input.recurrenceInterval &&
    (input.targetCount ?? 0) > 0
  ) {
    const cadenceEnd = openEndedRecurringPlanningEnd(
      horizonAnchor,
      input.recurrenceInterval,
      input.targetCount ?? 1,
    );
    if (
      cadenceEnd &&
      softHorizonEnd &&
      compareDateStrings(cadenceEnd, softHorizonEnd) <= 0
    ) {
      return cadenceEnd;
    }
  }
  return softHorizonEnd;
}

export function getGoalDeadlineMonthSpan({
  startDate,
  endDate,
}: Pick<GoalDefinitionValidationInput, "startDate" | "endDate">) {
  if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
    return null;
  }
  if (compareDateStrings(startDate, endDate) > 0) {
    return null;
  }
  return enumerateMonthsInWindow({ start: startDate, end: endDate }).length;
}

export function validateGoalDefinition(
  input: GoalDefinitionValidationInput
): GoalDefinitionValidationIssue[] {
  const issues: GoalDefinitionValidationIssue[] = [];
  const targetBasis = resolveTargetBasis(input);
  const isOrdinalGoal = isOrdinalGoalDefinition({ ...input, targetBasis });
  const periodTarget =
    input.frequencyType === "recurring" && targetBasis === "period"
      ? input.targetCount ?? 1
      : null;

  const exceedsTargetLimit =
    isOrdinalGoal &&
    typeof input.targetCount === "number" &&
    input.targetCount > MAX_GOAL_TARGET_COUNT;
  if (exceedsTargetLimit) {
    issues.push({
      code: "target_exceeds_limit",
      message: `Target count cannot exceed ${MAX_GOAL_TARGET_COUNT}.`,
    });
  }

  if (
    isIsoDate(input.startDate) &&
    isIsoDate(input.endDate) &&
    compareDateStrings(input.startDate, input.endDate) > 0
  ) {
    issues.push({
      code: "invalid_date_range",
      message: "End date cannot be before start date.",
    });
    return issues;
  }

  if (periodTarget !== null) {
    const periodMax = maxPeriodTarget(input.recurrenceInterval);
    if (periodTarget > periodMax) {
      issues.push({
        code: "target_exceeds_period_limit",
        message: `Target cannot exceed ${periodMax} completions for this period length.`,
      });
    }
  }

  const planningEndDate = resolveGoalPlanningEndDate({ ...input, targetBasis });
  if (!isIsoDate(input.startDate) || !isIsoDate(planningEndDate)) {
    return issues;
  }
  if (compareDateStrings(input.startDate, planningEndDate) > 0) {
    issues.push({
      code: "invalid_date_range",
      message: "End date cannot be before start date.",
    });
    return issues;
  }

  const windowStart =
    input.asOfDate &&
    isIsoDate(input.asOfDate) &&
    compareDateStrings(input.asOfDate, input.startDate) > 0
      ? input.asOfDate
      : input.startDate;
  // The warning only speaks to days still ahead: once the plan window has
  // elapsed there is nothing left to fit. Rest days and blackouts are soft
  // planner preferences, so every remaining day counts.
  const schedule =
    input.schedule && compareDateStrings(windowStart, planningEndDate) <= 0
      ? input.schedule
      : null;
  if (schedule && periodTarget !== null && input.recurrenceInterval) {
    const period = getAnchoredPeriod(windowStart, input.recurrenceInterval, windowStart, {
      weekStartsOn: schedule.weekStartsOn,
    });
    const periodEnd =
      compareDateStrings(period.end, planningEndDate) < 0 ? period.end : planningEndDate;
    const daysLeft = daysInclusive(windowStart, periodEnd);
    const needed = remainingNeededCount(periodTarget, input.currentPeriodCompletedCount);
    if (needed > daysLeft) {
      issues.push({
        code: "target_exceeds_capacity",
        message: `Only ${daysLeft} ${dayWord(daysLeft)} left this ${PERIOD_NOUN[input.recurrenceInterval]}, so ${needed} ${sessionWord(needed)} might not all fit.`,
      });
    }
  }

  if (!isOrdinalGoal) {
    return issues;
  }

  const monthSpan = enumerateMonthsInWindow({
    start: input.startDate,
    end: planningEndDate,
  }).length;
  if (monthSpan > MAX_HORIZON_MONTHS) {
    issues.push({
      code: "horizon_too_long",
      message: `Goal deadlines cannot span more than ${MAX_HORIZON_MONTHS} calendar months.`,
    });
  }
  if (schedule && !exceedsTargetLimit && typeof input.targetCount === "number") {
    const daysLeft = daysInclusive(windowStart, planningEndDate);
    const remaining = remainingNeededCount(input.targetCount, input.completedCount);
    if (remaining > daysLeft) {
      issues.push({
        code: "target_exceeds_capacity",
        message: `Only ${daysLeft} ${dayWord(daysLeft)} left before ${formatGoalDateLabel(planningEndDate)}, so ${remaining} remaining ${sessionWord(remaining)} might not all fit.`,
      });
    }
  }
  return issues;
}

export function resolveGoalDefinitionValidationFeedback(
  issues: GoalDefinitionValidationIssue[]
): { validationError: string | null; validationWarning: string | null } {
  const blockingIssue = issues.find(
    (issue) => issue.code !== "target_exceeds_capacity"
  );
  if (blockingIssue) {
    return { validationError: blockingIssue.message, validationWarning: null };
  }

  const warningIssue = issues.find(
    (issue) => issue.code === "target_exceeds_capacity"
  );
  return {
    validationError: null,
    validationWarning: warningIssue?.message ?? null,
  };
}
