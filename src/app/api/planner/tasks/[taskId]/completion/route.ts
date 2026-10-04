import { z } from "zod";
import {
  ApiRouteError,
  apiSuccessResponse,
  parseJsonBody,
  requireAuthenticatedRequestContext,
  withRoute,
} from "@/lib/api/route";
import {
  postgresErrorMatches,
  normalizePostgresErrorMessage,
} from "@/lib/planner/postgres-errors";
import {
  CALENDAR_TASKS_SCHEMA_VERSION,
  mapPlannerCalendarTaskRows,
  plannerTaskCompletionRequestSchema,
} from "@/lib/tasks/calendar-tasks";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 8 * 1024;
const routeParamsSchema = z
  .object({
    taskId: z.uuid(),
  })
  .strict();

function isPlannerTaskNotFound(error: { code?: string | null; message?: string | null }) {
  return (
    postgresErrorMatches(error, "P0001", "planner_task_not_found") ||
    normalizePostgresErrorMessage(error) === "planner_task_not_found"
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ taskId: string }> | { taskId: string } }
) {
  return withRoute(async ({ correlationId }) => {
    const { supabase } = await requireAuthenticatedRequestContext(request, {
      unauthorizedMessage: "Sign in to update calendar tasks.",
    });
    const params = routeParamsSchema.safeParse(await context.params);
    if (!params.success) {
      throw new ApiRouteError(
        400,
        "validation_failed",
        "Request payload failed validation.",
        { issues: params.error.issues }
      );
    }
    const body = await parseJsonBody({
      request,
      schema: plannerTaskCompletionRequestSchema,
      maxBytes: MAX_REQUEST_BYTES,
    });

    const { data, error } = await supabase.rpc("set_planner_task_completion", {
      p_task_id: params.data.taskId,
      p_completed: body.completed,
      p_expected_updated_at: body.expectedUpdatedAt,
    });

    if (error) {
      if (error.message === "task_stale") throw new ApiRouteError(409, "task_stale", "This task changed. Refresh before editing it.");
      if (isPlannerTaskNotFound(error)) {
        throw new ApiRouteError(
          404,
          "planner_task_not_found",
          "The task was not found."
        );
      }
      throw new ApiRouteError(
        500,
        "planner_task_completion_failed",
        "Could not update the task.",
        undefined,
        error
      );
    }

    const [task] = mapPlannerCalendarTaskRows(data);
    if (!task) {
      throw new ApiRouteError(
        404,
        "planner_task_not_found",
        "The task was not found."
      );
    }

    return apiSuccessResponse(
      {
        schemaVersion: CALENDAR_TASKS_SCHEMA_VERSION,
        task,
      },
      correlationId
    );
  });
}
