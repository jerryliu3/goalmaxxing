import { format, isValid, parse } from "date-fns";
import { getLinkedGoalRecurrenceLabel as getRecurrenceLabel } from "@/lib/goals/recurrence-labels";
import type { Goal } from "@/lib/goals/types";
import { addDaysToDateString } from "@/lib/goals/periods";

export function formatGoalDateLabel(date: string): string {
  const parsedDate = parse(date, "yyyy-MM-dd", new Date());
  if (!isValid(parsedDate)) {
    return date;
  }
  return format(parsedDate, "MMM d, yyyy");
}

export function getLinkedGoalRecurrenceLabel(
  goal: Pick<Goal, "frequency_type" | "recurrence_interval">
): string {
  return getRecurrenceLabel(goal);
}

export function getLinkedGoalDeadlineLabel(goal: Pick<Goal, "end_date">): string {
  return goal.end_date ? `Due ${formatGoalDateLabel(goal.end_date)}` : "No deadline";
}

export function getLinkedTargetSchedulingNotice({
  sourceEndDate,
}: {
  sourceEndDate: string | null;
}) {
  if (!sourceEndDate) {
    return "Linked main goals stay hidden while this subgoal is still active (it has no end date).";
  }
  return `Linked main goals stay hidden through ${formatGoalDateLabel(sourceEndDate)} and can show from ${formatGoalDateLabel(addDaysToDateString(sourceEndDate, 1))}.`;
}
