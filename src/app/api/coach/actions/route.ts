import { coachActionCursorSchema, coachActionHistorySchema } from "@cadence/shared/coach";
import { ApiRouteError } from "@/lib/api/route";
import { coachDatabaseError, withCoachRoute } from "@/lib/coach/api";

export async function GET(request: Request) {
  return withCoachRoute(request, async context => {
    const search = new URL(request.url).searchParams;
    const raw = search.get("before");
    let before;
    if (raw) {
      try { before = coachActionCursorSchema.parse(JSON.parse(raw)); }
      catch { throw new ApiRouteError(400, "validation_failed", "Invalid change-history cursor."); }
    }
    let query = context.admin.from("coach_actions")
      .select("id,owner_id,thread_id,run_id,kind,title,preview,status,result,created_at,applied_at,inverse_of")
      .eq("owner_id", context.userId).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(51);
    if (before) query = query.or(`created_at.lt.${before.createdAt},and(created_at.eq.${before.createdAt},id.lt.${before.id})`);
    const result = await query;
    coachDatabaseError(result.error);
    const actions = (result.data ?? []).slice(0, 50);
    const last = actions.at(-1);
    return coachActionHistorySchema.parse({ actions, next: result.data?.length === 51 && last ? { createdAt: last.created_at, id: last.id } : null });
  });
}
