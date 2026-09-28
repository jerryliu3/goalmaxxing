import { NextResponse } from "next/server";
import { parseBoundedJsonBody, requirePlannerRouteContext, withPlannerRoute } from "@/lib/planner/api";
import { MAX_API_BODY_BYTES } from "@/lib/planner/contracts/bounds";
import { plannerSaveRequestSchema, savePlannerSchedule } from "@/lib/planner/save-service";

export const runtime = "nodejs";

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
