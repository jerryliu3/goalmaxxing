import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";
import { normalizePlannerLocalTime } from "@/lib/planner/schedule-time";
import type { PlannerCalendarTask } from "@/lib/tasks/calendar-tasks";

export const PLANNER_TASK_ENTRY_KIND = "task" as const;

export function plannerTaskCalendarEntryKey(taskId: string) {
  return `task:${taskId}`;
}

export function isPlannerTaskCalendarEntry(
  entry: Pick<PlannerDayDetailEntry, "entryKind">
) {
  return entry.entryKind === PLANNER_TASK_ENTRY_KIND;
}

export function canOpenPlannerEventDetails(entry: PlannerDayDetailEntry) {
  return !isPlannerTaskCalendarEntry(entry);
}

export function plannerTaskIdFromEntry(entry: PlannerDayDetailEntry) {
  return isPlannerTaskCalendarEntry(entry) ? entry.originalGoalId : null;
}

export function toPlannerTaskCalendarEntry(
  task: PlannerCalendarTask
): PlannerDayDetailEntry {
  const scheduledTime = normalizePlannerLocalTime(task.scheduledTime);
  const completed = Boolean(task.completedAt);
  const key = plannerTaskCalendarEntryKey(task.taskId);
  return {
    key,
    entryKind: PLANNER_TASK_ENTRY_KIND,
    originalGoalId: task.taskId,
    goalTitle: task.title,
    unitKey: key,
    label: null,
    classification: PLANNER_TASK_ENTRY_KIND,
    creditState: completed ? "credited" : "uncredited",
    activeGoal: null,
    activeItem: null,
    draftDiffKind: null,
    draftDiffFromDate: null,
    draftDiffToDate: null,
    draftGhost: false,
    goalDefaultLocalTime: scheduledTime,
    scheduledTimeOverride: scheduledTime,
    effectiveScheduledLocalTime: scheduledTime,
  };
}

export function buildCalendarTaskEntriesByDate(
  tasks: readonly PlannerCalendarTask[]
) {
  const byDate = new Map<string, PlannerDayDetailEntry[]>();
  for (const task of tasks) {
    const entry = toPlannerTaskCalendarEntry(task);
    const existing = byDate.get(task.scheduledDate);
    if (existing) {
      existing.push(entry);
    } else {
      byDate.set(task.scheduledDate, [entry]);
    }
  }
  return byDate;
}
