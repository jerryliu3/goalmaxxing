"use client";

import { useAppRouter } from "@/lib/navigation/use-app-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildLoginHref } from "@/lib/auth/login-redirect";
import { withAbortSignal } from "@/lib/async/abort";
import {
  buildInsightsDataCacheKey,
  buildPartnerCacheScope,
} from "@/lib/cache/planner-tab-cache";
import { usePlannerTabCacheInvalidation } from "@/lib/cache/use-planner-tab-cache-invalidation";
import {
  isTabDataCacheFresh,
  loadTabDataCache,
  readTabDataCache,
} from "@/lib/cache/tab-data-cache";
import { reportError } from "@/lib/observability/report-error";
import { toLocalDateString } from "@/lib/dates/day";
import { createClient } from "@/lib/supabase/client";
import { useDuoLaneError } from "@/features/social/duo/use-duo-lane-error";
import { useDuo } from "@/features/social/duo/duo-context";
import { subscribeXpRefresh } from "@/lib/xp/events";
import {
  emptyInsights,
  fetchInsightsData,
  InsightsStatsAuthenticationError,
  type InsightsData,
} from "@/features/insights/fetch-insights-data";

export type { InsightsData };
export { emptyInsights };

const INSIGHTS_REQUEST_TIMEOUT_MS = 15_000;

function resolveInsightsCacheKey({
  viewerUserId,
  subjectUserId,
  selectedYear,
  partnerId,
}: {
  viewerUserId: string;
  subjectUserId?: string;
  selectedYear: string;
  partnerId: string | null;
}) {
  const targetSubjectUserId = subjectUserId ?? viewerUserId;
  return buildInsightsDataCacheKey({
    subjectUserId: targetSubjectUserId,
    selectedYear,
    asOfDate: toLocalDateString(),
    partnerScope: buildPartnerCacheScope(partnerId, targetSubjectUserId === viewerUserId),
  });
}

export function useInsightsData({
  subjectUserId,
  selectedYear,
  failClosed = false,
}: {
  subjectUserId?: string;
  selectedYear: string;
  failClosed?: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const { viewerUserId, state: duoState } = useDuo();
  const partnerId = duoState.activePartner?.partnerId ?? null;
  const router = useAppRouter();
  // The cache is sessionStorage-backed, so it must not be read while
  // rendering: the server has no cache, and a warm client cache would then
  // disagree with the server markup. `loadData` reads it on mount before any
  // network await, so a warm cache still paints without the round trip.
  const [state, setState] = useState<InsightsData>(emptyInsights);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loadRequestIdRef = useRef(0);
  const visibleLoadCountRef = useRef(0);
  const authRedirectStartedRef = useRef(false);
  const stateRef = useRef(emptyInsights);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const redirectToLogin = useCallback(() => {
    if (authRedirectStartedRef.current) {
      return;
    }
    authRedirectStartedRef.current = true;
    const nextPath =
      typeof window === "undefined"
        ? "/"
        : `${window.location.pathname}${window.location.search}`;
    router.replace(buildLoginHref(nextPath));
  }, [router]);

  const { laneError, clearLaneError, reportLoadError } = useDuoLaneError({
    surface: "insights",
    failClosed,
    redirectToLogin,
    unavailableMessage: "Partner insights are unavailable.",
    timeoutMessage: "Insights request timed out. Please try again.",
    fallbackMessage: "Insights progress could not be loaded.",
  });

  const loadData = useCallback(
    async (
      {
        showLoading = true,
        forceRefresh = false,
      }: { showLoading?: boolean; forceRefresh?: boolean } = {}
    ) => {
      const requestId = loadRequestIdRef.current + 1;
      loadRequestIdRef.current = requestId;
      const controller = new AbortController();
      const timeoutId = window.setTimeout(
        () => controller.abort(),
        INSIGHTS_REQUEST_TIMEOUT_MS
      );
      try {
        const userId = viewerUserId
          ? viewerUserId
          : (
              await withAbortSignal(supabase.auth.getUser(), controller.signal)
            ).data.user?.id;

        if (requestId !== loadRequestIdRef.current) {
          return;
        }

        if (!userId) {
          setState(emptyInsights);
          redirectToLogin();
          return;
        }

        const insightsDataCacheKey = resolveInsightsCacheKey({
          viewerUserId: userId,
          subjectUserId,
          selectedYear,
          partnerId,
        });
        const cachedState = readTabDataCache<InsightsData>(insightsDataCacheKey);
        if (cachedState) {
          setState(cachedState);
          stateRef.current = cachedState;
          clearLaneError();
          setLoadError(null);
          if (!forceRefresh && isTabDataCacheFresh(insightsDataCacheKey)) {
            setLoading(false);
            return;
          }
        }

        const shouldShowLoading =
          showLoading && !cachedState && stateRef.current.userId.length === 0;
        if (shouldShowLoading) {
          visibleLoadCountRef.current += 1;
          setLoading(true);
        }
        try {
          // A mounted tracker joins the collection/shell warmup. Its timeout
          // only stops this consumer, not the shared request or cache fill.
          const nextState = await withAbortSignal(
            loadTabDataCache(insightsDataCacheKey, () => fetchInsightsData({
              userId,
              subjectUserId,
              selectedYear,
              partnerId,
              forceRefresh,
            }), { forceRefresh: forceRefresh && isTabDataCacheFresh(insightsDataCacheKey) }),
            controller.signal
          );
          if (requestId !== loadRequestIdRef.current) {
            return;
          }
          setState(nextState);
          stateRef.current = nextState;
          clearLaneError();
          setLoadError(null);
        } finally {
          if (shouldShowLoading) {
            visibleLoadCountRef.current = Math.max(visibleLoadCountRef.current - 1, 0);
            if (visibleLoadCountRef.current === 0) {
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        }
      } catch (error) {
        if (requestId === loadRequestIdRef.current) {
          setLoadError(error instanceof Error ? error.message : "Goal history could not be loaded.");
        }
        reportError(error, { surface: "insights" });
        throw error;
      } finally {
        if (requestId === loadRequestIdRef.current) setLoading(false);
        window.clearTimeout(timeoutId);
      }
    },
    [clearLaneError, partnerId, redirectToLogin, selectedYear, subjectUserId, supabase, viewerUserId]
  );

  const refreshInBackground = useCallback(() => {
    void loadData({ showLoading: false, forceRefresh: true }).catch((error) => {
      if (error instanceof InsightsStatsAuthenticationError) {
        redirectToLogin();
        return;
      }
      reportLoadError(error);
    });
  }, [loadData, redirectToLogin, reportLoadError]);

  useEffect(() => {
    const run = async () => {
      try {
        await loadData({
          showLoading: stateRef.current.userId.length === 0,
        });
      } catch (error) {
        if (error instanceof InsightsStatsAuthenticationError) {
          redirectToLogin();
          return;
        }
        reportLoadError(error);
      }
    };

    void run();
  }, [loadData, redirectToLogin, reportLoadError]);

  useEffect(() => {
    return subscribeXpRefresh(refreshInBackground);
  }, [refreshInBackground]);

  usePlannerTabCacheInvalidation(refreshInBackground);

  return {
    state,
    loading,
    laneError,
    loadError,
    reload: refreshInBackground,
    loadData,
    redirectToLogin,
  };
}
