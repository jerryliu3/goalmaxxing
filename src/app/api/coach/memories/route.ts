import { z } from "zod";
import { coachMemoryInputSchema, coachMemorySchema } from "@cadence/shared/coach";
import { parseJsonBody } from "@/lib/api/route";
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
    const result = await context.admin.from("coach_memories").insert({owner_id:context.userId,topic_id:body.topicId,content:body.content,kind:body.kind}).select("*").single();
    coachDatabaseError(result.error);
    return { memory:coachMemorySchema.parse(result.data) };
  });
}
