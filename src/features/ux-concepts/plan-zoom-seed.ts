import {
  itemsOnDate,
  type ConceptItem,
} from "@/features/ux-concepts/seed";

/** Extra placed work so the zoom prototype has a fuller week and month. */
export const planZoomExtraItems: readonly ConceptItem[] = [
  {
    id: "easy-walk",
    title: "Easy walk",
    kind: "goal",
    category: "Health",
    tone: "emerald",
    cadence: "Weekly",
    date: "2026-08-30",
    completed: true,
  },
  {
    id: "mobility",
    title: "Mobility",
    kind: "goal",
    category: "Health",
    tone: "violet",
    cadence: "3× this week",
    date: "2026-08-31",
    completed: true,
  },
  {
    id: "inbox-zero",
    title: "Inbox zero",
    kind: "task",
    category: "Career",
    tone: "blue",
    cadence: "One-time",
    date: "2026-09-02",
    completed: false,
  },
  {
    id: "meal-prep",
    title: "Meal prep",
    kind: "goal",
    category: "Health",
    tone: "emerald",
    cadence: "Weekly",
    date: "2026-09-05",
    completed: false,
  },
  {
    id: "partner-checkin",
    title: "Partner check-in",
    kind: "goal",
    category: "Relationships",
    tone: "violet",
    cadence: "Weekly",
    date: "2026-09-10",
    completed: false,
  },
  {
    id: "long-session",
    title: "Long session",
    kind: "goal",
    category: "Health",
    tone: "emerald",
    cadence: "Weekly",
    date: "2026-09-13",
    completed: false,
  },
  {
    id: "board-prep",
    title: "Board prep",
    kind: "task",
    category: "Career",
    tone: "amber",
    cadence: "One-time",
    date: "2026-09-17",
    completed: false,
  },
  {
    id: "family-dinner",
    title: "Family dinner",
    kind: "goal",
    category: "Relationships",
    tone: "violet",
    cadence: "Weekly",
    date: "2026-09-20",
    completed: false,
  },
];

export function zoomItemsOnDate(
  date: string,
  recoveredStrengthDate?: string | null
) {
  return [
    ...itemsOnDate(date, recoveredStrengthDate),
    ...planZoomExtraItems.filter((item) => item.date === date),
  ];
}
