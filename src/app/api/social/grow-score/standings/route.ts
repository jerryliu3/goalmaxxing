import { ApiRouteError, apiSuccessResponse, withRoute } from "@/lib/api/route";
import { getServerEnv } from "@/lib/env";
import { refreshGrowScoreStandings } from "@/lib/social/grow-score-standings";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function refreshStandings(request: Request, correlationId: string) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) {
    throw new ApiRouteError(503, "grow_score_standings_unavailable", "Cron is not configured.");
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    throw new ApiRouteError(401, "cron_auth_invalid", "Unauthorized cron request.");
  }
  try {
    const result = await refreshGrowScoreStandings(createAdminClient());
    return apiSuccessResponse(result, correlationId);
  } catch (error) {
    throw new ApiRouteError(
      500,
      "grow_score_standings_failed",
      "Goal score standings could not be refreshed.",
      undefined,
      error
    );
  }
}

export async function POST(request: Request) {
  return withRoute(async ({ correlationId }) => refreshStandings(request, correlationId));
}
