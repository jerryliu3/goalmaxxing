import { z } from "zod";
import { coachMemoryInputSchema, coachMemorySchema } from "@cadence/shared/coach";
import { ApiRouteError, parseJsonBody } from "@/lib/api/route";
import { coachDatabaseError, withCoachRoute } from "@/lib/coach/api";
import { requireCoachTopic, readCoachRows } from "@/lib/coach/conversations";
export async function GET(request: Request) {
  return withCoachRoute(request,async context => {
    const rows = await readCoachRows(offset => context.admin.from("coach_memories").select("*").eq("owner_id",context.userId).order("id").range(offset,offset+499));
    return { memories:z.array(coachMemorySchema).parse(rows) };
  });
}
export async function POST(request: Request) {
  return withCoachRoute(request,async context => {
    const body = await parseJsonBody({request,schema:coachMemoryInputSchema});
    if (body.topicId) await requireCoachTopic(context,body.topicId);
    if (body.sourceMessageId) {
      const source = await context.admin.from("coach_messages").select("id,role,thread_id").eq("id",body.sourceMessageId).eq("owner_id",context.userId).maybeSingle();
      coachDatabaseError(source.error);
      if (!source.data || source.data.role !== "user") throw new ApiRouteError(404,"message_not_found","The source message is unavailable.");
      if (body.topicId) {
        const thread = await context.admin.from("coach_threads").select("topic_id").eq("id",source.data.thread_id).eq("owner_id",context.userId).single();
        coachDatabaseError(thread.error);
        if (thread.data?.topic_id !== body.topicId) throw new ApiRouteError(400,"memory_scope_invalid","Choose the source conversation's topic or global scope.");
      }
    }
    const result = await context.admin.from("coach_memories").insert({owner_id:context.userId,topic_id:body.topicId,content:body.content,kind:body.kind,source_message_id:body.sourceMessageId ?? null}).select("*").single();
    coachDatabaseError(result.error);
    return { memory:coachMemorySchema.parse(result.data) };
  });
}
