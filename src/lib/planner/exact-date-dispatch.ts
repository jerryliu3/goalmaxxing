import { z } from "zod";
import { getDateInTimezone, isValidIanaTimezone } from "@/lib/dates/timezone";
import type { createClient as createServerClient } from "@/lib/supabase/server";

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/);

export const plannerItemExpectationSchema = z
  .object({
    itemId: z.string().uuid(),
    expectedDigest: digestSchema,
  })
  .strict();

export const plannerGoalExpectationSchema = z
  .object({
    expectedDigest: digestSchema,
  })
  .strict();

export const targetedExactDateRequestSchema = z
  .object({
    goalId: z.uuid(),
    date: z.iso.date(),
    desiredFactState: z.enum(["present", "absent"]),
    timezone: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .refine(isValidIanaTimezone, "Provide a valid IANA timezone.")
      .optional(),
    plannerItemExpectation: plannerItemExpectationSchema.optional(),
    plannerGoalExpectation: plannerGoalExpectationSchema.optional(),
  })
  .strict()
  .refine(
    (value) =>
      !(
        value.plannerItemExpectation !== undefined &&
        value.plannerGoalExpectation !== undefined
      ),
    {
      message: "Only one planner expectation can be supplied per request.",
      path: ["plannerGoalExpectation"],
    }
  );

export type PlannerItemExpectation = z.infer<typeof plannerItemExpectationSchema>;
export type PlannerGoalExpectation = z.infer<typeof plannerGoalExpectationSchema>;

type ServerSupabaseClient = Awaited<ReturnType<typeof createServerClient>>;
type ExactDateClient = Pick<ServerSupabaseClient, "from" | "rpc">;

interface PlannerExactDateDispatchFailure {
  ok: false;
  status: number;
  code: string;
  message: string;
}

interface PlannerExactDateDispatchSuccess {
  ok: true;
  payload: {
    goalId: string;
    date: string;
    factState: "present" | "absent";
  };
}

export type PlannerExactDateDispatchResult =
  | PlannerExactDateDispatchFailure
  | PlannerExactDateDispatchSuccess;

interface GoalLifetimeWindow {
  startDate: string;
  endDate: string | null;
}

function dispatchFailure(
  status: number,
  code: string,
  message: string
): PlannerExactDateDispatchFailure {
  return {
    ok: false,
    status,
    code,
    message,
  };
}

export function mapCompletionRpcError(
  error: { code?: string | null; message?: string | null } | null
): PlannerExactDateDispatchFailure | null {
  if (!error) {
    return null;
  }
  if (error.code === "23514" && error.message === "future_completion_not_allowed") {
    return dispatchFailure(
      422,
      "future_completion_not_allowed",
      "Completions can only be added for today or a past date."
    );
  }
  if (
    error.code === "23514" &&
    error.message === "completion_outside_goal_lifetime"
  ) {
    return dispatchFailure(
      422,
      "completion_outside_goal_lifetime",
      "The completion date must be within the goal lifetime."
    );
  }
  if (error.code === "P0001" && error.message === "stale_schedule") {
    return dispatchFailure(
      409,
      "stale_revision",
      "Planner state changed. Refresh and try again."
    );
  }
  if (error.code === "55000" && error.message === "planner_item_locked") {
    return dispatchFailure(
      409,
      "planner_item_locked",
      "Unlock this session before completing it on another date."
    );
  }
  if (
    error.code === "23505" &&
    error.message === "planner_destination_conflict"
  ) {
    return dispatchFailure(
      409,
      "planner_destination_conflict",
      "That goal already has a planner session on this date."
    );
  }
  if (error.code === "P0002" && error.message === "planner_item_not_found") {
    return dispatchFailure(
      409,
      "planner_item_not_found",
      "That planner session is no longer available. Refresh and try again."
    );
  }
  return null;
}

function dateOutsideGoalLifetime(date: string, goal: GoalLifetimeWindow) {
  return date < goal.startDate || (goal.endDate !== null && date > goal.endDate);
}

async function ensureExpectedDigest({
  supabase,
  expectedDigest,
}: {
  supabase: ExactDateClient;
  expectedDigest: string;
}) {
  const digestResponse = await supabase.rpc("get_planner_schedule_digest", {});
  if (digestResponse.error) {
    return dispatchFailure(
      503,
      "planner_digest_unavailable",
      "Planner completion state could not be loaded."
    );
  }
  const actualDigest =
    typeof digestResponse.data === "string"
      ? digestResponse.data.toLowerCase()
      : null;
  if (!actualDigest || actualDigest !== expectedDigest.toLowerCase()) {
    return dispatchFailure(
      409,
      "stale_revision",
      "Planner completion state is stale. Refresh and try again."
    );
  }
  return null;
}

async function applyDirectCompletionFact({
  supabase,
  goalId,
  date,
  desiredFactState,
}: {
  supabase: ExactDateClient;
  goalId: string;
  date: string;
  desiredFactState: "present" | "absent";
}) {
  const mutationResponse = await supabase.rpc(
    desiredFactState === "present"
      ? "mark_goal_complete"
      : "unmark_goal_complete",
    {
      p_goal_id: goalId,
      p_date: date,
    }
  );
  return mutationResponse.error;
}

export async function applyPlannerItemDateFact({
  supabase,
  goalId,
  desiredFactState,
  timezone,
  goalLifetime,
  expectation,
}: {
  supabase: ExactDateClient;
  goalId: string;
  desiredFactState: "present" | "absent";
  timezone: string;
  goalLifetime: GoalLifetimeWindow;
  expectation: PlannerItemExpectation;
}): Promise<PlannerExactDateDispatchResult> {
  const digestFailure = await ensureExpectedDigest({
    supabase,
    expectedDigest: expectation.expectedDigest,
  });
  if (digestFailure) {
    return digestFailure;
  }

  const itemResponse = await supabase
    .from("planner_items")
    .select("id, goal_id, unit_key, scheduled_date")
    .eq("id", expectation.itemId)
    .maybeSingle();

  if (itemResponse.error) {
    return dispatchFailure(
      503,
      "planner_item_lookup_failed",
      "Planner item state could not be loaded."
    );
  }
  const item = itemResponse.data;
  if (!item || item.goal_id !== goalId) {
    return dispatchFailure(
      404,
      "planner_item_not_found",
      "Planner item was not found in the active plan."
    );
  }

  const itemDate = item.scheduled_date;
  if (desiredFactState === "present") {
    const localToday = getDateInTimezone(new Date(), timezone);
    if (itemDate > localToday) {
      return dispatchFailure(
        422,
        "future_completion_not_allowed",
        "Completions can only be added for today or a past date."
      );
    }
    if (dateOutsideGoalLifetime(itemDate, goalLifetime)) {
      return dispatchFailure(
        422,
        "completion_outside_goal_lifetime",
        "The completion date must be within the goal lifetime."
      );
    }
  }

  const mutationResponse =
    desiredFactState === "present"
      ? await supabase.rpc("complete_planner_item_on_date_service", {
          p_goal_id: goalId,
          p_unit_key: item.unit_key,
          p_date: itemDate,
          p_expected_digest: expectation.expectedDigest,
        })
      : await supabase.rpc("unmark_goal_complete", {
          p_goal_id: goalId,
          p_date: itemDate,
        });
  const mutationError = mutationResponse.error;
  if (mutationError) {
    return (
      mapCompletionRpcError(mutationError) ??
      dispatchFailure(
        409,
        "planner_item_date_fact_failed",
        "Planner item date fact could not be updated."
      )
    );
  }

  return {
    ok: true,
    payload: {
      goalId,
      date: itemDate,
      factState: desiredFactState,
    },
  };
}

export async function applyPlannerGoalDateFact({
  supabase,
  goalId,
  date,
  desiredFactState,
  timezone,
  goalLifetime,
  expectation,
}: {
  supabase: ExactDateClient;
  goalId: string;
  date: string;
  desiredFactState: "present" | "absent";
  timezone: string;
  goalLifetime: GoalLifetimeWindow;
  expectation: PlannerGoalExpectation;
}): Promise<PlannerExactDateDispatchResult> {
  const digestFailure = await ensureExpectedDigest({
    supabase,
    expectedDigest: expectation.expectedDigest,
  });
  if (digestFailure) {
    return digestFailure;
  }
  const localToday = getDateInTimezone(new Date(), timezone);

  if (desiredFactState === "present") {
    if (date > localToday) {
      return dispatchFailure(
        422,
        "future_completion_not_allowed",
        "Completions can only be added for today or a past date."
      );
    }
    if (dateOutsideGoalLifetime(date, goalLifetime)) {
      return dispatchFailure(
        422,
        "completion_outside_goal_lifetime",
        "The completion date must be within the goal lifetime."
      );
    }
  }

  const mutationError = await applyDirectCompletionFact({
    supabase,
    goalId,
    date,
    desiredFactState,
  });
  if (mutationError) {
    return (
      mapCompletionRpcError(mutationError) ??
      dispatchFailure(
        409,
        "planner_goal_date_fact_failed",
        "Planner goal date fact could not be updated."
      )
    );
  }

  return {
    ok: true,
    payload: {
      goalId,
      date,
      factState: desiredFactState,
    },
  };
}
