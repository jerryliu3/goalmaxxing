import { normalizeWeekStartsOn } from "@/lib/dates/week-start";
import {
  addDaysToDateString,
  getAnchoredPeriod,
} from "@/lib/goals/periods";

export type DigestKind = "daily" | "weekly" | "monthly";

export interface DigestPeriod {
  kind: DigestKind;
  periodKey: string;
  recapStart: string;
  recapEnd: string;
  aheadStart: string;
  aheadEnd: string;
}

/**
 * At most one check-in is owed per open, so the widest cadence that starts today
 * wins: a month start is also a possible week start, and every day is a day
 * start. The narrower check-ins for that date are simply not offered — a month
 * check-in already covers the day and week ahead.
 */
export function resolveDigestPeriod({
  localDate,
  weekStartsOn,
}: {
  localDate: string;
  weekStartsOn: number | null | undefined;
}): DigestPeriod {
  const normalizedWeekStartsOn = normalizeWeekStartsOn(weekStartsOn);
  const thisMonth = getAnchoredPeriod(localDate, "monthly", localDate);
  if (localDate === thisMonth.start) {
    const lastMonthEnd = addDaysToDateString(thisMonth.start, -1);
    return {
      kind: "monthly",
      periodKey: thisMonth.start,
      recapStart: getAnchoredPeriod(lastMonthEnd, "monthly", lastMonthEnd).start,
      recapEnd: lastMonthEnd,
      aheadStart: thisMonth.start,
      aheadEnd: thisMonth.end,
    };
  }

  const thisWeek = getAnchoredPeriod(localDate, "weekly", localDate, {
    weekStartsOn: normalizedWeekStartsOn,
  });
  if (localDate === thisWeek.start) {
    return {
      kind: "weekly",
      periodKey: thisWeek.start,
      recapStart: addDaysToDateString(thisWeek.start, -7),
      recapEnd: addDaysToDateString(thisWeek.start, -1),
      aheadStart: thisWeek.start,
      aheadEnd: thisWeek.end,
    };
  }

  const yesterday = addDaysToDateString(localDate, -1);
  return {
    kind: "daily",
    periodKey: localDate,
    recapStart: yesterday,
    recapEnd: yesterday,
    aheadStart: localDate,
    aheadEnd: localDate,
  };
}
