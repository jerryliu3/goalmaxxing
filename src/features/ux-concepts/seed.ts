export const CONCEPT_TODAY = "2026-09-03" as const;
export const CONCEPT_TODAY_WEEKDAY = "Thursday" as const;
export const CONCEPT_TODAY_LABEL = "Thu, Sep 3" as const;
export const CONCEPT_MONTH_LABEL = "September 2026" as const;
export const CONCEPT_PARTNER_NAME = "Maya" as const;
export const CONCEPT_VIEWER_NAME = "Alex" as const;
export const STRENGTH_MISSED_DATE = "2026-09-01" as const;

export type ConceptKind = "goal" | "task";
export type ConceptTone = "blue" | "emerald" | "violet" | "amber";
export type ConceptCategory = "Health" | "Career" | "Relationships";

export interface ConceptItem {
  id: string;
  title: string;
  kind: ConceptKind;
  category: ConceptCategory;
  tone: ConceptTone;
  cadence: string;
  date: string;
  completed: boolean;
  missed?: boolean;
  note?: string;
  /** Planner items sit on the calendar. Flexible items are checklist-only. */
  placement?: "planner" | "flexible";
}

export interface ConceptPartnerItem {
  id: string;
  title: string;
  date: string;
  completed: boolean;
}

export const conceptItems: readonly ConceptItem[] = [
  {
    id: "tempo-run",
    title: "Tempo run",
    kind: "goal",
    category: "Health",
    tone: "emerald",
    cadence: "3× this week",
    date: CONCEPT_TODAY,
    completed: false,
    note: "Next meaningful action.",
  },
  {
    id: "launch-notes",
    title: "Launch notes",
    kind: "task",
    category: "Career",
    tone: "amber",
    cadence: "One-time",
    date: CONCEPT_TODAY,
    completed: false,
    note: "Scheduled for today. Not a recurring goal.",
  },
  {
    id: "weekly-reset",
    title: "Weekly reset",
    kind: "goal",
    category: "Career",
    tone: "blue",
    cadence: "Weekly",
    date: CONCEPT_TODAY,
    completed: false,
  },
  {
    id: "deep-work",
    title: "Deep work",
    kind: "goal",
    category: "Career",
    tone: "blue",
    cadence: "Daily",
    date: CONCEPT_TODAY,
    completed: true,
  },
  {
    id: "strength",
    title: "Strength",
    kind: "goal",
    category: "Health",
    tone: "violet",
    cadence: "2× this week",
    date: STRENGTH_MISSED_DATE,
    completed: false,
    missed: true,
    note: "Unplaced from Tuesday. Replanning is normal.",
  },
  {
    id: "review-offer",
    title: "Review offer",
    kind: "task",
    category: "Career",
    tone: "amber",
    cadence: "Unscheduled",
    date: CONCEPT_TODAY,
    completed: false,
    placement: "flexible",
    note: "Applicable today. Not a planner item, so it does not appear on the calendar.",
  },
  {
    id: "team-sync",
    title: "Team sync",
    kind: "goal",
    category: "Relationships",
    tone: "violet",
    cadence: "Weekly",
    date: "2026-09-04",
    completed: false,
  },
  {
    id: "long-ride",
    title: "Long ride",
    kind: "goal",
    category: "Health",
    tone: "emerald",
    cadence: "Weekly",
    date: "2026-09-06",
    completed: false,
  },
] as const;

export const partnerItems: readonly ConceptPartnerItem[] = [
  {
    id: "partner-yoga",
    title: "Yoga",
    date: CONCEPT_TODAY,
    completed: true,
  },
  {
    id: "partner-pages",
    title: "Read 20 pages",
    date: "2026-09-02",
    completed: true,
  },
] as const;

export const weekDots: ReadonlyArray<{ date: string; count: number; missed?: boolean }> = [
  { date: "2026-08-30", count: 2 },
  { date: "2026-08-31", count: 1 },
  { date: "2026-09-01", count: 0, missed: true },
  { date: "2026-09-02", count: 3 },
  { date: "2026-09-03", count: 1 },
  { date: "2026-09-04", count: 0 },
  { date: "2026-09-05", count: 0 },
] as const;

export const CONCEPT_WEEK_DONE = 7;
export const CONCEPT_WEEK_PLANNED = 10;
export const CONCEPT_TODAY_REMAINING = 3;
export const CONCEPT_CHECKLIST_REMAINING = 5;
export const CONCEPT_RECOVER_COUNT = 1;

export function itemsOnDate(date: string, recoveredStrengthDate?: string | null) {
  return conceptItems.filter((item) => {
    if (item.placement === "flexible") {
      return false;
    }
    if (item.id === "strength") {
      if (recoveredStrengthDate) {
        return recoveredStrengthDate === date;
      }
      return item.date === date;
    }
    return item.date === date;
  });
}

export function applicableItems(
  date: string,
  recoveredStrengthDate?: string | null
) {
  const placed = itemsOnDate(date, recoveredStrengthDate);
  const flexible = conceptItems.filter(
    (item) => item.placement === "flexible" && item.date === date
  );
  const recover =
    !recoveredStrengthDate && !placed.some((item) => item.id === "strength")
      ? conceptItems.filter((item) => item.id === "strength")
      : [];
  const byId = new Map<string, ConceptItem>();
  for (const item of [...placed, ...flexible, ...recover]) {
    byId.set(item.id, item);
  }
  return [...byId.values()];
}

export function todayOpenCount(
  completedIds: ReadonlySet<string>,
  recoveredStrengthDate: string | null
) {
  return itemsOnDate(CONCEPT_TODAY, recoveredStrengthDate).filter(
    (item) => !completedIds.has(item.id) && !item.completed
  ).length;
}
