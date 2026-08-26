import type { GoalFrequencyType, GoalTargetBasis, RecurrenceInterval } from "@/lib/goals/types";
import {
  compareDateStrings,
  getAnchoredPeriod,
} from "@/lib/goals/periods";
import {
  MAX_GOAL_TARGET_COUNT,
  MAX_HORIZON_MONTHS,
} from "@/lib/planner/contracts/bounds";
import {
  enumerateDates,
  enumerateMonthsInWindow,
  getUtcWeekday,
} from "@/lib/planner/dates";
import { resolveGoalTargetBasisFromInput } from "@/lib/goals/target-basis";

export interface GoalDefinitionValidationInput {
  frequencyType: GoalFrequencyType;
  targetCount: number | null;
  targetBasis?: GoalTargetBasis | null;
  recurrenceInterval?: RecurrenceInterval | null;
  startDate: string;
  endDate: string | null;
  asOfDate?: string;
  capacity?: GoalCapacityInput;
}

export interface GoalCapacityInput {
  restWeekdays: number[];
  blackoutRanges: Array<{ start: string; end: string }>;
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

export function countAvailableDays(
  { start, end }: { start: string; end: string },
  capacity: GoalCapacityInput
) {
  if (compareDateStrings(start, end) > 0) {
    return 0;
  }
  const restWeekdays = new Set(capacity.restWeekdays);
  let available = 0;
  for (const date of enumerateDates({ start, end })) {
    if (restWeekdays.has(getUtcWeekday(date))) {
      continue;
    }
    const blocked = capacity.blackoutRanges.some(
      (range) =>
        compareDateStrings(date, range.start) >= 0 &&
        compareDateStrings(date, range.end) <= 0
    );
    if (blocked) {
      continue;
    }
    available += 1;
  }
  return available;
}

function countMinimumAvailableDaysPerPeriod(
  {
    start,
    end,
  }: {
    start: string;
    end: string;
  },
  interval: RecurrenceInterval,
  capacity: GoalCapacityInput
) {
  const availableByPeriod = new Map<string, number>();
  const restWeekdays = new Set(capacity.restWeekdays);

  for (const date of enumerateDates({ start, end })) {
    const period = getAnchoredPeriod(start, interval, date);
    if (!availableByPeriod.has(period.periodKey)) {
      availableByPeriod.set(period.periodKey, 0);
    }
    if (restWeekdays.has(getUtcWeekday(date))) {
      continue;
    }
    const blocked = capacity.blackoutRanges.some(
      (range) =>
        compareDateStrings(date, range.start) >= 0 &&
        compareDateStrings(date, range.end) <= 0
    );
    if (!blocked) {
      availableByPeriod.set(
        period.periodKey,
        (availableByPeriod.get(period.periodKey) ?? 0) + 1
      );
    }
  }

  return Math.min(...availableByPeriod.values());
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

export function resolveGoalPlanningEndDate(
  input: Pick<
    GoalDefinitionValidationInput,
    "frequencyType" | "targetCount" | "targetBasis" | "startDate" | "endDate" | "asOfDate"
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
  return getGoalHorizonEndDate(horizonAnchor);
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
  if (
    input.capacity &&
    periodTarget !== null &&
    input.recurrenceInterval &&
    isIsoDate(windowStart) &&
    compareDateStrings(windowStart, planningEndDate) <= 0
  ) {
    const available = countMinimumAvailableDaysPerPeriod(
      { start: windowStart, end: planningEndDate },
      input.recurrenceInterval,
      input.capacity
    );
    if (periodTarget > available) {
      issues.push({
        code: "target_exceeds_capacity",
        message: `Only ${available} available days in at least one ${input.recurrenceInterval} period before ${planningEndDate} with your current rest days and blackout ranges — ${periodTarget} sessions likely won't all fit.`,
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
  if (
    input.capacity &&
    !exceedsTargetLimit &&
    typeof input.targetCount === "number"
  ) {
    const available = countAvailableDays(
      { start: windowStart, end: planningEndDate },
      input.capacity
    );
    if (input.targetCount > available) {
      issues.push({
        code: "target_exceeds_capacity",
        message: `Only ${available} available days before ${planningEndDate} with your current rest days and blackout ranges — ${input.targetCount} sessions likely won't all fit. Lower the target, extend the end date, or free up rest days.`,
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
