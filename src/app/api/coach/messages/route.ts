import { z } from "zod";
import { coachMessageSchema } from "@cadence/shared/coach";
import { ApiRouteError } from "@/lib/api/route";
import { coachDatabaseError, withCoachRoute } from "@/lib/coach/api";

const sourcesSchema = z.array(z.uuid()).min(1).max(100);
export async function GET(request: Request) {
  return withCoachRoute(request, async context => {
    const parsed = sourcesSchema.safeParse(new URL(request.url).searchParams.get("ids")?.split(","));
    if (!parsed.success) throw new ApiRouteError(400,"validation_failed","Choose up to 100 source messages.");
    const ids = [...new Set(parsed.data)];
    const result = await context.admin.from("coach_messages").select("*").eq("owner_id",context.userId).in("id",ids).order("created_at");
    coachDatabaseError(result.error);
    if (result.data?.length !== ids.length) throw new ApiRouteError(404,"message_not_found","Some source messages are unavailable.");
    return { messages:z.array(coachMessageSchema).parse(result.data) };
  });
}
