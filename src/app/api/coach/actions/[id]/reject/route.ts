import { ApiRouteError } from "@/lib/api/route";
import { coachDatabaseError, coachParam, withCoachRoute } from "@/lib/coach/api";
export async function POST(request: Request, params: { params: Promise<{ id: string }> }) {
  return withCoachRoute(request, async ({ admin, userId }) => {
    const result = await admin.from("coach_actions").update({ status: "rejected" }).eq("id", await coachParam(params)).eq("owner_id", userId).eq("status", "proposed").select("id").maybeSingle();
    coachDatabaseError(result.error);
    if (!result.data) throw new ApiRouteError(409, "action_not_ready", "This proposal is no longer available.");
    return { rejected: true };
  });
}
