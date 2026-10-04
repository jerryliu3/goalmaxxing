import { withCoachRoute } from "@/lib/coach/api";
import { loadCoachBootstrap } from "@/lib/coach/conversations";
export async function GET(request: Request) { return withCoachRoute(request, loadCoachBootstrap); }
