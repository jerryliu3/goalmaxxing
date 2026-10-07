import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiRouteError } from "@/lib/api/route";
import type { Completion, Goal } from "@/lib/goals/types";
import type { Database } from "@/lib/supabase/database.types";
import { MAX_COMPLETION_FACTS } from "@/lib/planner/contracts/bounds";
import {
  buildPrivatePublicProfileBundle,
  buildPublicProfileBundle,
  isPrivateForViewer,
  type ProfileRow,
  type UserAwardRow,
} from "./public-profile-model";
import {
  isValidPublicProfileUsername,
  normalizePublicProfileUsername,
} from "./public-profile-username";
import { loadGrowTopPercent } from "./grow-score-rank";

const PAGE_SIZE = 1_000;
const MAX_PROFILE_GOALS = 1_000;

export async function loadGoalsForSubject({
  admin,
  subjectUserId,
}: {
  admin: SupabaseClient<Database>;
  subjectUserId: string;
}): Promise<Goal[]> {
  const goals: Goal[] = [];
  let lastGoalId: string | null = null;

  for (;;) {
    let query = admin
      .from("goals")
      .select("*")
      .eq("owner_id", subjectUserId)
      .eq("is_deleted", false)
      .is("team_id", null)
      .order("id")
      .limit(PAGE_SIZE);
    if (lastGoalId) {
      query = query.gt("id", lastGoalId);
    }
    const response = await query;
    if (response.error) {
      throw new ApiRouteError(
        500,
        "public_profile_load_failed",
        "Public profile data could not be loaded."
      );
    }
    const page = (response.data ?? []) as Goal[];
    goals.push(...page);
    if (goals.length > MAX_PROFILE_GOALS) {
      throw new ApiRouteError(
        413,
        "goal_bound_exceeded",
        "Too many goals are available for one public profile."
      );
    }
    if (page.length < PAGE_SIZE) {
      break;
    }
    lastGoalId = page.at(-1)?.id ?? null;
  }

  return goals;
}

export async function loadCompletionsForSubject({
  admin,
  subjectUserId,
}: {
  admin: SupabaseClient<Database>;
  subjectUserId: string;
}): Promise<Completion[]> {
  const completions: Completion[] = [];
  let lastCompletionId: string | null = null;

  for (;;) {
    let query = admin
      .from("completions")
      .select("*")
      .eq("user_id", subjectUserId)
      .order("id")
      .limit(PAGE_SIZE);
    if (lastCompletionId) {
      query = query.gt("id", lastCompletionId);
    }
    const response = await query;
    if (response.error) {
      throw new ApiRouteError(
        500,
        "public_profile_load_failed",
        "Public profile data could not be loaded."
      );
    }

    const page = (response.data ?? []) as Completion[];
    completions.push(...page);
    if (completions.length > MAX_COMPLETION_FACTS) {
      throw new ApiRouteError(
        413,
        "completion_bound_exceeded",
        "Completion history exceeds the supported public profile bound."
      );
    }
    if (page.length < PAGE_SIZE) {
      break;
    }
    lastCompletionId = page.at(-1)?.id ?? null;
  }

  return completions;
}

async function loadAwardCatalogCount(admin: SupabaseClient<Database>) {
  const response = await admin.from("xp_rewards").select("*", { count: "exact", head: true });
  if (response.error) {
    throw new ApiRouteError(
      500,
      "public_profile_load_failed",
      "Public profile data could not be loaded."
    );
  }
  return response.count ?? 0;
}

const PROFILE_SELECT =
  "id,username,display_name,avatar_url,social_activity_visible,week_starts_on,created_at,timezone";

async function loadMemberNumber(
  admin: SupabaseClient<Database>,
  createdAt: string | null,
) {
  if (!createdAt) {
    return null;
  }
  const response = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .lte("created_at", createdAt);
  if (response.error) {
    return null;
  }
  return response.count && response.count > 0 ? response.count : null;
}

async function loadPublicProfileBundleForProfile({
  admin,
  viewerUserId,
  subjectProfile,
  selectedYear,
}: {
  admin: SupabaseClient<Database>;
  viewerUserId: string | null;
  subjectProfile: ProfileRow;
  selectedYear: number;
}) {
  if (isPrivateForViewer(viewerUserId, subjectProfile)) {
    const memberNumber = await loadMemberNumber(admin, subjectProfile.created_at);
    return buildPrivatePublicProfileBundle(subjectProfile, memberNumber);
  }

  const subjectUserId = subjectProfile.id;
  const [xpResponse, globalAchievementsResponse, goals, completions, awardCatalogCount, memberNumber] =
    await Promise.all([
      admin
        .from("xp_profiles")
        .select("total_xp")
        .eq("user_id", subjectUserId)
        .eq("track_key", "global")
        .maybeSingle(),
      admin
        .from("user_awards")
        .select(
          "id,unlocked_at,revoked_at,xp_rewards!inner(level,reward_code,reward_title,reward_description)"
        )
        .eq("user_id", subjectUserId)
        .order("unlocked_at", { ascending: false }),
      loadGoalsForSubject({ admin, subjectUserId }),
      loadCompletionsForSubject({ admin, subjectUserId }),
      loadAwardCatalogCount(admin),
      loadMemberNumber(admin, subjectProfile.created_at),
    ]);

  if (xpResponse.error || globalAchievementsResponse.error) {
    throw new ApiRouteError(
      500,
      "public_profile_load_failed",
      "Public profile data could not be loaded."
    );
  }

  const bundle = buildPublicProfileBundle({
    viewerUserId,
    subjectProfile,
    globalXpProfile: xpResponse.data,
    globalAchievements: (globalAchievementsResponse.data ?? []) as UserAwardRow[],
    awardCatalogCount,
    goals,
    completions,
    selectedYear,
    memberNumber,
  });
  return {
    ...bundle,
    growTopPercent: await loadGrowTopPercent(admin, subjectUserId, bundle.growSeries.at(-1)?.score),
  };
}

export async function loadPublicProfileBundle({
  admin,
  viewerUserId,
  subjectUserId,
  selectedYear,
}: {
  admin: SupabaseClient<Database>;
  viewerUserId: string;
  subjectUserId: string;
  selectedYear: number;
}) {
  const profileResponse = await admin
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", subjectUserId)
    .maybeSingle();

  if (profileResponse.error) {
    throw new ApiRouteError(
      500,
      "public_profile_load_failed",
      "Public profile data could not be loaded."
    );
  }
  if (!profileResponse.data) {
    throw new ApiRouteError(404, "profile_not_found", "Profile was not found.");
  }

  return loadPublicProfileBundleForProfile({
    admin,
    viewerUserId,
    subjectProfile: profileResponse.data,
    selectedYear,
  });
}

export async function loadPublicProfileBundleByUsername({
  admin,
  username,
  viewerUserId,
  selectedYear,
}: {
  admin: SupabaseClient<Database>;
  username: string;
  viewerUserId: string | null;
  selectedYear: number;
}) {
  const normalizedUsername = normalizePublicProfileUsername(username);
  if (!isValidPublicProfileUsername(normalizedUsername)) {
    throw new ApiRouteError(404, "profile_not_found", "Profile was not found.");
  }

  const profileResponse = await admin
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("username", normalizedUsername)
    .maybeSingle();

  if (profileResponse.error) {
    throw new ApiRouteError(
      500,
      "public_profile_load_failed",
      "Public profile data could not be loaded."
    );
  }
  if (!profileResponse.data) {
    throw new ApiRouteError(404, "profile_not_found", "Profile was not found.");
  }

  return loadPublicProfileBundleForProfile({
    admin,
    viewerUserId,
    subjectProfile: profileResponse.data,
    selectedYear,
  });
}
