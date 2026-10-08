"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getAvatarUrlValidationError,
  normalizeAvatarUrlDraft,
} from "@/features/social/avatar-url";
import { getApiErrorMessage, putJson } from "@/lib/api/client";
import {
  invalidatePlannerRelatedTabCaches,
  PUBLIC_PROFILE_CACHE_PREFIX,
} from "@/lib/cache/planner-tab-cache";
import { usePlannerTabCacheInvalidation } from "@/lib/cache/use-planner-tab-cache-invalidation";
import {
  isTabDataCacheFresh,
  markTabDataCacheStaleByPrefix,
} from "@/lib/cache/tab-data-cache";
import { normalizeWeekStartsOn } from "@/lib/dates/week-start";
import { groupCompletionsByGoalId } from "@/lib/goals/completion-grouping";
import type { GoalShare, Profile } from "@/lib/goals/types";
import { createDefaultPlannerPolicy, type PlannerPolicy } from "@/lib/planner/policy";
import { unsubscribeCurrentBrowser } from "@/lib/push/client";
import { createClient } from "@/lib/supabase/client";
import { useAppRouter } from "@/lib/navigation/use-app-router";
import type { PlannerPreferencesDraft } from "@/features/settings/planner-preferences-settings";
import { buildProfilePreferencesUpdate } from "@/features/social/profile-preferences";
import {
  buildAvatarCleanupPathsForProfileChange,
  deleteProfileAvatar,
  getAvatarUploadValidationError,
  uploadProfileAvatar,
} from "@/lib/profile/avatar-upload";
import {
  defaultPlannerPreferencesState, fetchSettingsTabData, initialState,
  readSettingsTabCache, SETTINGS_TAB_CACHE_KEY,
  type PlannerPreferencesState, type SettingsTabCachePayload, type SocialState,
} from "./settings-tab-data";
export interface ShareMenuPosition {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
}
export function useSocialTabData() {
  const supabase = useMemo(() => createClient(), []);
  const router = useAppRouter();
  // The tab cache lives in sessionStorage, so it is empty on the server and
  // populated on the client. Seeding state from it here would make the first
  // client render disagree with the server HTML and React would throw the whole
  // settings tree away. loadData applies the same cache on mount instead.
  const [state, setState] = useState<SocialState>(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [selectedShareGoalIds, setSelectedShareGoalIds] = useState<string[]>(
    []
  );
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [shareMenuPosition, setShareMenuPosition] = useState<ShareMenuPosition>(
    {
      left: 0,
      width: 0,
      maxHeight: 280,
      top: 0,
    }
  );
  const [sharedMonthCursor, setSharedMonthCursor] = useState(new Date());
  const [profileDraft, setProfileDraft] = useState({
    username: "",
    display_name: "",
    avatar_url: "",
    social_activity_visible: true,
  });
  const [plannerPreferencesLoading, setPlannerPreferencesLoading] = useState(true);
  const [plannerPreferencesPersisted, setPlannerPreferencesPersisted] =
    useState<PlannerPreferencesState>(defaultPlannerPreferencesState);
  const [plannerPreferencesDraft, setPlannerPreferencesDraft] =
    useState<PlannerPreferencesDraft>({
      timezone: defaultPlannerPreferencesState.timezone,
      weekStartsOn: defaultPlannerPreferencesState.weekStartsOn,
    });

  const loadRequestIdRef = useRef(0);
  const loadData = useCallback(async (forceRefresh = false) => {
    const requestId = ++loadRequestIdRef.current;
    const apply = (payload: SettingsTabCachePayload | null) => {
      setState(payload?.state ?? initialState);
      setAuthEmail(payload?.authEmail ?? "");
      setProfileDraft(payload?.profileDraft ?? {
        username: "", display_name: "", avatar_url: "", social_activity_visible: true,
      });
      setPlannerPreferencesPersisted(payload?.plannerPreferencesPersisted ?? defaultPlannerPreferencesState);
      setPlannerPreferencesDraft(payload?.plannerPreferencesDraft ?? {
        timezone: defaultPlannerPreferencesState.timezone,
        weekStartsOn: defaultPlannerPreferencesState.weekStartsOn,
      });
      setPlannerPreferencesLoading(false);
      setLoading(false);
    };
    const cached = readSettingsTabCache();
    if (cached && !forceRefresh) {
      apply(cached);
      if (isTabDataCacheFresh(SETTINGS_TAB_CACHE_KEY)) return;
    }
    try {
      const payload = await fetchSettingsTabData({ forceRefresh });
      if (requestId === loadRequestIdRef.current) apply(payload);
    } catch (error) {
      if (requestId === loadRequestIdRef.current) {
        toast.error(getApiErrorMessage(error, "Profile settings could not be loaded."));
      }
    }
  }, []);

  // Apply browser-only cached content before paint without changing hydration.
  useLayoutEffect(() => {
    void loadData();
    return () => { loadRequestIdRef.current += 1; };
  }, [loadData]);

  usePlannerTabCacheInvalidation(() => {
    void loadData();
  });

  useEffect(() => {
    const searchQuery = searchTerm.trim().toLowerCase();
    if (!searchQuery) {
      return;
    }

    let cancelled = false;
    const run = async () => {
      const { data, error } = await supabase.rpc("find_profile_by_username", {
        p_query: searchQuery,
        p_limit: 8,
      });

      if (error) {
        if (!cancelled) {
          setSearchResults([]);
        }
        return;
      }

      if (!cancelled) {
        setSearchResults((data ?? []) as Profile[]);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [searchTerm, supabase]);

  const visibleSearchResults = searchTerm.trim() ? searchResults : [];
  const shareableGoals = useMemo(
    () => state.ownGoals.filter((goal) => goal.team_id == null),
    [state.ownGoals]
  );
  const shareableGoalIds = useMemo(
    () => new Set(shareableGoals.map((goal) => goal.id)),
    [shareableGoals]
  );
  const activeSelectedShareGoalIds = useMemo(
    () => selectedShareGoalIds.filter((goalId) => shareableGoalIds.has(goalId)),
    [selectedShareGoalIds, shareableGoalIds]
  );
  const shareMenuListMaxHeight = Math.max(120, shareMenuPosition.maxHeight - 44);
  const outgoingSharesByGoal = useMemo(() => {
    const grouped = new Map<string, GoalShare[]>();
    state.outgoingShares.forEach((entry) => {
      const existing = grouped.get(entry.goal_id) ?? [];
      existing.push(entry);
      grouped.set(entry.goal_id, existing);
    });
    return grouped;
  }, [state.outgoingShares]);
  const sharedByMeGoals = useMemo(
    () =>
      shareableGoals.filter(
        (goal) => (outgoingSharesByGoal.get(goal.id)?.length ?? 0) > 0
      ),
    [outgoingSharesByGoal, shareableGoals]
  );
  const completionsByGoal = useMemo(
    () => groupCompletionsByGoalId(state.completions),
    [state.completions]
  );

  const normalizedProfileDraft = useMemo(
    () => ({
      username: profileDraft.username.trim().toLowerCase(),
      display_name: profileDraft.display_name.trim() || null,
      avatar_url: normalizeAvatarUrlDraft(profileDraft.avatar_url),
      social_activity_visible: profileDraft.social_activity_visible,
    }),
    [
      profileDraft.avatar_url,
      profileDraft.display_name,
      profileDraft.social_activity_visible,
      profileDraft.username,
    ]
  );
  const normalizedPersistedProfile = useMemo(
    () => ({
      username: state.profile?.username?.trim().toLowerCase() ?? "",
      display_name: state.profile?.display_name?.trim() || null,
      avatar_url: state.profile?.avatar_url?.trim() || null,
      social_activity_visible: state.profile?.social_activity_visible ?? true,
    }),
    [
      state.profile?.avatar_url,
      state.profile?.display_name,
      state.profile?.social_activity_visible,
      state.profile?.username,
    ]
  );
  const profileDirty =
    normalizedProfileDraft.username !== normalizedPersistedProfile.username ||
    normalizedProfileDraft.display_name !== normalizedPersistedProfile.display_name ||
    normalizedProfileDraft.avatar_url !== normalizedPersistedProfile.avatar_url;
  const socialActivityVisibleDirty =
    normalizedProfileDraft.social_activity_visible !==
    normalizedPersistedProfile.social_activity_visible;
  const plannerPreferencesDirty =
    plannerPreferencesDraft.timezone !== plannerPreferencesPersisted.timezone ||
    normalizeWeekStartsOn(plannerPreferencesDraft.weekStartsOn) !==
      normalizeWeekStartsOn(plannerPreferencesPersisted.weekStartsOn);
  const canSaveProfile = Boolean(state.userId) && profileDirty;
  const canSavePreferences =
    Boolean(state.userId) &&
    !plannerPreferencesLoading &&
    (socialActivityVisibleDirty || plannerPreferencesDirty);

  /** Resolves true once the identity fields are saved (or had nothing to save). */
  const saveProfile = async (): Promise<boolean> => {
    if (!canSaveProfile) {
      return true;
    }
    const avatarValidationError = getAvatarUrlValidationError(
      normalizedProfileDraft.avatar_url
    );
    if (avatarValidationError) {
      toast.error(avatarValidationError);
      return false;
    }
    setSaving(true);
    const payload = {
      id: state.userId,
      username: normalizedProfileDraft.username,
      display_name: normalizedProfileDraft.display_name,
      avatar_url: normalizedProfileDraft.avatar_url,
    };
    const cleanupAvatarPaths = buildAvatarCleanupPathsForProfileChange({
      userId: state.userId,
      previousAvatarUrl: normalizedPersistedProfile.avatar_url,
      nextAvatarUrl: normalizedProfileDraft.avatar_url,
    });

    const { error } = await supabase.from("profiles").upsert(payload, {
      onConflict: "id",
    });
    if (error) {
      toast.error(error.message);
      setSaving(false);
      return false;
    }
    if (cleanupAvatarPaths.length > 0) {
      try {
        await deleteProfileAvatar({
          supabase,
          objectPaths: cleanupAvatarPaths,
        });
      } catch (avatarDeleteError) {
        toast.error(
          getApiErrorMessage(
            avatarDeleteError,
            "Profile saved, but previous avatar file cleanup failed."
          )
        );
      }
    }
    toast.success("Profile saved.");
    markTabDataCacheStaleByPrefix(PUBLIC_PROFILE_CACHE_PREFIX);
    await loadData(true);
    router.refresh();
    setSaving(false);
    return true;
  };

  const uploadProfileAvatarFile = async (file: File) => {
    if (!state.userId) {
      toast.error("Sign in to upload an avatar.");
      return;
    }
    const validationError = getAvatarUploadValidationError(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      const avatarUrl = await uploadProfileAvatar({
        supabase,
        userId: state.userId,
        file,
      });
      setProfileDraft((prev) => ({ ...prev, avatar_url: avatarUrl }));
      toast.success("Photo uploaded. Press Done to publish it.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Avatar upload failed."));
    }
  };

  const savePreferences = async () => {
    if (!canSavePreferences) {
      return;
    }
    setSaving(true);
    try {
      const profilePreferencesUpdate = buildProfilePreferencesUpdate({
        socialActivityVisibleDirty,
        socialActivityVisible: normalizedProfileDraft.social_activity_visible,
      });

      if (profilePreferencesUpdate) {
        const { error } = await supabase
          .from("profiles")
          .update(profilePreferencesUpdate)
          .eq("id", state.userId);
        if (error) {
          toast.error(error.message);
          return;
        }
      }

      if (plannerPreferencesDirty) {
        const defaultPolicy: PlannerPolicy = createDefaultPlannerPolicy(
          plannerPreferencesDraft.timezone,
          new Date().toISOString()
        );
        defaultPolicy.weekStartsOn = normalizeWeekStartsOn(
          plannerPreferencesDraft.weekStartsOn
        );
        defaultPolicy.restWeekdays = [...plannerPreferencesPersisted.restWeekdays];
        await putJson("/api/planner/context", {
          timezone: plannerPreferencesDraft.timezone,
          defaultPolicy,
        });
        invalidatePlannerRelatedTabCaches();
      }

      toast.success("Preferences updated.");
      markTabDataCacheStaleByPrefix(PUBLIC_PROFILE_CACHE_PREFIX);
      await loadData(true);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Planner preferences could not be saved.")
      );
    } finally {
      setSaving(false);
    }
  };

  const shareGoalWithUser = async (targetUserId: string) => {
    if (activeSelectedShareGoalIds.length === 0) {
      toast.error("Select at least one goal to share.");
      return;
    }

    const existingGoalIds = new Set(
      state.outgoingShares
        .filter((entry) => entry.shared_with === targetUserId)
        .map((entry) => entry.goal_id)
    );
    const newGoalIds = activeSelectedShareGoalIds.filter(
      (goalId) => !existingGoalIds.has(goalId)
    );

    if (newGoalIds.length === 0) {
      toast("All selected goals are already shared with this user.");
      return;
    }

    const { error } = await supabase
      .from("goal_shares")
      .insert(
        newGoalIds.map((goalId) => ({ goal_id: goalId, shared_with: targetUserId }))
      );

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(
        newGoalIds.length === 1 ? "Shared 1 goal." : `Shared ${newGoalIds.length} goals.`
      );
      setShareMenuOpen(false);
      await loadData(true);
    }
  };

  const revokeGoalShare = async (goalId: string, sharedWithUserId: string) => {
    const { error } = await supabase
      .from("goal_shares")
      .delete()
      .eq("goal_id", goalId)
      .eq("shared_with", sharedWithUserId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Removed access.");
      await loadData(true);
    }
  };

  const removeSharedGoalForMe = async (goalId: string) => {
    const { error } = await supabase
      .from("goal_shares")
      .delete()
      .eq("goal_id", goalId)
      .eq("shared_with", state.userId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Removed from shared goals.");
      await loadData(true);
    }
  };

  const signOut = async () => {
    setSigningOut(true);
    try {
      await unsubscribeCurrentBrowser();
    } catch (error) {
      console.error(
        "Failed to remove push subscription while signing out:",
        error
      );
    }

    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
    setSigningOut(false);
  };

  return {
    state,
    loading,
    saving,
    signingOut,
    authEmail,
    searchTerm,
    setSearchTerm,
    selectedShareGoalIds,
    setSelectedShareGoalIds,
    shareMenuOpen,
    setShareMenuOpen,
    shareMenuPosition,
    setShareMenuPosition,
    sharedMonthCursor,
    setSharedMonthCursor,
    profileDraft,
    setProfileDraft,
    uploadProfileAvatarFile,
    plannerPreferencesLoading,
    plannerPreferencesDraft,
    setPlannerPreferencesDraft,
    visibleSearchResults,
    shareableGoals,
    activeSelectedShareGoalIds,
    shareMenuListMaxHeight,
    outgoingSharesByGoal,
    sharedByMeGoals,
    completionsByGoal,
    canSaveProfile,
    canSavePreferences,
    saveProfile,
    savePreferences,
    shareGoalWithUser,
    revokeGoalShare,
    removeSharedGoalForMe,
    signOut,
  };
}
