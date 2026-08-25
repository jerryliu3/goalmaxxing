import type { GoalFrequencyType, RecurrenceInterval } from "@/lib/goals/types";

export type GoalCreateKind = GoalFrequencyType | "planner_task";

export const GOAL_TYPE_OPTIONS: Array<{ value: GoalFrequencyType; label: string }> = [
  { value: "recurring", label: "Recurring" },
  { value: "fixed_milestones", label: "Milestones" },
];

export const PLANNER_TASK_TYPE_OPTION = {
  value: "planner_task",
  label: "Task",
} as const;

export const GOAL_CREATE_KIND_HELP: Record<GoalCreateKind, string> = {
  recurring:
    "Performing the same action on an approximate frequency (not rigid).",
  fixed_milestones:
    "A goal made of smaller steps or irregular frequencies.",
  planner_task:
    "A small one-time item. Saved to Planner → Tasks, not as a scheduled goal.",
};

export function isPlannerTaskCreateKind(
  kind: GoalCreateKind
): kind is "planner_task" {
  return kind === "planner_task";
}

export const RECURRENCE_INTERVAL_OPTIONS: Array<{
  value: RecurrenceInterval;
  label: string;
}> = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];
