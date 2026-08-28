import type { Goal } from "@/lib/goals/types";

export type RecurrenceGroup = "daily" | "weekly" | "monthly" | "fixed";

export const recurrenceGroupOrder: RecurrenceGroup[] = [
  "daily",
  "weekly",
  "monthly",
  "fixed",
];

export const recurrenceGroupLabel: Record<RecurrenceGroup, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  fixed: "Milestones",
};

export function getRecurrenceGroup(
  goal: Pick<Goal, "frequency_type" | "recurrence_interval">
): RecurrenceGroup {
  if (goal.frequency_type === "fixed_milestones") {
    return "fixed";
  }
  if (goal.recurrence_interval === "weekly") {
    return "weekly";
  }
  if (goal.recurrence_interval === "monthly") {
    return "monthly";
  }
  return "daily";
}

export function getRecurrenceIntervalLabel(
  interval: Goal["recurrence_interval"] | null | undefined
): string {
  if (interval === "weekly") {
    return "Weekly";
  }
  if (interval === "monthly") {
    return "Monthly";
  }
  return "Daily";
}

export function getPerPeriodTargetLabel(
  interval: Goal["recurrence_interval"] | null | undefined
): string {
  if (interval === "weekly") {
    return "Target per week";
  }
  if (interval === "monthly") {
    return "Target per month";
  }
  return "Target per period";
}

export function getLinkedGoalRecurrenceLabel(
  goal: Pick<Goal, "frequency_type" | "recurrence_interval">
): string {
  if (goal.frequency_type === "fixed_milestones") {
    return "Milestone";
  }
  return getRecurrenceIntervalLabel(goal.recurrence_interval);
}
