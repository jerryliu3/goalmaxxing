import {
  CONCEPT_TODAY,
  STRENGTH_MISSED_DATE,
  conceptItems,
  type ConceptItem,
} from "@/features/ux-concepts/seed";
import { conceptGoalCompletionDates } from "@/features/ux-concepts/destination-seed";

export interface ClarityOccurrence {
  id: string;
  goalId: string;
  date: string;
  completed: boolean;
  missed?: boolean;
}

export const CLARITY_FOCUS_GOALS = [
  { id: "tempo-run", title: "Tempo run" },
  { id: "deep-work", title: "Deep work" },
  { id: "strength", title: "Strength" },
  { id: "weekly-reset", title: "Weekly reset" },
  { id: "team-sync", title: "Team sync" },
  { id: "long-ride", title: "Long ride" },
] as const;

export type ClarityFocusGoalId = (typeof CLARITY_FOCUS_GOALS)[number]["id"];

const LIVE_OCCURRENCES: readonly ClarityOccurrence[] = [
  {
    id: `strength:${STRENGTH_MISSED_DATE}`,
    goalId: "strength",
    date: STRENGTH_MISSED_DATE,
    completed: false,
    missed: true,
  },
  {
    id: `tempo-run:${CONCEPT_TODAY}`,
    goalId: "tempo-run",
    date: CONCEPT_TODAY,
    completed: false,
  },
  {
    id: `launch-notes:${CONCEPT_TODAY}`,
    goalId: "launch-notes",
    date: CONCEPT_TODAY,
    completed: false,
  },
  {
    id: `weekly-reset:${CONCEPT_TODAY}`,
    goalId: "weekly-reset",
    date: CONCEPT_TODAY,
    completed: false,
  },
  {
    id: `deep-work:${CONCEPT_TODAY}`,
    goalId: "deep-work",
    date: CONCEPT_TODAY,
    completed: true,
  },
  {
    id: "team-sync:2026-09-04",
    goalId: "team-sync",
    date: "2026-09-04",
    completed: false,
  },
  {
    id: "long-ride:2026-09-06",
    goalId: "long-ride",
    date: "2026-09-06",
    completed: false,
  },
  {
    id: "tempo-run:2026-09-07",
    goalId: "tempo-run",
    date: "2026-09-07",
    completed: false,
  },
];

function historyOccurrences(): ClarityOccurrence[] {
  const liveKeys = new Set(LIVE_OCCURRENCES.map((item) => `${item.goalId}:${item.date}`));
  const history: ClarityOccurrence[] = [];
  for (const [goalId, dates] of Object.entries(conceptGoalCompletionDates)) {
    for (const date of dates) {
      const key = `${goalId}:${date}`;
      if (liveKeys.has(key)) {
        continue;
      }
      history.push({
        id: key,
        goalId,
        date,
        completed: true,
      });
    }
  }
  return history;
}

export const CLARITY_OCCURRENCES: readonly ClarityOccurrence[] = [
  ...historyOccurrences(),
  ...LIVE_OCCURRENCES,
];

const ITEMS_BY_ID = new Map(conceptItems.map((item) => [item.id, item]));

export function occurrenceItem(occurrence: ClarityOccurrence): ConceptItem {
  const base = ITEMS_BY_ID.get(occurrence.goalId);
  if (!base) {
    throw new Error(`Unknown clarity goal ${occurrence.goalId}`);
  }
  return {
    ...base,
    id: occurrence.id,
    date: occurrence.date,
    completed: occurrence.completed,
    missed: occurrence.missed,
  };
}

export function occurrenceDate(
  occurrence: ClarityOccurrence,
  recoveredTo: string | null
) {
  if (occurrence.goalId === "strength" && recoveredTo) {
    return recoveredTo;
  }
  return occurrence.date;
}

export function occurrencesOnDate(
  date: string,
  recoveredTo: string | null,
  occurrences: readonly ClarityOccurrence[] = CLARITY_OCCURRENCES
) {
  return occurrences.filter(
    (occurrence) => occurrenceDate(occurrence, recoveredTo) === date
  );
}

export function isPerfectDay(
  date: string,
  recoveredTo: string | null,
  completedIds: ReadonlySet<string>,
  occurrences: readonly ClarityOccurrence[] = CLARITY_OCCURRENCES
) {
  const items = occurrencesOnDate(date, recoveredTo, occurrences);
  if (items.length === 0) {
    return false;
  }
  return items.every(
    (item) => completedIds.has(item.id) && !item.missed
  );
}

export function focusedOccurrences(
  goalId: string | null,
  occurrences: readonly ClarityOccurrence[] = CLARITY_OCCURRENCES
) {
  if (!goalId) {
    return occurrences;
  }
  return occurrences.filter((item) => item.goalId === goalId);
}

export const CHECKLIST_INITIAL_DONE = ["deep-work", "launch-notes"] as const;
