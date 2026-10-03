import { coachRunSchema } from "@cadence/shared/coach";
import { ApiRouteError } from "@/lib/api/route";
import { coachDatabaseError, coachParam, withCoachRoute } from "@/lib/coach/api";
export async function GET(request: Request, params: { params: Promise<{ id: string }> }) {
  return withCoachRoute(request, async ({ admin, userId }) => {
    const id = await coachParam(params);
    const expired = await admin.from("coach_runs").update({ status: "failed", error_code: "run_expired", completed_at: new Date().toISOString() }).eq("id", id).eq("owner_id", userId).eq("status", "running").lt("deadline", new Date().toISOString());
    coachDatabaseError(expired.error);
    const result = await admin.from("coach_runs").select("*").eq("id", id).eq("owner_id", userId).maybeSingle();
    coachDatabaseError(result.error);
    if (!result.data) throw new ApiRouteError(404, "run_not_found", "Response not found.");
    return { run: coachRunSchema.parse(result.data) };
  });
}
export async function DELETE(request: Request, params: { params: Promise<{ id: string }> }) {
  return withCoachRoute(request, async ({ admin, userId }) => {
    const result = await admin.from("coach_runs").update({ status: "cancelled", completed_at: new Date().toISOString() }).eq("id", await coachParam(params)).eq("owner_id", userId).eq("status", "running");
    coachDatabaseError(result.error);
    return { cancelled: true };
  });
}
