import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";
import { normalizePlannerLocalTime } from "@/lib/planner/schedule-time";
import type { PlannerCalendarTask } from "@/lib/tasks/calendar-tasks";

export const PLANNER_TASK_ENTRY_KIND = "task" as const;

export function plannerTaskCalendarEntryKey(taskId: string) {
  return `task:${taskId}`;
}

export function isPlannerTaskCalendarEntry(
  entry: Pick<PlannerDayDetailEntry, "entryKind" | "key">
) {
  return (
    entry.entryKind === PLANNER_TASK_ENTRY_KIND ||
    entry.key.startsWith(`${PLANNER_TASK_ENTRY_KIND}:`)
  );
}

export function canOpenPlannerEventDetails(entry: PlannerDayDetailEntry) {
  return !isPlannerTaskCalendarEntry(entry);
}

export function toPlannerTaskCalendarEntry(
  task: PlannerCalendarTask
): PlannerDayDetailEntry {
  const scheduledTime = normalizePlannerLocalTime(task.scheduledTime);
  const completed = Boolean(task.completedAt);
  return {
    key: plannerTaskCalendarEntryKey(task.taskId),
    entryKind: PLANNER_TASK_ENTRY_KIND,
    originalGoalId: task.taskId,
    goalTitle: task.title,
    unitKey: plannerTaskCalendarEntryKey(task.taskId),
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

export function plannerTaskIdFromEntry(entry: PlannerDayDetailEntry) {
  if (!isPlannerTaskCalendarEntry(entry)) {
    return null;
  }
  if (entry.originalGoalId.length > 0) {
    return entry.originalGoalId;
  }
  const prefix = `${PLANNER_TASK_ENTRY_KIND}:`;
  return entry.key.startsWith(prefix) ? entry.key.slice(prefix.length) : null;
}
