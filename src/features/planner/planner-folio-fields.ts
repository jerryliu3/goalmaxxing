import { format, parseISO } from "date-fns";
import {
  getCategorySelectionFromValue,
  getCategorySwatchColor,
} from "@/lib/goals/category";
import type { GoalCreationFields } from "@/features/goals/goal-creation-model";
import type { PlannerActiveGoalSnapshot } from "@/features/planner/calendar-surface.types";

export function snapshotToCreationFields(
  snapshot: PlannerActiveGoalSnapshot | null,
  title: string
): GoalCreationFields {
  const category = getCategorySelectionFromValue(snapshot?.category ?? "personal");
  return {
    title,
    description: "",
    category_selection: category.selection,
    custom_category: category.customValue,
    color: snapshot?.color ?? getCategorySwatchColor(category.selection),
    frequency_type: snapshot?.frequency_type ?? "recurring",
    recurrence_interval: snapshot?.recurrence_interval ?? "daily",
    target_count: String(snapshot?.target_count ?? 1),
    target_basis: snapshot?.target_basis ?? "period",
    milestone_names: [],
    start_date: snapshot?.start_date ?? "",
    end_date: snapshot?.end_date ?? "",
    default_local_time: snapshot?.default_local_time ?? "",
    difficulty: snapshot?.difficulty ?? "medium",
    is_private: snapshot?.is_private ?? false,
    linked_target_goal_id: "none",
  };
}

export function formatSittingDate(isoDate: string | null): string {
  if (!isoDate) return "Pick a day";
  return format(parseISO(isoDate), "EEE, MMM d");
}

export function formatSittingTime(value: string | null | undefined): string {
  if (!value) return "Any time";
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return "Any time";
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return minutes === 0
    ? `${hour12} ${suffix}`
    : `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}
