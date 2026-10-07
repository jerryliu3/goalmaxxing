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
  entries: FolioEntry[];
  completions: number;
}

export function folioDate(date: string) {
  return format(parseISO(date), "MMM d, yyyy");
}

/** Use canonical lifetime summaries, never the currently selected year's facts. */
export function buildGoalFolios(
  goals: Goal[],
  summaries: ProgressContextSummary[],
  userId: string,
): GoalFolio[] {
  const byId = new Map(summaries.map(summary => [summary.goalId, summary]));
  const volumes = new Map<string, FolioEntry[]>();
  for (const goal of goals) {
    if (goal.owner_id !== userId || goal.is_deleted) continue;
    const progress = byId.get(goal.id);
    if (!progress?.placementTerminal) continue;
    const closedOn = progress.achievementDate
      ?? (progress.lifecycle === "archived" ? goal.archived_at?.slice(0, 10) : goal.end_date);
    // A terminal goal must have a dated ending to belong to a historical volume.
    if (!closedOn) continue;
    const year = closedOn.slice(0, 4);
    const entries = volumes.get(year) ?? [];
    entries.push({
      goal, progress, closedOn,
      status: progress.outcome === "achieved" ? "Completed" : progress.lifecycle === "archived" ? "Archived" : "Ended",
      fields: goalCardFields(goal),
    });
    volumes.set(year, entries);
  }
  return [...volumes.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([year, entries]) => ({
      year,
      entries: entries.sort((a, b) => a.closedOn.localeCompare(b.closedOn) || a.goal.start_date.localeCompare(b.goal.start_date) || a.goal.id.localeCompare(b.goal.id)),
      completions: entries.reduce((total, entry) => total + entry.progress.admissibleCompletionCount, 0),
    }));
}

/** Past holds finished and ended goals; archived goals get their own section. */
export function splitPastGoals(folios: GoalFolio[]) {
  const entries = folios.flatMap(folio => folio.entries);
  return {
    past: entries.filter(entry => entry.progress.lifecycle !== "archived"),
    archived: entries.filter(entry => entry.progress.lifecycle === "archived"),
  };
}

/** Current includes unscheduled and upcoming goals, not just today's checklist. */
export function buildCurrentGoals(goals: Goal[], summaries: ProgressContextSummary[], userId: string) {
  return selectCurrentGoals(goals, summaries, userId);
}
