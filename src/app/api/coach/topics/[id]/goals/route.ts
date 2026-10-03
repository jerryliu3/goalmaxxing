import { z } from "zod";
import { ApiRouteError, parseJsonBody } from "@/lib/api/route";
import { coachDatabaseError, coachParam, withCoachRoute } from "@/lib/coach/api";
import { requireCoachTopic } from "@/lib/coach/conversations";
export async function GET(request: Request, params: { params: Promise<{ id: string }> }) {
  return withCoachRoute(request, async context => {
    const topic = await requireCoachTopic(context, await coachParam(params));
    const result = await context.admin.from("coach_topic_goals").select("goal_id").eq("topic_id",topic.id).eq("owner_id",context.userId);
    coachDatabaseError(result.error); return { goalIds: result.data?.map(row => row.goal_id) ?? [] };
  });
}
async function mutate(request: Request, params: { params: Promise<{ id: string }> }) {
  return withCoachRoute(request, async context => {
    const topic = await requireCoachTopic(context, await coachParam(params));
    const { goalId } = await parseJsonBody({ request, schema: z.object({ goalId: z.uuid() }).strict() });
    const goal = await context.supabase.from("goals").select("id").eq("id",goalId).eq("owner_id",context.userId).eq("is_deleted",false).maybeSingle();
    coachDatabaseError(goal.error);
    if (!goal.data) throw new ApiRouteError(404,"goal_not_found","This goal is unavailable.");
    const result = request.method === "DELETE" ? await context.admin.from("coach_topic_goals").delete().eq("topic_id",topic.id).eq("owner_id",context.userId).eq("goal_id",goalId) : await context.admin.from("coach_topic_goals").upsert({ topic_id:topic.id,owner_id:context.userId,goal_id:goalId });
    coachDatabaseError(result.error); return { updated:true };
  });
}
export const POST=mutate;
export const DELETE=mutate;
