import { NextResponse } from "next/server";
import { getDateInTimezone } from "@/lib/dates/timezone";
import {
  applyPlannerGoalDateFact,
  applyPlannerItemDateFact,
  mapCompletionRpcError,
  targetedExactDateRequestSchema,
} from "@/lib/planner/exact-date-dispatch";
import {
  loadPlannerProfileTimezone,
  parseBoundedJsonBody,
  PlannerRouteError,
  requirePlannerRouteContext,
  withPlannerRoute,
} from "@/lib/planner/api";
import { previewQueuedXpDeltaThenDrain } from "@/lib/xp/outbox";
import { PLANNER_GOAL_SELECT } from "@/lib/planner/context-loader";
import { plannerGoalSchema } from "@/lib/planner/contracts/kernel-schema";
import {
  tryAtomicPlannerMoveCompletion,
  uncompletePlannerCompletion,
} from "@/lib/planner/atomic-completion";
import { prepareCompletionFeedback } from "@/lib/goals/completion-feedback-server";
import type { CompletionFeedback } from "@/lib/goals/completion-feedback";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 16 * 1024;

function completionSuccessResponse(
  payload: Record<string, unknown>,
  xpDelta: number,
  correlationId: string,
  feedback?: CompletionFeedback,
) {
  return NextResponse.json(
    {
      schemaVersion: "1",
      ...payload,
      xpDelta,
      correlationId,
      feedback,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function handleCompletionPost(request: Request) {
  return withPlannerRoute(async ({ correlationId }) => {
    const routeContext = await requirePlannerRouteContext(request);
    const {
      goalId,
      date,
      desiredFactState,
      plannerItemExpectation,
      plannerGoalExpectation,
    } = await parseBoundedJsonBody(
      request,
      MAX_REQUEST_BYTES,
      targetedExactDateRequestSchema
    );
    const [timezone, goalResult, profileResult] = await Promise.all([
      loadPlannerProfileTimezone({
        supabase: routeContext.supabase,
        userId: routeContext.userId,
      }),
      routeContext.supabase
        .from("goals")
        .select(PLANNER_GOAL_SELECT)
        .eq("id", goalId)
        .maybeSingle(),
      routeContext.supabase
        .from("profiles")
        .select("week_starts_on")
        .eq("id", routeContext.userId)
        .maybeSingle(),
    ]);
    const { data: rawGoal, error: goalError } = goalResult;

    if (goalError || !rawGoal) {
      throw new PlannerRouteError(
        404,
        "targeted_goal_not_found",
        "The goal was not found."
      );
    }
    const goal = plannerGoalSchema.parse(rawGoal);

    const readFeedback = desiredFactState === "present"
      ? await prepareCompletionFeedback(routeContext.supabase, routeContext.userId, goalId, getDateInTimezone(new Date(), timezone))
      : null;

    if (plannerItemExpectation) {
      const result = await applyPlannerItemDateFact({
        supabase: routeContext.supabase,
        goalId,
        desiredFactState,
        timezone,
        goalLifetime: {
          startDate: goal.start_date,
          endDate: goal.end_date,
        },
        expectation: plannerItemExpectation,
      });
      if (!result.ok) {
        throw new PlannerRouteError(result.status, result.code, result.message);
      }
      const xpDelta = await previewQueuedXpDeltaThenDrain(routeContext.supabase);
      return completionSuccessResponse(result.payload, xpDelta, correlationId, await readFeedback?.(result.payload.date));
    }

    if (desiredFactState === "present") {
      const localToday = getDateInTimezone(new Date(), timezone);
      if (date > localToday) {
        throw new PlannerRouteError(
          422,
          "future_completion_not_allowed",
          "Completions can only be added for today or a past date."
        );
      }
      if (
        date < goal.start_date ||
        (goal.end_date !== null && date > goal.end_date)
      ) {
        throw new PlannerRouteError(
          422,
          "completion_outside_goal_lifetime",
          "The completion date must be within the goal lifetime."
        );
      }

      let expectedDigest = plannerGoalExpectation?.expectedDigest ?? null;
      if (!expectedDigest) {
        const digestResponse = await routeContext.supabase.rpc(
          "get_planner_schedule_digest",
          {}
        );
        if (digestResponse.error || !digestResponse.data) {
          throw new PlannerRouteError(
            503,
            "planner_digest_load_failed",
            "Planner state could not be loaded."
          );
        }
        expectedDigest = digestResponse.data;
      }

      try {
        const atomic = await tryAtomicPlannerMoveCompletion({
          supabase: routeContext.supabase,
          userId: routeContext.userId,
          goal,
          date,
          asOfDate: localToday,
          expectedDigest,
          weekStartsOn: profileResult.data?.week_starts_on ?? undefined,
        });
        if (atomic.moved) {
          const xpDelta = await previewQueuedXpDeltaThenDrain(
            routeContext.supabase
          );
          return completionSuccessResponse(
            {
              goalId,
              date,
              factState: desiredFactState,
              plannerMove: {
                unitKey: atomic.unitKey,
                movedFrom: atomic.movedFrom,
                movedTo: atomic.movedTo,
              },
              scheduleDigest: atomic.scheduleDigest,
            },
            xpDelta,
            correlationId,
            await readFeedback?.(date),
          );
        }
      } catch (error) {
        const mapped = mapCompletionRpcError(
          error && typeof error === "object"
            ? (error as { code?: string | null; message?: string | null })
            : null
        );
        if (mapped) {
          throw new PlannerRouteError(mapped.status, mapped.code, mapped.message);
        }
        throw new PlannerRouteError(
          409,
          "planner_completion_move_failed",
          "The planner session could not be moved and completed."
        );
      }
    }

    if (plannerGoalExpectation) {
      const result = await applyPlannerGoalDateFact({
        supabase: routeContext.supabase,
        goalId,
        date,
        desiredFactState,
        timezone,
        goalLifetime: {
          startDate: goal.start_date,
          endDate: goal.end_date,
        },
        expectation: plannerGoalExpectation,
      });
      if (!result.ok) {
        throw new PlannerRouteError(result.status, result.code, result.message);
      }
      const xpDelta = await previewQueuedXpDeltaThenDrain(routeContext.supabase);
      return completionSuccessResponse(result.payload, xpDelta, correlationId, await readFeedback?.(result.payload.date));
    }

    if (desiredFactState === "absent") {
      const digestResponse = await routeContext.supabase.rpc(
        "get_planner_schedule_digest",
        {}
      );
      if (digestResponse.error || !digestResponse.data) {
        throw new PlannerRouteError(
          503,
          "planner_digest_load_failed",
          "Planner state could not be loaded."
        );
      }
      try {
        const undo = await uncompletePlannerCompletion({
          supabase: routeContext.supabase,
          goalId,
          date,
          expectedDigest: digestResponse.data,
        });
        const xpDelta = await previewQueuedXpDeltaThenDrain(
          routeContext.supabase
        );
        return completionSuccessResponse(
          {
            goalId,
            date,
            factState: desiredFactState,
            plannerMove: undo.unitKey
              ? {
                  unitKey: undo.unitKey,
                  movedFrom: undo.restoredFrom,
                  movedTo: undo.restoredTo,
                }
              : null,
            scheduleDigest: undo.scheduleDigest,
          },
          xpDelta,
          correlationId
        );
      } catch (error) {
        const mapped = mapCompletionRpcError(
          error && typeof error === "object"
            ? (error as { code?: string | null; message?: string | null })
            : null
        );
        if (mapped) {
          throw new PlannerRouteError(mapped.status, mapped.code, mapped.message);
        }
        throw new PlannerRouteError(
          409,
          "planner_uncompletion_failed",
          "The completion could not be removed."
        );
      }
    }

    const { error: mutationError } = await routeContext.supabase.rpc(
      "mark_goal_complete",
      {
        p_goal_id: goalId,
        p_date: date,
      }
    );

    if (mutationError) {
      const mapped = mapCompletionRpcError(mutationError);
      if (mapped) {
        throw new PlannerRouteError(mapped.status, mapped.code, mapped.message);
      }
      throw new PlannerRouteError(
        409,
        "completion_update_failed",
        "The completion could not be updated."
      );
    }

    const xpDelta = await previewQueuedXpDeltaThenDrain(routeContext.supabase);
    return completionSuccessResponse(
      {
        goalId,
        date,
        factState: desiredFactState,
      },
      xpDelta,
      correlationId,
      await readFeedback?.(date),
    );
  });
}

export async function POST(request: Request) {
  return handleCompletionPost(request);
}
