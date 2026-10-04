import { coachParam, withCoachRoute } from "@/lib/coach/api";
import { replaceCoachAction } from "@/lib/coach/action-service";
export async function POST(request: Request, params: { params: Promise<{ id: string }> }) { return withCoachRoute(request, async context => replaceCoachAction(context, await coachParam(params), request, false)); }
