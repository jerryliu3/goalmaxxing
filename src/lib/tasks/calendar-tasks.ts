import { z } from "zod";
import { MAX_PLANNER_WINDOW_DAYS } from "@/lib/planner/contracts/bounds";
import { countDateWindowDays } from "@/lib/planner/dates";

export const CALENDAR_TASKS_SCHEMA_VERSION = "1" as const;
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
    ({ from, to }) =>
      countDateWindowDays({ start: from, end: to }) <= MAX_PLANNER_WINDOW_DAYS,
    {
      message: `Date windows must contain at most ${MAX_PLANNER_WINDOW_DAYS} inclusive dates.`,
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
}

function mapPlannerCalendarTask(
  row: z.infer<typeof plannerCalendarTaskRowSchema>
): PlannerCalendarTask | null {
  const taskId = row.task_id ?? row.id;
  if (!taskId) {
    return null;
  }
  return {
    taskId,
    title: row.title,
    scheduledDate: row.scheduled_date,
    scheduledTime: row.scheduled_time ?? null,
    completedAt: row.completed_at ?? null,
  };
}

export function mapPlannerCalendarTaskRows(rows: unknown): PlannerCalendarTask[] {
  if (!Array.isArray(rows)) {
    return [];
  }
  const tasks: PlannerCalendarTask[] = [];
  for (const row of rows) {
    const parsed = plannerCalendarTaskRowSchema.safeParse(row);
    if (!parsed.success) {
      continue;
    }
    const mapped = mapPlannerCalendarTask(parsed.data);
    if (mapped) {
      tasks.push(mapped);
    }
  }
  return tasks;
}
