"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage, getJson, postJson } from "@/lib/api/client";
import { usePlannerTabCacheInvalidation } from "@/lib/cache/use-planner-tab-cache-invalidation";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";
import type { PlannerCalendarTask } from "@/lib/tasks/calendar-tasks";
import { buildCalendarTaskEntriesByDate } from "@/features/planner/calendar-task-entries";

const EMPTY_TASK_ENTRIES_BY_DATE = new Map<string, PlannerDayDetailEntry[]>();

interface CalendarPlannerTasksResponse {
  tasks?: PlannerCalendarTask[];
}

interface CalendarPlannerTaskCompletionResponse {
  task?: PlannerCalendarTask;
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
  const requestVersionRef = useRef(0);

  const loadTasks = useCallback(
    async (options?: { background?: boolean }) => {
      if (!enabled || !from || !to) {
        setTasks([]);
        return;
      }
      const requestVersion = ++requestVersionRef.current;
      try {
        const payload = await getJson<CalendarPlannerTasksResponse>(
          "/api/planner/tasks",
          {
            query: { from, to },
          }
        );
        if (requestVersion !== requestVersionRef.current) {
          return;
        }
        setTasks(payload.tasks ?? []);
      } catch (error) {
        if (requestVersion !== requestVersionRef.current) {
          return;
        }
        if (!options?.background) {
          toast.error(
            getApiErrorMessage(error, "Could not load calendar tasks.")
          );
        }
        setTasks([]);
      }
    },
    [enabled, from, to]
  );

  useEffect(() => {
    void loadTasks();
    return () => {
      requestVersionRef.current += 1;
    };
  }, [loadTasks]);

  usePlannerTabCacheInvalidation(() => {
    if (!enabled) {
      return;
    }
    void loadTasks({ background: true });
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

  const completeTask = useCallback(
    async (taskId: string, completed: boolean) => {
      const payload = await postJson<CalendarPlannerTaskCompletionResponse>(
        `/api/planner/tasks/${taskId}/completion`,
        { completed }
      );
      if (!payload.task) {
        throw new Error("Could not update the task.");
      }
      applyTaskUpdate(payload.task);
      return payload.task;
    },
    [applyTaskUpdate]
  );

  const taskEntriesByDate = useMemo(() => {
    if (!enabled) {
      return EMPTY_TASK_ENTRIES_BY_DATE;
    }
    return buildCalendarTaskEntriesByDate(tasks);
  }, [enabled, tasks]);

  return {
    tasks,
    taskEntriesByDate,
    completeTask,
    reload: loadTasks,
  };
}
