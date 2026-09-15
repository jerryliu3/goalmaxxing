import { format, parseISO } from "date-fns";
import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import type { Goal } from "@/lib/goals/types";
import { getCategorySelectionFromValue, getCategorySwatchColor } from "@/lib/goals/category";
import type { GoalCreationFields } from "@/features/goals/goal-creation-model";

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

function cardFields(goal: Goal): GoalCreationFields {
  const category = getCategorySelectionFromValue(goal.category);
  return {
    title: goal.title,
    description: goal.description ?? "",
    category_selection: category.selection,
    custom_category: category.customValue,
    color: goal.color ?? getCategorySwatchColor(category.selection),
    frequency_type: goal.frequency_type,
    recurrence_interval: goal.recurrence_interval ?? "daily",
    target_count: String(goal.target_count ?? 1),
    target_basis: goal.target_basis,
    milestone_names: goal.milestone_names ?? [],
    start_date: goal.start_date,
    end_date: goal.end_date ?? "",
    default_local_time: goal.default_local_time ?? "",
    difficulty: goal.difficulty ?? "medium",
    is_private: goal.is_private ?? false,
    linked_target_goal_id: "none",
  };
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
      fields: cardFields(goal),
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
