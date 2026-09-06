import {
  DIGEST_ITEM_LIMIT,
  digestFactsSchema,
  type DigestFactItem,
  type DigestFacts,
} from "@/lib/digest/contract";
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

function inRange(date: string, start: string, end: string) {
  return date >= start && date <= end;
}

function windowLabel(kind: DigestPeriod["kind"], section: "recap" | "ahead") {
  if (kind === "weekly") {
    return section === "recap" ? "Last week" : "This week";
  }
  return section === "recap" ? "Yesterday" : "Today";
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
  const completedKeys = new Set(
    completions
      .filter((completion) => inRange(completion.completedOn, start, end))
      .map((completion) => `${completion.goalId}:${completion.completedOn}`)
  );
  const factItems: DigestFactItem[] = windowItems.slice(0, DIGEST_ITEM_LIMIT).map((item) => ({
    title: item.title,
    date: item.scheduledDate,
    state: completedKeys.has(`${item.goalId}:${item.scheduledDate}`)
      ? "completed"
      : "open",
  }));
  const completed = windowItems.filter((item) =>
    completedKeys.has(`${item.goalId}:${item.scheduledDate}`)
  ).length;

  return {
    label,
    start,
    end,
    placed: windowItems.length,
    completed,
    items: factItems,
  };
}

export function buildDigestFacts({
  period,
  items,
  completions,
}: {
  period: DigestPeriod;
  items: DigestSourceItem[];
  completions: DigestSourceCompletion[];
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
  });
}
