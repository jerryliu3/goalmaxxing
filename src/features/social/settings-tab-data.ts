import type { PlannerPreferencesDraft } from "@/features/settings/planner-preferences-settings";
import { plannerPreferencesFromProfile } from "./profile-preferences";
import { SETTINGS_DATA_CACHE_PREFIX } from "@/lib/cache/planner-tab-cache";
import { loadTabDataCache, readTabDataCache } from "@/lib/cache/tab-data-cache";
import { resolveUserTimezone } from "@/lib/dates/timezone";
import type { Completion, Goal, GoalShare, Profile } from "@/lib/goals/types";
import { createClient } from "@/lib/supabase/client";
import { assertQueriesOk } from "@/lib/supabase/query-error";

export interface SocialState {
  userId: string;
  profile: Profile | null;
  ownGoals: Goal[];
  sharedGoals: Goal[];
  sharedEntries: GoalShare[];
  outgoingShares: GoalShare[];
  sharedOwners: Record<string, Profile>;
  completions: Completion[];
  profileDirectory: Record<string, Profile>;
}

export interface PlannerPreferencesState extends PlannerPreferencesDraft {
  restWeekdays: number[];
  timezoneConfirmed: boolean;
}

export const initialState: SocialState = {
  userId: "",
  profile: null,
  ownGoals: [],
  sharedGoals: [],
  sharedEntries: [],
  outgoingShares: [],
  sharedOwners: {},
  completions: [],
  profileDirectory: {},
};

export const defaultPlannerPreferencesState: PlannerPreferencesState = {
  timezone: resolveUserTimezone(),
  weekStartsOn: 1,
  restWeekdays: [],
  timezoneConfirmed: false,
};

export const SETTINGS_TAB_CACHE_KEY = `${SETTINGS_DATA_CACHE_PREFIX}v1`;

export interface SettingsTabCachePayload {
  state: SocialState;
  authEmail: string;
  profileDraft: {
    username: string;
    display_name: string;
    avatar_url: string;
    social_activity_visible: boolean;
  };
  plannerPreferencesPersisted: PlannerPreferencesState;
  plannerPreferencesDraft: PlannerPreferencesDraft;
}

export function readSettingsTabCache() {
  return readTabDataCache<SettingsTabCachePayload>(SETTINGS_TAB_CACHE_KEY);
}

/** One read path for Profile and background preload, including shared settings. */
export function fetchSettingsTabData({ forceRefresh = false } = {}) {
  return loadTabDataCache(SETTINGS_TAB_CACHE_KEY, async (): Promise<SettingsTabCachePayload | null> => {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw new Error("Profile authentication could not be loaded.");
    if (!user) return null;

    const [profileResponse, ownGoalsResponse, sharesResponse] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("goals").select("*")
        .eq("owner_id", user.id).eq("is_deleted", false)
        .order("created_at", { ascending: false }),
      supabase.from("goal_shares").select("*").eq("shared_with", user.id),
    ]);
    assertQueriesOk(
      [profileResponse, ownGoalsResponse, sharesResponse],
      "Profile settings could not be loaded."
    );
    const profile = (profileResponse.data ?? null) as Profile | null;
    const ownGoals = (ownGoalsResponse.data ?? []) as Goal[];
    const sharedEntries = (sharesResponse.data ?? []) as GoalShare[];
    const nextPlannerPreferences = plannerPreferencesFromProfile(
      profile, defaultPlannerPreferencesState
    );
    const sharedGoalIds = sharedEntries.map(entry => entry.goal_id);
    const ownShareableGoalIds = ownGoals.filter(goal => goal.team_id == null).map(goal => goal.id);

    const [sharedGoalsResponse, outgoingSharesResponse] = await Promise.all([
      sharedGoalIds.length > 0
        ? supabase.from("goals").select("*").in("id", sharedGoalIds).eq("is_deleted", false)
        : Promise.resolve({ data: [], error: null } as const),
      ownShareableGoalIds.length > 0
        ? supabase.from("goal_shares").select("*").in("goal_id", ownShareableGoalIds)
        : Promise.resolve({ data: [], error: null } as const),
    ]);
    assertQueriesOk(
      [sharedGoalsResponse, outgoingSharesResponse],
      "Shared profile settings could not be loaded."
    );
    const sharedGoals = (sharedGoalsResponse.data ?? []) as Goal[];
    const outgoingShares = (outgoingSharesResponse.data ?? []) as GoalShare[];
    const allGoalIds = sharedGoals.map(goal => goal.id);
    const profileIds = Array.from(new Set([
      ...sharedGoals.map(goal => goal.owner_id),
      ...outgoingShares.map(entry => entry.shared_with), user.id,
    ]));
    const [completionsResponse, profileDirectoryResponse] = await Promise.all([
      allGoalIds.length > 0
        ? supabase.from("completions").select("*").in("goal_id", allGoalIds)
        : Promise.resolve({ data: [], error: null } as const),
      supabase.from("profiles").select("*").in("id", profileIds),
    ]);
    assertQueriesOk(
      [completionsResponse, profileDirectoryResponse],
      "Shared profile activity could not be loaded."
    );
    const completions = (completionsResponse.data ?? []) as Completion[];
    const profileById = ((profileDirectoryResponse.data ?? []) as Profile[]).reduce<Record<string, Profile>>(
      (result, item) => {
        result[item.id] = item;
        return result;
      }, {}
    );
    const sharedOwners: Record<string, Profile> = {};
    for (const goal of sharedGoals) {
      const owner = profileById[goal.owner_id];
      if (owner) sharedOwners[goal.id] = owner;
    }

    return {
      state: {
        userId: user.id, profile, ownGoals, sharedGoals, sharedEntries,
        outgoingShares, sharedOwners, completions, profileDirectory: profileById,
      },
      authEmail: user.email ?? "",
      profileDraft: {
        username: profile?.username ?? "",
        display_name: profile?.display_name ?? "",
        avatar_url: profile?.avatar_url ?? "",
        social_activity_visible: profile?.social_activity_visible ?? true,
      },
      plannerPreferencesPersisted: nextPlannerPreferences,
      plannerPreferencesDraft: {
        timezone: nextPlannerPreferences.timezone,
        weekStartsOn: nextPlannerPreferences.weekStartsOn,
      },
    };
  }, { forceRefresh });
}
