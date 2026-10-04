"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage, getJson } from "@/lib/api/client";
import { usePlannerTabCacheInvalidation } from "@/lib/cache/use-planner-tab-cache-invalidation";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";
import { completePlannerTask, editPlannerTask } from "@/lib/tasks/client";
import type { PlannerCalendarTask } from "@/lib/tasks/calendar-tasks";
import { buildCalendarTaskEntriesByDate } from "@/features/planner/calendar-task-entries";

const EMPTY_TASK_ENTRIES_BY_DATE = new Map<string, PlannerDayDetailEntry[]>();

interface CalendarPlannerTasksResponse {
  tasks?: PlannerCalendarTask[];
}

async function fetchCalendarTasks(from: string, to: string) {
  const payload = await getJson<CalendarPlannerTasksResponse>("/api/planner/tasks", {
    query: { from, to },
  });
  return payload.tasks ?? [];
}

export function useCalendarPlannerTasks({
  enabled,
  from,
  to,
}: {
  enabled: boolean;
  from: string | null;
  to: string | null;
}) {
  const [tasks, setTasks] = useState<PlannerCalendarTask[]>([]);

  useEffect(() => {
    if (!enabled || !from || !to) {
      return;
    }

    let cancelled = false;
    void fetchCalendarTasks(from, to)
      .then((nextTasks) => {
        if (!cancelled) {
          setTasks(nextTasks);
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        toast.error(getApiErrorMessage(error, "Could not load calendar tasks."));
        setTasks([]);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, from, to]);

  usePlannerTabCacheInvalidation(() => {
    if (!enabled || !from || !to) {
      return;
    }
    void fetchCalendarTasks(from, to)
      .then(setTasks)
      .catch(() => {
        // Keep the last successful snapshot on background refresh failures.
      });
  });

  const applyTaskUpdate = useCallback((task: PlannerCalendarTask) => {
    setTasks((current) => {
      const index = current.findIndex((row) => row.taskId === task.taskId);
      if (index < 0) {
        return [...current, task];
      }
      const next = current.slice();
      next[index] = task;
      return next;
    });
  }, []);

  const completeTask = useCallback(async (taskId: string, completed: boolean) => {
    const task = tasks.find(task => task.taskId === taskId);
    if (!task) throw new Error("The task was not found.");
    const updated = await completePlannerTask(taskId, task.updatedAt, completed);
    applyTaskUpdate(updated);
    return updated;
  }, [applyTaskUpdate, tasks]);

  const rescheduleTask = useCallback(async (taskId: string, scheduledDate: string) => {
    const task = tasks.find(task => task.taskId === taskId);
    if (!task) throw new Error("The task was not found.");
    const updated = await editPlannerTask(taskId, task.updatedAt, { scheduledDate });
    applyTaskUpdate(updated);
    return updated;
  }, [applyTaskUpdate, tasks]);

  const taskEntriesByDate = useMemo(() => {
    if (!enabled || !from || !to) {
      return EMPTY_TASK_ENTRIES_BY_DATE;
    }
    return buildCalendarTaskEntriesByDate(tasks);
  }, [enabled, from, tasks, to]);

  return { taskEntriesByDate, completeTask, rescheduleTask };
}
