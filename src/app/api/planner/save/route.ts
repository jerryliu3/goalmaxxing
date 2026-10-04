import { publishSchema } from "@/lib/planner/contracts/requests";
import { NextResponse } from "next/server";
import { parseBoundedJsonBody, requirePlannerRouteContext, withPlannerRoute } from "@/lib/planner/api";
import { MAX_API_BODY_BYTES } from "@/lib/planner/contracts/bounds";
import { plannerSaveRequestSchema, savePlannerSchedule } from "@/lib/planner/save-service";

export const runtime = "nodejs";

interface PlannerSaveScheduledItem {
  goal_id: string;
  unit_key: string;
  scheduled_date: string;
  original_scheduled_date: string;
  scheduled_time: string | null;
  locked: boolean;
}

function buildScheduleConflictPayloadDiagnostics(
  scheduledItems: PlannerSaveScheduledItem[]
) {
  const goalIds = new Set<string>();
  const goalDateKeySet = new Set<string>();
  const goalUnitKeySet = new Set<string>();
  const unitKeysByGoalDate = new Map<string, Set<string>>();
  const datesByGoalUnit = new Map<string, Set<string>>();

  for (const item of scheduledItems) {
    goalIds.add(item.goal_id);
    const goalDateKey = `${item.goal_id}:${item.scheduled_date}`;
    const goalUnitKey = `${item.goal_id}:${item.unit_key}`;
    goalDateKeySet.add(goalDateKey);
    goalUnitKeySet.add(goalUnitKey);
    const unitKeys = unitKeysByGoalDate.get(goalDateKey) ?? new Set<string>();
    unitKeys.add(item.unit_key);
    unitKeysByGoalDate.set(goalDateKey, unitKeys);
    const scheduledDates = datesByGoalUnit.get(goalUnitKey) ?? new Set<string>();
    scheduledDates.add(item.scheduled_date);
    datesByGoalUnit.set(goalUnitKey, scheduledDates);
  }

  const duplicateGoalDateEntries = Array.from(unitKeysByGoalDate.entries())
    .filter(([, unitKeys]) => unitKeys.size > 1)
    .map(([goalDateKey, unitKeys]) => {
      const separatorIndex = goalDateKey.lastIndexOf(":");
      return {
        goalId: goalDateKey.slice(0, separatorIndex),
        scheduledDate: goalDateKey.slice(separatorIndex + 1),
        unitKeys: Array.from(unitKeys).sort(),
      };
    });

  const duplicateGoalUnitEntries = Array.from(datesByGoalUnit.entries())
    .filter(([, scheduledDates]) => scheduledDates.size > 1)
    .map(([goalUnitKey, scheduledDates]) => {
      const separatorIndex = goalUnitKey.lastIndexOf(":");
      return {
        goalId: goalUnitKey.slice(0, separatorIndex),
        unitKey: goalUnitKey.slice(separatorIndex + 1),
        scheduledDates: Array.from(scheduledDates).sort(),
      };
    });

  return {
    goalIds: Array.from(goalIds),
    goalDateKeySet,
    goalUnitKeySet,
    duplicateGoalDateEntries,
    duplicateGoalUnitEntries,
  };
}

async function buildScheduleConflictDiagnostics({
  ownerId,
  scheduledItems,
  databaseError,
}: {
  ownerId: string;
  scheduledItems: PlannerSaveScheduledItem[];
  databaseError: {
    code?: string;
    message: string;
    details?: string;
    hint?: string;
  };
}) {
  const payloadDiagnostics =
    buildScheduleConflictPayloadDiagnostics(scheduledItems);
  let adminLookupError: string | null = null;
  const ownerMismatchConflicts: Array<{
    goalId: string;
    unitKey: string;
    scheduledDate: string;
  }> = [];

  if (payloadDiagnostics.goalIds.length > 0) {
    try {
      const admin = requirePlannerAdminClient();
      const adminResponse = await admin
        .from("planner_items")
        .select("owner_id,goal_id,unit_key,scheduled_date")
        .in("goal_id", payloadDiagnostics.goalIds);
      if (adminResponse.error) {
        adminLookupError = adminResponse.error.message;
      } else {
        for (const row of adminResponse.data ?? []) {
          if (row.owner_id === ownerId) {
            continue;
          }
          const goalDateKey = `${row.goal_id}:${row.scheduled_date}`;
          const goalUnitKey = `${row.goal_id}:${row.unit_key}`;
          if (
            !payloadDiagnostics.goalDateKeySet.has(goalDateKey) &&
            !payloadDiagnostics.goalUnitKeySet.has(goalUnitKey)
          ) {
            continue;
          }
          ownerMismatchConflicts.push({
            goalId: row.goal_id,
            unitKey: row.unit_key,
            scheduledDate: row.scheduled_date,
          });
        }
      }
    } catch (error) {
      adminLookupError =
        error instanceof Error ? error.message : "admin_lookup_failed";
    }
  }

  const ownerMismatchSampleLimit = 10;
  return {
    cause: "schedule_conflict",
    databaseErrorCode: databaseError.code ?? null,
    databaseErrorMessage: databaseError.message,
    databaseErrorDetails: databaseError.details ?? null,
    databaseErrorHint: databaseError.hint ?? null,
    submittedItemCount: scheduledItems.length,
    duplicateGoalDateEntries: payloadDiagnostics.duplicateGoalDateEntries,
    duplicateGoalUnitEntries: payloadDiagnostics.duplicateGoalUnitEntries,
    ownerMismatchConflictCount: ownerMismatchConflicts.length,
    ownerMismatchConflictSample: ownerMismatchConflicts.slice(
      0,
      ownerMismatchSampleLimit
    ),
    ownerMismatchConflictSampleTruncated:
      ownerMismatchConflicts.length > ownerMismatchSampleLimit,
    ...(adminLookupError ? { adminLookupError } : {}),
  };
}

function plannerKernelErrorToRouteError(error: PlannerError) {
  if (error.httpStatus === 413) {
    return new PlannerRouteError(413, "plan_too_large", error.message, error.details);
  }
  if (error.httpStatus === 400) {
    return new PlannerRouteError(400, "validation_failed", error.message, error.details);
  }
  return new PlannerRouteError(
    error.httpStatus,
    error.code,
    error.message,
    error.details
  );
}

export async function handlePlannerSave(request: Request) {
  return withPlannerRoute(async ({ correlationId }) => {
    const context = await requirePlannerRouteContext(request);
    const body = await parseBoundedJsonBody(request, Math.min(MAX_API_BODY_BYTES, 256 * 1024), plannerSaveRequestSchema);
    const result = await savePlannerSchedule(context, body, correlationId);
    return NextResponse.json({ ...result, correlationId }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  });
}

export async function POST(request: Request) {
  return handlePlannerSave(request);
}
