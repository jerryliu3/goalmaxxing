import { z } from "zod";
import { coachTopicCreateSchema, coachTopicSchema, coachThreadSchema } from "@cadence/shared/coach";
import { parseJsonBody } from "@/lib/api/route";
import { coachDatabaseError, withCoachRoute } from "@/lib/coach/api";
export async function POST(request: Request) {
  return withCoachRoute(request, async ({ admin, userId }) => {
    const body = await parseJsonBody({ request, schema: coachTopicCreateSchema });
    const result = await admin.rpc("create_coach_topic", { p_owner: userId, p_title: body.title });
    coachDatabaseError(result.error);
    return z.object({topic:coachTopicSchema,thread:coachThreadSchema}).parse(result.data);
  });
}
