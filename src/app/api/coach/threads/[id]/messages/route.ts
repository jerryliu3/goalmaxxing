import { z } from "zod";
import { ApiRouteError } from "@/lib/api/route";
import { coachParam, withCoachRoute } from "@/lib/coach/api";
import { loadCoachMessages } from "@/lib/coach/conversations";
export async function GET(request: Request, params: { params: Promise<{ id: string }> }) {
  return withCoachRoute(request, async context => {
    const raw = new URL(request.url).searchParams.get("before");
    const before = z.coerce.number().int().positive().optional().safeParse(raw ?? undefined);
    if (!before.success) throw new ApiRouteError(400,"validation_failed","Invalid message cursor.");
    return loadCoachMessages(context,await coachParam(params),before.data);
  });
}
