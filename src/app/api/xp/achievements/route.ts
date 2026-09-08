import {
  ApiRouteError,
  apiSuccessResponse,
  requireAuthenticatedRequestContext,
  withRoute,
} from "@/lib/api/route";
import { getDateInTimezone, resolveUserTimezone } from "@/lib/dates/timezone";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { buildAchievementsShowcasePayload } from "@/features/achievements/build-showcase";
import type { Completion, Goal } from "@/lib/goals/types";

export const runtime = "nodejs";

const MAX_GOALS = 1_000;
const MAX_COMPLETIONS = 5_000;

export async function GET(request: Request) {
  return withRoute(async ({ correlationId }) => {
    if (!isFeatureEnabled("xpEnabled")) {
      throw new ApiRouteError(503, "xp_disabled", "XP is not enabled.");
    }

    const { userId, supabase } = await requireAuthenticatedRequestContext(request, {
      unauthorizedMessage: "Sign in to view achievements.",
    });

    const profileResponse = await supabase
      .from("profiles")
      .select("timezone")
      .eq("id", userId)
      .maybeSingle();
    if (profileResponse.error) {
      throw new ApiRouteError(
        500,
        "achievements_load_failed",
        "Achievements could not be loaded."
      );
    }
    const timezone = resolveUserTimezone(profileResponse.data?.timezone);
    const asOfDate = getDateInTimezone(new Date(), timezone);

    const [
      goalsResponse,
      completionsResponse,
      globalAchievementsResponse,
      rewardsResponse,
      xpProfileResponse,
    ] = await Promise.all([
      supabase
        .from("goals")
        .select("*")
        .eq("owner_id", userId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(MAX_GOALS + 1),
      supabase
        .from("completions")
        .select("*")
        .eq("user_id", userId)
        .order("completed_on", { ascending: false })
        .order("id", { ascending: false })
        .limit(MAX_COMPLETIONS + 1),
      supabase
        .from("user_awards")
        .select(
          "id,unlocked_at,acknowledged_at,revoked_at,xp_rewards!inner(level,reward_code,reward_title,reward_description)"
        )
        .eq("user_id", userId)
        .order("unlocked_at", { ascending: false }),
      supabase
        .from("xp_rewards")
        .select("id,level,reward_code,reward_title,reward_description")
        .order("level", { ascending: true }),
      supabase
        .from("xp_profiles")
        .select("total_xp")
        .eq("user_id", userId)
        .eq("track_key", "global")
        .maybeSingle(),
    ]);

    if (
      goalsResponse.error ||
      completionsResponse.error ||
      globalAchievementsResponse.error ||
      rewardsResponse.error ||
      xpProfileResponse.error
    ) {
      throw new ApiRouteError(
        500,
        "achievements_load_failed",
        "Achievements could not be loaded."
      );
    }

    const goalRows = (goalsResponse.data ?? []) as Goal[];
    const goalsTruncated = goalRows.length > MAX_GOALS;
    const goals = goalRows.slice(0, MAX_GOALS);

    const completionRows = (completionsResponse.data ?? []) as Completion[];
    const completionsTruncated = completionRows.length > MAX_COMPLETIONS;
    const completions = completionRows.slice(0, MAX_COMPLETIONS);

    const payload = buildAchievementsShowcasePayload({
      goals,
      completions,
      asOfDate,
      totalXp: xpProfileResponse.data?.total_xp ?? 0,
      rewardCatalog: rewardsResponse.data ?? [],
      userAwards: globalAchievementsResponse.data ?? [],
      truncated: {
        goals: goalsTruncated,
        completions: completionsTruncated,
      },
    });

    return apiSuccessResponse(payload, correlationId);
  });
}
