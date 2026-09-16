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

function toFactItem(
  item: DigestSourceItem,
  completedKeys: ReadonlySet<string>
): DigestFactItem {
  return {
    title: item.title,
    date: item.scheduledDate,
    state: completedKeys.has(`${item.goalId}:${item.scheduledDate}`)
      ? "completed"
      : "open",
  };
}

function completedKeysInRange(
  completions: DigestSourceCompletion[],
  start: string,
  end: string
) {
  return new Set(
    completions
      .filter((completion) => inRange(completion.completedOn, start, end))
      .map((completion) => `${completion.goalId}:${completion.completedOn}`)
  );
}

function summarizeWindow({
  label,
  start,
  end,
  items,
  completions,
}: {
  label: string;
  start: string;
  end: string;
  items: DigestSourceItem[];
  completions: DigestSourceCompletion[];
}) {
  const windowItems = items.filter((item) => inRange(item.scheduledDate, start, end));
  const completedKeys = completedKeysInRange(completions, start, end);
  const factItems = windowItems
    .slice(0, DIGEST_ITEM_LIMIT)
    .map((item) => toFactItem(item, completedKeys));
  const completed = windowItems.filter((item) =>
    completedKeys.has(`${item.goalId}:${item.scheduledDate}`)
  ).length;

  return {
    label,
    start,
    end,
    placed: windowItems.length,
    completed,
    // Only work that is still open costs time from here on.
    estimatedMinutes: estimateSessionMinutes(windowItems.length - completed),
    items: factItems,
  };
}

function summarizeRecover({
  period,
  items,
  completions,
}: {
  period: DigestPeriod;
  items: DigestSourceItem[];
  completions: DigestSourceCompletion[];
}) {
  const completedKeys = completedKeysInRange(
    completions,
    period.recapStart,
    period.recapEnd
  );
  const missed = items.filter(
    (item) =>
      inRange(item.scheduledDate, period.recapStart, period.recapEnd) &&
      !completedKeys.has(`${item.goalId}:${item.scheduledDate}`)
  );
  return {
    count: missed.length,
    items: missed
      .slice(0, DIGEST_ITEM_LIMIT)
      .map((item) => toFactItem(item, completedKeys)),
  };
}

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
  return digestFactsSchema.parse({
    recap: summarizeWindow({
      label: windowLabel(period.kind, "recap"),
      start: period.recapStart,
      end: period.recapEnd,
      items,
      completions,
    }),
    ahead: summarizeWindow({
      label: windowLabel(period.kind, "ahead"),
      start: period.aheadStart,
      end: period.aheadEnd,
      items,
      completions,
    }),
    recover: summarizeRecover({ period, items, completions }),
    unscheduled: summarizeUnscheduled({ period, items, goals }),
  });
}
