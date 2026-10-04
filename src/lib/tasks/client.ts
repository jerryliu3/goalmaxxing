"use client";

import { postJson } from "@/lib/api/client";
import { invalidatePlannerRelatedTabCaches } from "@/lib/cache/planner-tab-cache";
import { requestXpRefresh } from "@/lib/xp/events";
import type { PlannerCalendarTask } from "./calendar-tasks";

async function mutateTask(path: string, body: unknown): Promise<PlannerCalendarTask> {
  const payload = await postJson<{ task?: PlannerCalendarTask }>(path, body);
  if (!payload.task) throw new Error("Could not update the task.");
  invalidatePlannerRelatedTabCaches();
  return payload.task;
}

export function createPlannerTask(title: string, scheduledDate: string) {
  return mutateTask("/api/planner/tasks", { title, scheduledDate });
}

export function editPlannerTask(taskId: string, expectedUpdatedAt: string, fields: {
  scheduledDate: string; title?: string; scheduledTime?: string | null;
}) {
  return mutateTask(`/api/planner/tasks/${taskId}/schedule`, { ...fields, expectedUpdatedAt });
}

export async function completePlannerTask(taskId: string, expectedUpdatedAt: string, completed: boolean) {
  const task = await mutateTask(`/api/planner/tasks/${taskId}/completion`, { completed, expectedUpdatedAt });
  requestXpRefresh({ reason: "completion", desiredFactState: completed ? "present" : "absent" });
  return task;
}
