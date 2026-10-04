import { coachParam, withCoachRoute } from "@/lib/coach/api";
import { manageCoachEntity } from "@/lib/coach/manage";
async function handle(request: Request, params: { params: Promise<{ id: string }> }) {
  return withCoachRoute(request, async context => manageCoachEntity(request,context,"topic",await coachParam(params)));
}
export const PATCH = handle;
export const DELETE = handle;
