"use client";

import { useAppRouter } from "@/lib/navigation/use-app-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildLoginHref } from "@/lib/auth/login-redirect";
import { withAbortSignal } from "@/lib/async/abort";
import {
  buildChecklistDataCacheKey,
  buildPartnerCacheScope,
} from "@/lib/cache/planner-tab-cache";
import { usePlannerTabCacheInvalidation } from "@/lib/cache/use-planner-tab-cache-invalidation";
import {
  isTabDataCacheFresh,
  readTabDataCache,
  writeTabDataCache,
} from "@/lib/cache/tab-data-cache";
import { toLocalDateString } from "@/lib/dates/day";
import { fetchProgressContext } from "@/lib/goals/progress-context";
import { createClient } from "@/lib/supabase/client";
import { useDuoLaneError } from "@/features/social/duo/use-duo-lane-error";
import { useDuo } from "@/features/social/duo/duo-context";
import {
  emptyTodayData,
  fetchChecklistTodayData,
  type TodayData,
} from "@/features/today/fetch-checklist-data";

export type { TodayData };
export { emptyTodayData };

const TODAY_REQUEST_TIMEOUT_MS = 15_000;

function resolveChecklistCacheKey({
  viewerUserId,
  subjectUserId,
  viewDate,
  todayLocalDate,
  partnerId,
}: {
  viewerUserId: string;
  subjectUserId?: string;
  viewDate: string;
  todayLocalDate: string;
  partnerId: string | null;
}) {
  if (!viewerUserId) {
    return null;
  }
  const targetSubjectUserId = subjectUserId ?? viewerUserId;
  return buildChecklistDataCacheKey({
    subjectUserId: targetSubjectUserId,
    viewDate,
    todayLocalDate,
    partnerScope: buildPartnerCacheScope(partnerId, targetSubjectUserId === viewerUserId),
  });
}

export function useChecklistData({
  subjectUserId,
  isActive,
  viewDate,
  failClosed = false,
}: {
  subjectUserId?: string;
  isActive: boolean;
  viewDate: string;
  failClosed?: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const { viewerUserId, state: duoState } = useDuo();
  const partnerId = duoState.activePartner?.partnerId ?? null;
  const router = useAppRouter();
  const todayLocalDate = toLocalDateString();
  const initialCacheKey = resolveChecklistCacheKey({
    viewerUserId,
    subjectUserId,
    viewDate,
    todayLocalDate,
    partnerId,
  });
  const initialCachedData = initialCacheKey
    ? readTabDataCache<TodayData>(initialCacheKey)
    : null;
  const [data, setData] = useState<TodayData>(initialCachedData ?? emptyTodayData);
  const dataRef = useRef<TodayData>(initialCachedData ?? emptyTodayData);
  const [loading, setLoading] = useState(!initialCachedData);
  const loadRequestIdRef = useRef(0);
  const viewDateProgressRequestIdRef = useRef(0);
  const visibleLoadCountRef = useRef(0);
  const pendingRefreshRef = useRef(false);
  const authRedirectStartedRef = useRef(false);
  const currentViewDateRef = useRef(viewDate);
  const previousViewDateRef = useRef(viewDate);

  useEffect(() => {
    currentViewDateRef.current = viewDate;
  }, [viewDate]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

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
    surface: "checklist",
    failClosed,
    redirectToLogin,
    unavailableMessage: "Partner checklist is unavailable.",
    timeoutMessage: "Today goals request timed out. Please try again.",
    fallbackMessage: "Goal progress could not be loaded.",
  });

  const loadData = useCallback(
    async (
      {
        showLoading = true,
        forceRefresh = false,
        completionOnly = false,
      }: {
        showLoading?: boolean;
        forceRefresh?: boolean;
        completionOnly?: boolean;
      } = {}
    ) => {
      const requestId = loadRequestIdRef.current + 1;
      loadRequestIdRef.current = requestId;
      const controller = new AbortController();
      const timeoutId = window.setTimeout(
        () => controller.abort(),
        TODAY_REQUEST_TIMEOUT_MS
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
          setData(emptyTodayData);
          redirectToLogin();
          return;
        }

        const targetSubjectUserId = subjectUserId ?? userId;
        const todayDataCacheKey = resolveChecklistCacheKey({
          viewerUserId: userId,
          subjectUserId,
          viewDate: currentViewDateRef.current,
          todayLocalDate,
          partnerId,
        });
        const cachedData = todayDataCacheKey
          ? readTabDataCache<TodayData>(todayDataCacheKey)
          : null;
        if (cachedData) {
          setData(cachedData);
          dataRef.current = cachedData;
          clearLaneError();
          if (!forceRefresh && todayDataCacheKey && isTabDataCacheFresh(todayDataCacheKey)) {
            setLoading(false);
            return;
          }
        }

        const shouldShowLoading = showLoading && !cachedData && dataRef.current.userId.length === 0;
        if (shouldShowLoading) {
          visibleLoadCountRef.current += 1;
          setLoading(true);
        }
        try {
          if (completionOnly) {
            const progress = await withAbortSignal(
              fetchProgressContext({
                asOfDate: todayLocalDate,
                viewDate: currentViewDateRef.current,
                subjectUserId:
                  targetSubjectUserId === userId ? undefined : targetSubjectUserId,
                forceRefresh,
              }),
              controller.signal
            );
            const previousData = dataRef.current;
            if (previousData.userId === targetSubjectUserId && previousData.goals.length > 0) {
              if (requestId !== loadRequestIdRef.current) {
                return;
              }
              const nextData: TodayData = {
                ...previousData,
                completions: progress.facts,
                progress,
              };
              dataRef.current = nextData;
              setData(nextData);
              if (todayDataCacheKey) {
                writeTabDataCache(todayDataCacheKey, nextData);
              }
              clearLaneError();
              return;
            }
          }

          const nextData = await withAbortSignal(
            fetchChecklistTodayData({
              userId,
              subjectUserId,
              viewDate: currentViewDateRef.current,
              todayLocalDate,
              partnerId,
              forceRefresh,
              signal: controller.signal,
            }),
            controller.signal
          );
          if (requestId !== loadRequestIdRef.current) {
            return;
          }
          setData(nextData);
          dataRef.current = nextData;
          if (todayDataCacheKey) {
            writeTabDataCache(todayDataCacheKey, nextData);
          }
          clearLaneError();
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
      } finally {
        window.clearTimeout(timeoutId);
      }
    },
    [clearLaneError, partnerId, redirectToLogin, subjectUserId, supabase, todayLocalDate, viewerUserId]
  );

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const run = async () => {
      try {
        await loadData({
          showLoading: dataRef.current.userId.length === 0,
        });
      } catch (error) {
        reportLoadError(error);
      }
    };

    void run();
  }, [isActive, loadData, reportLoadError]);

  useEffect(() => {
    if (!isActive || previousViewDateRef.current === viewDate) {
      return;
    }
    previousViewDateRef.current = viewDate;
    const requestId = viewDateProgressRequestIdRef.current + 1;
    viewDateProgressRequestIdRef.current = requestId;
    const timer = window.setTimeout(() => {
      void fetchProgressContext({
        asOfDate: todayLocalDate,
        viewDate,
        subjectUserId,
      })
        .then((progress) => {
          if (requestId !== viewDateProgressRequestIdRef.current) {
            return;
          }
          const nextData: TodayData = {
            ...dataRef.current,
            completions: progress.facts,
            progress,
          };
          dataRef.current = nextData;
          setData(nextData);
          const cacheKey = resolveChecklistCacheKey({
            viewerUserId,
            subjectUserId,
            viewDate,
            todayLocalDate,
            partnerId,
          });
          if (cacheKey) {
            writeTabDataCache(cacheKey, nextData);
          }
        })
        .catch((error: unknown) => {
          reportLoadError(error);
        });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isActive, partnerId, reportLoadError, subjectUserId, todayLocalDate, viewDate, viewerUserId]);

  const refreshInBackground = useCallback(() => {
    void loadData({ showLoading: false, forceRefresh: true }).catch(
      (error: unknown) => {
        reportLoadError(error);
      }
    );
  }, [loadData, reportLoadError]);

  useEffect(() => {
    if (!isActive || !pendingRefreshRef.current) {
      return;
    }
    pendingRefreshRef.current = false;
    const timer = window.setTimeout(() => {
      refreshInBackground();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isActive, refreshInBackground]);

  usePlannerTabCacheInvalidation(() => {
    if (!isActive) {
      pendingRefreshRef.current = true;
      return;
    }
    refreshInBackground();
  });

  return {
    data,
    loading,
    laneError,
    loadData,
    redirectToLogin,
    todayLocalDate,
  };
}
