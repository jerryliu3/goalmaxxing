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
}

export interface DigestSourceCompletion {
  goalId: string;
  completedOn: string;
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

/**
 * Every session placed in a window, tagged with whether it was credited on the
 * day it was placed. One completion exists per goal per day
 * (`planner_items_goal_date_unique`), so matching on that pair is exact.
 *
 * Both window summaries and the recover list are projections over these rows,
 * so each window is walked once and the two can never disagree.
 */
function windowRows({
  items,
  completions,
  start,
  end,
}: {
  items: DigestSourceItem[];
  completions: DigestSourceCompletion[];
  start: string;
  end: string;
}): DigestFactItem[] {
  const completedKeys = new Set(
    completions
      .filter((completion) => inRange(completion.completedOn, start, end))
      .map((completion) => `${completion.goalId}:${completion.completedOn}`)
  );
  return items
    .filter((item) => inRange(item.scheduledDate, start, end))
    .map((item) => ({
      title: item.title,
      date: item.scheduledDate,
      state: completedKeys.has(`${item.goalId}:${item.scheduledDate}`)
        ? "completed"
        : "open",
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

export function buildDigestFacts({
  period,
  items,
  completions,
  goals = [],
}: {
  period: DigestPeriod;
  items: DigestSourceItem[];
  completions: DigestSourceCompletion[];
  goals?: DigestSourceGoal[];
}): DigestFacts {
  const recapRows = windowRows({
    items,
    completions,
    start: period.recapStart,
    end: period.recapEnd,
  });
  const aheadRows = windowRows({
    items,
    completions,
    start: period.aheadStart,
    end: period.aheadEnd,
  });
  const missed = recapRows.filter((row) => row.state === "open");

  return digestFactsSchema.parse({
    recap: summarizeWindow(
      windowLabel(period.kind, "recap"),
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
    recover: { count: missed.length, items: missed.slice(0, DIGEST_ITEM_LIMIT) },
    unscheduled: summarizeUnscheduled({ period, items, goals }),
  });
}
