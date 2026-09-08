"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChallengeList } from "@/features/social/challenges/challenge-list";
import {
  invalidateSocialTabCache,
} from "@/features/social/data";
import { TeamPanel } from "@/features/social/team/team-panel";
import { LeaderboardsPanel } from "@/features/social/leaderboards/leaderboards-panel";
import { TabOnboardingOverlay } from "@/features/onboarding/tab-onboarding-overlay";
import { TAB_ONBOARDING_TOURS } from "@/features/onboarding/tab-onboarding";
import { useClientSearchParamsUpdater } from "@/lib/navigation/use-client-search-params-updater";
import { SOCIAL_ACTIVITY_VISIBLE_CACHE_KEY } from "@/lib/cache/planner-tab-cache";
import { readTabDataCache, writeTabDataCache } from "@/lib/cache/tab-data-cache";
import { createClient } from "@/lib/supabase/client";

const SOCIAL_SURFACE_FOCUS_REFRESH_COOLDOWN_MS = 15 * 1000;
const SOCIAL_SURFACE_POLL_INTERVAL_MS = 60 * 1000;

export function SocialSurface() {
  const searchParams = useSearchParams();
  const { applySearchParams } = useClientSearchParamsUpdater();
  const cachedVisibility = readTabDataCache<boolean>(SOCIAL_ACTIVITY_VISIBLE_CACHE_KEY);
  const [socialActivityVisible, setSocialActivityVisible] = useState(
    cachedVisibility ?? true
  );
  const publicSocialLocked = socialActivityVisible === false;
  const [refreshToken, setRefreshToken] = useState(0);
  const lastFocusRefreshAtRef = useRef(0);
  const requestedOnboardingKey = searchParams.get("onboarding");

  const refreshActiveTab = useCallback(() => {
    setRefreshToken((token) => token + 1);
  }, []);

  const triggerBackgroundRefresh = useCallback(() => {
    invalidateSocialTabCache();
    refreshActiveTab();
  }, [refreshActiveTab]);

  const handleVisibilityOrFocus = useCallback(() => {
    if (document.visibilityState !== "visible") {
      return;
    }
    const now = Date.now();
    if (now - lastFocusRefreshAtRef.current < SOCIAL_SURFACE_FOCUS_REFRESH_COOLDOWN_MS) {
      return;
    }
    lastFocusRefreshAtRef.current = now;
    triggerBackgroundRefresh();
  }, [triggerBackgroundRefresh]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }
      triggerBackgroundRefresh();
    }, SOCIAL_SURFACE_POLL_INTERVAL_MS);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [triggerBackgroundRefresh]);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    void supabase.auth.getUser().then(async ({ data }) => {
      const userId = data.user?.id;
      if (!userId) {
        if (!cancelled) {
          writeTabDataCache(SOCIAL_ACTIVITY_VISIBLE_CACHE_KEY, true);
          setSocialActivityVisible(true);
        }
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("social_activity_visible")
        .eq("id", userId)
        .maybeSingle();

      if (!cancelled) {
        const nextVisible = profile?.social_activity_visible !== false;
        writeTabDataCache(SOCIAL_ACTIVITY_VISIBLE_CACHE_KEY, nextVisible);
        setSocialActivityVisible(nextVisible);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const requestedTab = searchParams.get("tab");
    if (!requestedTab) {
      return;
    }
    applySearchParams((params) => {
      params.delete("tab");
    }, "replace");
  }, [applySearchParams, searchParams]);

  useEffect(() => {
    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    return () => {
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [handleVisibilityOrFocus]);

  return (
    <>
      <TabOnboardingOverlay
        onboardingKey="social.main"
        forceOpen={requestedOnboardingKey === "social.main"}
        steps={
          publicSocialLocked
            ? TAB_ONBOARDING_TOURS["social.main"].filter((step) => step.target === "social.team")
            : undefined
        }
      />
      <div className="flex flex-col gap-8">
        {!publicSocialLocked ? (
          <>
            <section data-onboarding="social.leaderboards">
              <LeaderboardsPanel
                isActive
                refreshToken={refreshToken}
                onRefreshRequested={triggerBackgroundRefresh}
              />
            </section>
            <section data-onboarding="social.challenges">
              <ChallengeList
                hideWhenEmpty
                isActive
                refreshToken={refreshToken}
                onRefreshRequested={triggerBackgroundRefresh}
              />
            </section>
          </>
        ) : null}
        <section data-onboarding="social.team">
          <TeamPanel isActive refreshToken={refreshToken} />
        </section>
      </div>
    </>
  );
}
