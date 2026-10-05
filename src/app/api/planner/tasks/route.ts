import {
  ApiRouteError,
  apiSuccessResponse,
  parseJsonBody,
  requireAuthenticatedRequestContext,
  withRoute,
} from "@/lib/api/route";
import {
  CALENDAR_TASKS_MAX_ROWS,
  CALENDAR_TASKS_SCHEMA_VERSION,
  calendarTasksQuerySchema,
  mapPlannerCalendarTaskRows,
  plannerTaskCreateRequestSchema,
} from "@/lib/tasks/calendar-tasks";

export const runtime = "nodejs";

function parseCalendarTasksQuery(request: Request) {
  const url = new URL(request.url);
  const parsed = calendarTasksQuerySchema.safeParse({
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  });
  if (!parsed.success) {
    throw new ApiRouteError(
      400,
      "validation_failed",
      "Request payload failed validation.",
      { issues: parsed.error.issues }
    );
  }
  return parsed.data;
}

export async function GET(request: Request) {
  return withRoute(async ({ correlationId }) => {
    const { supabase } = await requireAuthenticatedRequestContext(request, {
      unauthorizedMessage: "Sign in to view calendar tasks.",
    });
    const { from, to } = parseCalendarTasksQuery(request);

    const { data, error } = await supabase
      .from("planner_tasks")
      .select("id, title, scheduled_date, scheduled_time, completed_at, updated_at")
      .eq("is_deleted", false)
      .gte("scheduled_date", from)
      .lte("scheduled_date", to)
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true })
      .limit(CALENDAR_TASKS_MAX_ROWS);

    if (error) {
      throw new ApiRouteError(
        500,
        "calendar_tasks_load_failed",
        "Could not load calendar tasks.",
        undefined,
        error
      );
    }

    return apiSuccessResponse(
      {
        schemaVersion: CALENDAR_TASKS_SCHEMA_VERSION,
        tasks: mapPlannerCalendarTaskRows(data),
      },
      correlationId
    );
  });
}

export async function POST(request: Request) {
  return withRoute(async ({ correlationId }) => {
    const { supabase } = await requireAuthenticatedRequestContext(request, {
      unauthorizedMessage: "Sign in to create tasks.",
    });
    const body = await parseJsonBody({ request, schema: plannerTaskCreateRequestSchema, maxBytes: 8 * 1024 });
    const { data, error } = await supabase.rpc("create_planner_task", {
      p_title: body.title, p_scheduled_date: body.scheduledDate,
    });
    if (error) {
      if (error.message === "task_date_in_past") throw new ApiRouteError(400, "task_date_in_past", "Tasks cannot be created on a past day.");
      throw new ApiRouteError(500, "task_create_failed", "Could not create the task.", undefined, error);
    }
    const [task] = mapPlannerCalendarTaskRows(data);
    if (!task) throw new ApiRouteError(500, "task_create_failed", "Could not create the task.");
    return apiSuccessResponse({ schemaVersion: CALENDAR_TASKS_SCHEMA_VERSION, task }, correlationId);
  });
}
