"use client";

import { useEffect } from "react";
import { APP_SURFACE_READY_EVENT } from "@/components/layout/app-boot-preload";
import { buildAppTabs } from "@/components/navigation/tabs";
import {
  scheduleDelayedIdleTask,
  scheduleIdleTask,
} from "@/lib/browser/schedule-idle";
import { subscribePlannerTabCacheInvalidation } from "@/lib/cache/planner-tab-cache";
import { warmAppTabData } from "@/lib/cache/warm-app-tab-data";
import { withHrefPrefix } from "@/lib/navigation/demo-path";
import { useAppRouter } from "@/lib/navigation/use-app-router";

export const PROGRESS_TAB_WARM_DELAY_MS = 2000;

function prefetchAppTabModules() {
  void import("@/features/planner/calendar-page-shell");
  void import("@/features/insights/insights-shell");
  void import("@/features/social/social-surface");
  void import("@/features/goals/goals-destination");
}

export function useIdleAppPrefetch({
  userId,
  partnerId,
  hrefPrefix,
}: {
  userId: string;
  partnerId: string | null;
  hrefPrefix?: string;
}) {
  const router = useAppRouter();

  useEffect(() => {
    const tabs = buildAppTabs(hrefPrefix ? { hrefPrefix } : undefined);
    const prefetchRoutesAndModules = () => {
      for (const tab of tabs) {
        void router.prefetch(tab.href);
      }
      void router.prefetch(withHrefPrefix("/calendar?view=day", hrefPrefix));
      prefetchAppTabModules();
    };
    const warmNonProgressTabs = () => {
      void warmAppTabData({
        userId,
        partnerId,
        includeProgressContext: false,
      });
    };
    let progressWarmStarted = false;
    const warmProgressTabs = () => {
      if (progressWarmStarted) {
        return;
      }
      progressWarmStarted = true;
      void warmAppTabData({
        userId,
        partnerId,
        includeProgressContext: true,
      });
    };

    // Start navigation-critical warmups as soon as the authenticated shell is
    // mounted; waiting for idle leaves fast tab switches on the cold path.
    prefetchRoutesAndModules();
    warmNonProgressTabs();
    let cancelProgressIdle: () => void = () => {};
    const startProgressWarm = () => {
      cancelProgressIdle();
      cancelProgressIdle = scheduleIdleTask(warmProgressTabs);
    };
    window.addEventListener(APP_SURFACE_READY_EVENT, startProgressWarm);
    const cancelProgressFallback = scheduleDelayedIdleTask(
      warmProgressTabs,
      PROGRESS_TAB_WARM_DELAY_MS * 2
    );

    return () => {
      cancelProgressIdle();
      cancelProgressFallback();
      window.removeEventListener(APP_SURFACE_READY_EVENT, startProgressWarm);
    };
  }, [hrefPrefix, partnerId, router, userId]);

  useEffect(() => {
    return subscribePlannerTabCacheInvalidation(() => {
      void warmAppTabData({ userId, partnerId, forceRefresh: true });
    });
  }, [partnerId, userId]);
}
