import {
  DIGEST_ITEM_LIMIT,
  digestFactsSchema,
  type DigestFactItem,
  type DigestFacts,
} from "@/lib/digest/contract";
import { estimateSessionMinutes } from "@/lib/digest/hours";
import type { DigestPeriod } from "@/lib/digest/period";

export interface DigestSourceItem {
  goalId: string;
  title: string;
  scheduledDate: string;
  /** Credited by the planner's reconciliation, which may match a completion on another day. */
  credited: boolean;
  requirementKind?: DigestFactItem["requirementKind"];
}

export interface DigestSourceGoal {
  goalId: string;
  title: string;
}

function inRange(date: string, start: string, end: string) {
  return date >= start && date <= end;
}

function windowLabel(kind: DigestPeriod["kind"], section: "recap" | "ahead") {
  if (kind === "monthly") {
    return section === "recap" ? "Last month" : "This month";
  }
  if (kind === "weekly") {
    return section === "recap" ? "Last week" : "This week";
  }
  return section === "recap" ? "Yesterday" : "Today";
}

/** Every session placed in a window, tagged with its planner credit state. */
function windowRows({
  items,
  start,
  end,
}: {
  items: DigestSourceItem[];
  start: string;
  end: string;
}): DigestFactItem[] {
  return items
    .filter((item) => inRange(item.scheduledDate, start, end))
    .map((item) => ({
      goalId: item.goalId,
      title: item.title,
      date: item.scheduledDate,
      state: item.credited ? "completed" : "open",
      ...(item.requirementKind ? { requirementKind: item.requirementKind } : {}),
    }));
}

function summarizeWindow(
  label: string,
  start: string,
  end: string,
  rows: DigestFactItem[]
) {
  const completed = rows.filter((row) => row.state === "completed").length;
  return {
    label,
    start,
    end,
    placed: rows.length,
    completed,
    // Only work that is still open costs time from here on.
    estimatedMinutes: estimateSessionMinutes(rows.length - completed),
    items: rows.slice(0, DIGEST_ITEM_LIMIT),
  };
}

/** Active goals with nothing placed in the window ahead. */
function summarizeUnscheduled({
  period,
  items,
  goals,
}: {
  period: DigestPeriod;
  items: DigestSourceItem[];
  goals: DigestSourceGoal[];
}) {
  const placedAhead = new Set(
    items
      .filter((item) => inRange(item.scheduledDate, period.aheadStart, period.aheadEnd))
      .map((item) => item.goalId)
  );
  const unscheduled = goals.filter((goal) => !placedAhead.has(goal.goalId));
  return {
    count: unscheduled.length,
    titles: unscheduled.slice(0, DIGEST_ITEM_LIMIT).map((goal) => goal.title),
  };
}

/**
 * `recoverable` is the recovery review's own list (slipped sessions whose
 * credit window still includes today), so the check-in row and the Agenda
 * entry always count the same sessions. Past-period misses are not in it.
 */
export function buildDigestFacts({
  period,
  items,
  recoverable = [],
  goals = [],
}: {
  period: DigestPeriod;
  items: DigestSourceItem[];
  recoverable?: DigestFactItem[];
  goals?: DigestSourceGoal[];
}): DigestFacts {
  const recapRows = windowRows({
    items,
    start: period.recapStart,
    end: period.recapEnd,
  });
  const aheadRows = windowRows({
    items,
    start: period.aheadStart,
    end: period.aheadEnd,
  });

  return digestFactsSchema.parse({
    recap: summarizeWindow(
      period.recapLabel ?? windowLabel(period.kind, "recap"),
      period.recapStart,
      period.recapEnd,
      recapRows
    ),
    ahead: summarizeWindow(
      windowLabel(period.kind, "ahead"),
      period.aheadStart,
      period.aheadEnd,
      aheadRows
    ),
    recover: {
      count: recoverable.length,
      items: recoverable.slice(0, DIGEST_ITEM_LIMIT),
    },
    unscheduled: summarizeUnscheduled({ period, items, goals }),
  });
}
