import { coachTopicCreateSchema, coachThreadSchema } from "@cadence/shared/coach";
import { ApiRouteError, parseJsonBody } from "@/lib/api/route";
import { coachDatabaseError, coachParam, withCoachRoute } from "@/lib/coach/api";
import { requireCoachTopic } from "@/lib/coach/conversations";
export async function POST(request: Request, params: { params: Promise<{ id: string }> }) {
  return withCoachRoute(request, async context => {
    const topic = await requireCoachTopic(context, await coachParam(params));
    if (topic.archived_at) throw new ApiRouteError(409,"topic_archived","Restore this topic first.");
    const body = await parseJsonBody({ request, schema: coachTopicCreateSchema });
    const result = await context.admin.from("coach_threads").insert({ owner_id: context.userId, topic_id: topic.id, title: body.title }).select("*").single();
    coachDatabaseError(result.error);
    return { thread: coachThreadSchema.parse(result.data) };
  });
}
