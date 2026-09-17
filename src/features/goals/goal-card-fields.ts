import type { Goal } from "@/lib/goals/types";
import { getCategorySelectionFromValue, getCategorySwatchColor } from "@/lib/goals/category";
import type { GoalCreationFields } from "./goal-creation-model";

export function goalCardFields(goal: Goal): GoalCreationFields {
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
    difficulty: goal.difficulty ?? "easy",
    is_private: goal.is_private ?? false,
    linked_target_goal_id: "none",
  };
}

