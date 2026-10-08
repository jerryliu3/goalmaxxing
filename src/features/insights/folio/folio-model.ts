import { format, parseISO } from "date-fns";
import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import { selectCurrentGoals } from "@/lib/goals/current-goals";
import type { Goal } from "@/lib/goals/types";
import { goalCardFields } from "@/features/goals/goal-card-fields";
import type { GoalCreationFields } from "@/lib/goals/creation-model";

export interface FolioEntry {
  goal: Goal;
  progress: ProgressContextSummary;
  closedOn: string;
  status: "Completed" | "Archived" | "Ended";
  fields: GoalCreationFields;
}

export interface GoalFolio {
  year: string;
  /** `YYYY-MM` for a month book; year books leave it unset. */
  month?: string;
  entries: FolioEntry[];
  completions: number;
}

export function folioDate(date: string) {
  return format(parseISO(date), "MMM d, yyyy");
}

export function folioKey(folio: GoalFolio) {
  return folio.month ?? folio.year;
}

/** "October 2026" for a month book, "2025" for a year book. */
export function folioLabel(folio: GoalFolio) {
  return folio.month ? format(parseISO(`${folio.month}-01`), "MMMM yyyy") : folio.year;
}

function bindFolios(volumes: Map<string, FolioEntry[]>, order: (a: FolioEntry, b: FolioEntry) => number): GoalFolio[] {
  return [...volumes.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, entries]) => ({
      year: key.slice(0, 4),
      ...(key.length > 4 ? { month: key } : {}),
      entries: entries.sort(order),
      completions: entries.reduce((total, entry) => total + entry.progress.admissibleCompletionCount, 0),
    }));
}

/** Use canonical lifetime summaries, never the currently selected year's facts. */
export function buildFolioEntries(
  goals: Goal[],
  summaries: ProgressContextSummary[],
  userId: string,
): FolioEntry[] {
  const byId = new Map(summaries.map(summary => [summary.goalId, summary]));
  const entries: FolioEntry[] = [];
  for (const goal of goals) {
    if (goal.owner_id !== userId || goal.is_deleted) continue;
    const progress = byId.get(goal.id);
    if (!progress?.placementTerminal) continue;
    const closedOn = progress.achievementDate
      ?? (progress.lifecycle === "archived" ? goal.archived_at?.slice(0, 10) : goal.end_date);
    // A terminal goal must have a dated ending to belong to a historical volume.
    if (!closedOn) continue;
    entries.push({
      goal, progress, closedOn,
      status: progress.outcome === "achieved" ? "Completed" : progress.lifecycle === "archived" ? "Archived" : "Ended",
      fields: goalCardFields(goal),
    });
  }
  return entries;
}

/** One volume per closing year, chapters in closing order. */
export function buildGoalFolios(
  goals: Goal[],
  summaries: ProgressContextSummary[],
  userId: string,
): GoalFolio[] {
  const volumes = new Map<string, FolioEntry[]>();
  for (const entry of buildFolioEntries(goals, summaries, userId)) {
    const year = entry.closedOn.slice(0, 4);
    volumes.set(year, [...(volumes.get(year) ?? []), entry]);
  }
  return bindFolios(volumes, (a, b) => a.closedOn.localeCompare(b.closedOn) || a.goal.start_date.localeCompare(b.goal.start_date) || a.goal.id.localeCompare(b.goal.id));
}

/**
 * Past goals filed by when they started: a book per month of the current
 * year, a book per year before it. Newest book first, goals in start order.
 */
export function buildGoalBooks(entries: FolioEntry[], currentYear: string): GoalFolio[] {
  const books = new Map<string, FolioEntry[]>();
  for (const entry of entries) {
    const start = entry.goal.start_date;
    const key = start.slice(0, 4) >= currentYear ? start.slice(0, 7) : start.slice(0, 4);
    books.set(key, [...(books.get(key) ?? []), entry]);
  }
  return bindFolios(books, (a, b) => a.goal.start_date.localeCompare(b.goal.start_date) || a.closedOn.localeCompare(b.closedOn) || a.goal.id.localeCompare(b.goal.id));
}

/** Past holds finished and ended goals; archived goals get their own section. */
export function splitPastGoals(entries: FolioEntry[]) {
  return {
    past: entries.filter(entry => entry.progress.lifecycle !== "archived"),
    archived: entries.filter(entry => entry.progress.lifecycle === "archived"),
  };
}

/** Current includes unscheduled and upcoming goals, not just today's checklist. */
export function buildCurrentGoals(goals: Goal[], summaries: ProgressContextSummary[], userId: string) {
  return selectCurrentGoals(goals, summaries, userId);
}
