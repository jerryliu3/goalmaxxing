import { z } from "zod";
import { plannerKernelOutputSchema } from "@/lib/planner/contracts/kernel-schema";
import { plannerPolicySchema } from "@/lib/planner/policy";
import { buildPlannerSaveRequestBody } from "@/lib/planner/save-request";
import { ApiRouteError } from "@/lib/api/route";
import { mapPlannerCalendarTaskRows } from "@/lib/tasks/calendar-tasks";
import type { Json } from "@/lib/supabase/database.types";
import type { ExternalContext } from "./auth";
import { externalResourceUrl } from "./oauth";
import { externalGoalRowSchema, operationSchemas, type GoalDefinition, type OperationName } from "./schemas";
import { getCategorySelectionFromValue, getCategoryValueForWrite } from "@/lib/goals/category";
import { getDateInTimezone, timezoneFromPreferences } from "@/lib/dates/timezone";
import { GET as readPlan, POST as previewPlan } from "@/app/api/planner/context/route";
import { POST as publishPlan } from "@/app/api/planner/save/route";
import { POST as setCompletion } from "@/app/api/completions/route";
import { GET as readProgress } from "@/app/api/progress/context/route";
import { GET as readTasks } from "@/app/api/planner/tasks/route";
import { POST as scheduleTask } from "@/app/api/planner/tasks/[taskId]/schedule/route";
import { POST as completeTask } from "@/app/api/planner/tasks/[taskId]/completion/route";

const goalSelect = Object.keys(externalGoalRowSchema.shape).join(",");
const responseSchema = z.record(z.string(), z.unknown());

function databaseError(error: { code?: string; message?: string }) {
  const message = error.message ?? "";
  if (message === "idempotency_conflict") return new ApiRouteError(409, "idempotency_conflict", "This requestId was already used with different input. Use a new UUID for a new action.");
  if (message === "stale_goal") return new ApiRouteError(409, "stale_goal", "The goal changed. Read it again and review the edit before retrying.");
  if (error.code === "P0002") return new ApiRouteError(404, "goal_not_found", "The goal was not found in your account.");
  if (error.code === "42501") return new ApiRouteError(403, "permission_denied", "This action is not allowed for your account.");
  if (["22023", "23514", "23502", "22P02"].includes(error.code ?? "")) return new ApiRouteError(422, "invalid_goal_definition", "The goal or task does not satisfy account rules. Check its dates, targets, and immutable goal fields.", { reason: message });
  if (["23505", "40001", "55000"].includes(error.code ?? "")) return new ApiRouteError(409, "write_conflict", "Account state changed or conflicts with this edit. Refresh and try again.");
  return new ApiRouteError(503, "account_operation_failed", "The account operation could not be completed.", undefined, error);
}

async function ownedGoal(context: ExternalContext, goalId: string) {
  const { data, error } = await context.supabase.from("goals").select(goalSelect).eq("id", goalId).eq("owner_id", context.userId).eq("is_deleted", false).maybeSingle();
  if (error) throw databaseError(error);
  if (!data) throw new ApiRouteError(404, "goal_not_found", "The goal was not found in your account.");
  return externalGoalRowSchema.parse(data);
}

function goalPayload(goal: GoalDefinition): Json {
  const category = getCategorySelectionFromValue(goal.category);
  const normalizedCategory = getCategoryValueForWrite(category.selection, category.customValue);
  return {
    title: goal.title, description: goal.description, reward_text: goal.rewardText,
    category: normalizedCategory.category, category_key: normalizedCategory.categoryKey, color: goal.color,
    frequency_type: goal.frequencyType, recurrence_interval: goal.recurrenceInterval,
    target_count: goal.targetCount, target_basis: goal.frequencyType === "fixed_milestones" ? "lifetime" : goal.targetBasis,
    milestone_names: goal.milestoneNames, start_date: goal.startDate, end_date: goal.endDate,
    default_local_time: goal.defaultLocalTime, team_id: goal.teamId,
    is_private: goal.teamId ? false : goal.isPrivate, difficulty: goal.difficulty, plaque_target: goal.plaqueTarget,
  };
}

async function mutate(context: ExternalContext, requestId: string, operation: string, payload: Json) {
  const { data, error } = await context.supabase.rpc("external_account_mutation", { p_request_id: requestId, p_operation: operation, p_payload: payload });
  if (error) throw databaseError(error);
  if (operation === "create_task") {
    const [task] = mapPlannerCalendarTaskRows([data]);
    if (!task) throw new ApiRouteError(503, "invalid_task_response", "The created task could not be read.");
    return { task };
  }
  return { goal: externalGoalRowSchema.parse(data) };
}

function delegatedRequest(context: ExternalContext, method: "GET" | "POST", input: unknown) {
  const url = new URL(`${externalResourceUrl("/api/v1")}/canonical`);
  const headers = new Headers({ authorization: `Bearer ${context.token}` });
  if (method === "GET") {
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) if (value !== undefined) url.searchParams.set(key, String(value));
    return new Request(url, { method, headers });
  }
  headers.set("content-type", "application/json");
  return new Request(url, { method, headers, body: JSON.stringify(input) });
}
async function canonicalResult(response: Response) {
  const result = responseSchema.parse(await response.json());
  if (!response.ok) throw new ApiRouteError(response.status, typeof result.code === "string" ? result.code : "account_operation_failed", typeof result.message === "string" ? result.message : "Account operation failed.", { ...(typeof result.details === "object" && result.details !== null ? result.details : {}), upstreamCorrelationId: result.correlationId });
  return result;
}
async function profile(context: ExternalContext) {
  const { data, error } = await context.supabase.from("profiles").select("id,display_name,username,timezone,week_starts_on,rest_weekdays,blackout_ranges").eq("id", context.userId).single();
  if (error) throw databaseError(error);
  return z.object({ id: z.uuid(), display_name: z.string().nullable(), username: z.string().nullable(), timezone: z.string().nullable(), week_starts_on: z.number().nullable(), rest_weekdays: z.array(z.number()).nullable(), blackout_ranges: z.unknown() }).parse(data);
}

// Both transports call this same registry. It deliberately imports only
// deterministic account routes, never coach, parsing, or digest-generation.
export async function executeOperation<N extends OperationName>(context: ExternalContext, name: N, input: unknown): Promise<Record<string, unknown>> {
  const parsed = operationSchemas[name].safeParse(input);
  if (!parsed.success) throw new ApiRouteError(400, "validation_failed", "Operation input failed validation.", { issues: parsed.error.issues });
  // Parsing each discriminant gives TypeScript the concrete contract for its branch.
  switch (name) {
    case "get_account": {
      const account = await profile(context);
      const timezone = timezoneFromPreferences(account.timezone);
      return { account, timezone, today: getDateInTimezone(new Date(), timezone), llmUsage: "host_app" };
    }
    case "list_goals": {
      const args = operationSchemas.list_goals.parse(input);
      let query = context.supabase.from("goals").select(goalSelect).eq("owner_id", context.userId).eq("is_deleted", false).order("id").limit(args.limit + 1);
      if (!args.includeArchived) query = query.is("archived_at", null);
      if (args.after) query = query.gt("id", args.after);
      const { data, error } = await query;
      if (error) throw databaseError(error);
      const goals = z.array(externalGoalRowSchema).parse(data ?? []);
      return { goals: goals.slice(0, args.limit), nextCursor: goals.length > args.limit ? goals[args.limit - 1].id : null };
    }
    case "get_goal": return { goal: await ownedGoal(context, operationSchemas.get_goal.parse(input).goalId) };
    case "create_goal": {
      const args = operationSchemas.create_goal.parse(input);
      return mutate(context, args.requestId, name, goalPayload(args.goal));
    }
    case "update_goal": {
      const args = operationSchemas.update_goal.parse(input);
      return mutate(context, args.requestId, name, { ...(goalPayload(args.goal) as Record<string, Json>), goal_id: args.goalId, expected_updated_at: args.expectedUpdatedAt });
    }
    case "set_goal_archived": {
      const args = operationSchemas.set_goal_archived.parse(input);
      return mutate(context, args.requestId, name, { goal_id: args.goalId, expected_updated_at: args.expectedUpdatedAt, archived: args.archived });
    }
    case "set_goal_link": {
      const args = operationSchemas.set_goal_link.parse(input);
      return mutate(context, args.requestId, name, { goal_id: args.goalId, expected_updated_at: args.expectedUpdatedAt, target_goal_id: args.targetGoalId });
    }
    case "get_progress": {
      const account = await profile(context);
      const timezone = timezoneFromPreferences(account.timezone);
      const args = operationSchemas.get_progress.parse(input);
      return canonicalResult(await readProgress(delegatedRequest(context, "GET", { ...args, timezone, asOfDate: getDateInTimezone(new Date(), timezone) })));
    }
    case "get_plan": return canonicalResult(await readPlan(delegatedRequest(context, "GET", parsed.data)));
    case "preview_plan": {
      const args = operationSchemas.preview_plan.parse(input);
      const result = await canonicalResult(await previewPlan(delegatedRequest(context, "POST", args)));
      const preview = plannerKernelOutputSchema.parse(result.preview);
      const revisions = z.object({ scheduleDigest: z.string().regex(/^[a-f0-9]{64}$/) }).safeParse(result.revisions);
      const publishRequest = args.solveIntent === "stable" && !args.recoverPastPlacements && preview.solver.publishable && revisions.success
        ? buildPlannerSaveRequestBody({
            expectedDigest: revisions.data.scheduleDigest,
            saveWindow: { start: args.startDate, end: args.endDate },
            preview, policy: plannerPolicySchema.parse(result.policy), draftCommands: args.draftCommands,
          })
        : null;
      return { ...result, publishRequest };
    }
    case "publish_plan": return canonicalResult(await publishPlan(delegatedRequest(context, "POST", parsed.data)));
    case "set_completion": {
      const args = operationSchemas.set_completion.parse(input);
      await ownedGoal(context, args.goalId);
      return canonicalResult(await setCompletion(delegatedRequest(context, "POST", args)));
    }
    case "list_tasks": return canonicalResult(await readTasks(delegatedRequest(context, "GET", parsed.data)));
    case "create_task": {
      const args = operationSchemas.create_task.parse(input);
      return mutate(context, args.requestId, name, { title: args.title, scheduled_date: args.scheduledDate, scheduled_time: args.scheduledTime });
    }
    case "set_task_schedule": {
      const { taskId, ...body } = operationSchemas.set_task_schedule.parse(input);
      return canonicalResult(await scheduleTask(delegatedRequest(context, "POST", body), { params: Promise.resolve({ taskId }) }));
    }
    case "set_task_completion": {
      const { taskId, ...body } = operationSchemas.set_task_completion.parse(input);
      return canonicalResult(await completeTask(delegatedRequest(context, "POST", body), { params: Promise.resolve({ taskId }) }));
    }
    default: throw new ApiRouteError(404, "operation_not_found", "This account operation does not exist.");
  }
}
