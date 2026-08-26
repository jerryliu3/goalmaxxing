import {
  addDaysToDateString,
  compareDateStrings,
  differenceInDateStrings,
  getAnchoredPeriod,
  getAnchoredPeriodStart,
  type WeeklyAnchorContext,
} from "@/lib/goals/periods";
import type { RecurrenceInterval } from "@/lib/goals/types";

export interface ChecklistTemporalContext {
  selectedDate: string;
  asOfDate: string;
  weeklyAnchor: WeeklyAnchorContext | null;
}

export function createChecklistTemporalContext({
  selectedDate,
  asOfDate,
  weeklyAnchor,
}: {
  selectedDate: string;
  asOfDate: string;
  weeklyAnchor?: WeeklyAnchorContext | null;
}): ChecklistTemporalContext {
  return {
    selectedDate,
    asOfDate,
    weeklyAnchor: weeklyAnchor ?? null,
  };
}

export type PlannerCalendarPeriodKey = string & {
  readonly __periodDomain: "planner-calendar";
};

export type ProgressDisplayPeriodKey = string & {
  readonly __periodDomain: "progress-display";
};

export type XPCreditPeriodKey = string & {
  readonly __periodDomain: "xp-credit";
};

export function getProgressDisplayPeriodKey(
  anchorDate: string,
  interval: RecurrenceInterval,
  referenceDate: string,
  weeklyAnchor?: WeeklyAnchorContext | null
): ProgressDisplayPeriodKey {
  return getAnchoredPeriod(
    anchorDate,
    interval,
    referenceDate,
    weeklyAnchor ?? null
  ).periodKey as ProgressDisplayPeriodKey;
}

export function getPlannerCalendarPeriodKey(
  interval: RecurrenceInterval,
  scheduledDate: string,
  weekStartsOn: number
): PlannerCalendarPeriodKey {
  if (interval === "daily") {
    return scheduledDate as PlannerCalendarPeriodKey;
  }

  return getAnchoredPeriod(
    scheduledDate,
    interval,
    scheduledDate,
    interval === "weekly" ? { weekStartsOn } : null
  ).periodKey as PlannerCalendarPeriodKey;
}

function getGoalAnchoredMonthlyPeriodStart(
  anchorDate: string,
  index: number
) {
  const monthStart = getAnchoredPeriodStart(anchorDate, "monthly", index);
  const nextMonthStart = getAnchoredPeriodStart(
    anchorDate,
    "monthly",
    index + 1
  );
  const anchorDay = Number(anchorDate.slice(8, 10));
  const lastDay = differenceInDateStrings(nextMonthStart, monthStart);
  return addDaysToDateString(monthStart, Math.min(anchorDay, lastDay) - 1);
}

export function getXPCreditPeriodKey(
  anchorDate: string,
  interval: RecurrenceInterval,
  referenceDate: string
): XPCreditPeriodKey {
  const effectiveReference =
    compareDateStrings(referenceDate, anchorDate) < 0
      ? anchorDate
      : referenceDate;

  if (interval === "daily") {
    return effectiveReference as XPCreditPeriodKey;
  }

  if (interval === "weekly") {
    const index = Math.floor(
      differenceInDateStrings(effectiveReference, anchorDate) / 7
    );
    return addDaysToDateString(anchorDate, index * 7) as XPCreditPeriodKey;
  }

  const anchorYear = Number(anchorDate.slice(0, 4));
  const anchorMonth = Number(anchorDate.slice(5, 7));
  const referenceYear = Number(effectiveReference.slice(0, 4));
  const referenceMonth = Number(effectiveReference.slice(5, 7));
  let index = Math.max(
    0,
    (referenceYear - anchorYear) * 12 + (referenceMonth - anchorMonth)
  );

  while (
    index > 0 &&
    getGoalAnchoredMonthlyPeriodStart(anchorDate, index) > effectiveReference
  ) {
    index -= 1;
  }

  while (
    getGoalAnchoredMonthlyPeriodStart(anchorDate, index + 1) <=
    effectiveReference
  ) {
    index += 1;
  }

  return getGoalAnchoredMonthlyPeriodStart(
    anchorDate,
    index
  ) as XPCreditPeriodKey;
}
