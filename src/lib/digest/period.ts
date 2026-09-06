import { normalizeWeekStartsOn } from "@/lib/dates/week-start";
import {
  addDaysToDateString,
  getAnchoredPeriod,
} from "@/lib/goals/periods";

export type DigestKind = "daily" | "weekly";

export interface DigestPeriod {
  kind: DigestKind;
  periodKey: string;
  recapStart: string;
  recapEnd: string;
  aheadStart: string;
  aheadEnd: string;
}

export function resolveDigestPeriod({
  localDate,
  weekStartsOn,
}: {
  localDate: string;
  weekStartsOn: number | null | undefined;
}): DigestPeriod {
  const normalizedWeekStartsOn = normalizeWeekStartsOn(weekStartsOn);
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
