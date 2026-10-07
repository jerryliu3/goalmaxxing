import { NextResponse } from "next/server";
import {
  parseBoundedJsonBody,
  requirePlannerRouteContext,
  withPlannerRoute,
} from "@/lib/planner/api";
import { recoveryDismissRequestSchema } from "@/lib/planner/recovery/contract";
import { dismissRecoverySessions } from "@/lib/planner/recovery/service";
import { loadRecoveryContext } from "@/lib/planner/recovery/snapshot";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  return withPlannerRoute(async ({ correlationId }) => {
    const context = await requirePlannerRouteContext(request);
    const { recovery } = await loadRecoveryContext({
      supabase: context.supabase,
      userId: context.userId,
    });
    return NextResponse.json({ snapshot: recovery, correlationId }, { headers: NO_STORE });
  });
}

export async function POST(request: Request) {
  return withPlannerRoute(async ({ correlationId }) => {
    const context = await requirePlannerRouteContext(request);
    const body = await parseBoundedJsonBody(request, 64 * 1024, recoveryDismissRequestSchema);
    const snapshot = await dismissRecoverySessions(context, body);
    return NextResponse.json({ snapshot, correlationId }, { headers: NO_STORE });
  });
}
