import { z } from "zod";
import { MAX_PLANNER_WINDOW_DAYS } from "@/lib/planner/contracts/bounds";

export const CALENDAR_TASKS_SCHEMA_VERSION = "1" as const;
export const CALENDAR_TASKS_MAX_WINDOW_DAYS = MAX_PLANNER_WINDOW_DAYS;
export const CALENDAR_TASKS_MAX_ROWS = 2_000;

export const calendarTasksQuerySchema = z
  .object({
    from: z.iso.date(),
    to: z.iso.date(),
  })
  .refine(({ from, to }) => from <= to, {
    message: "from must be on or before to.",
    path: ["to"],
  })
  .refine(
    ({ from, to }) => inclusiveDayCount(from, to) <= CALENDAR_TASKS_MAX_WINDOW_DAYS,
    {
      message: `Date windows must contain at most ${CALENDAR_TASKS_MAX_WINDOW_DAYS} inclusive dates.`,
      path: ["to"],
    }
  );

export const plannerTaskCompletionRequestSchema = z
  .object({
    completed: z.boolean(),
  })
  .strict();

export const plannerCalendarTaskRowSchema = z
  .object({
    id: z.uuid().optional(),
    task_id: z.uuid().optional(),
    title: z.string().trim().min(1).max(200),
    scheduled_date: z.iso.date(),
    scheduled_time: z.string().nullable().optional(),
    completed_at: z.string().nullable().optional(),
    created_at: z.string().min(1),
    updated_at: z.string().min(1),
  })
  .refine((row) => Boolean(row.id ?? row.task_id), {
    message: "task id is required.",
  });

export interface PlannerCalendarTask {
  taskId: string;
  title: string;
  scheduledDate: string;
  scheduledTime: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function inclusiveDayCount(from: string, to: string) {
  const fromMs = Date.parse(`${from}T00:00:00.000Z`);
  const toMs = Date.parse(`${to}T00:00:00.000Z`);
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs < fromMs) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.floor((toMs - fromMs) / 86_400_000) + 1;
}

export function mapPlannerCalendarTask(
  row: z.infer<typeof plannerCalendarTaskRowSchema>
): PlannerCalendarTask {
  return {
    taskId: row.task_id ?? row.id ?? "",
    title: row.title,
    scheduledDate: row.scheduled_date,
    scheduledTime: row.scheduled_time ?? null,
    completedAt: row.completed_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPlannerCalendarTaskRows(rows: unknown[]): PlannerCalendarTask[] {
  const tasks: PlannerCalendarTask[] = [];
  for (const row of rows) {
    const parsed = plannerCalendarTaskRowSchema.safeParse(row);
    if (!parsed.success) {
      continue;
    }
    const mapped = mapPlannerCalendarTask(parsed.data);
    if (mapped.taskId.length === 0) {
      continue;
    }
    tasks.push(mapped);
  }
  return tasks;
}
