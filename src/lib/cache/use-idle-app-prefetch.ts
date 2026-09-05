"use client";

import { useEffect } from "react";
import { buildAppTabs } from "@/components/navigation/tabs";
import { scheduleIdleTask } from "@/lib/browser/schedule-idle";
import { subscribePlannerTabCacheInvalidation } from "@/lib/cache/planner-tab-cache";
import { warmAppTabData } from "@/lib/cache/warm-app-tab-data";
import { useAppRouter } from "@/lib/navigation/use-app-router";
import type { PlannerPrimaryTabPreference } from "@cadence/shared/navigation/tabs";

export function useIdleAppPrefetch({
  userId,
  partnerId,
  plannerPrimaryTabPreference,
  hrefPrefix,
}: {
  userId: string;
  partnerId: string | null;
  plannerPrimaryTabPreference?: PlannerPrimaryTabPreference;
  hrefPrefix?: string;
}) {
  const router = useAppRouter();

  useEffect(() => {
    const tabs = buildAppTabs(
      plannerPrimaryTabPreference,
      hrefPrefix ? { hrefPrefix } : undefined
    );
    const cancelIdle = scheduleIdleTask(() => {
      for (const tab of tabs) {
        void router.prefetch(tab.href);
      }
      void router.prefetch("/calendar?surface=calendar");
      void router.prefetch("/calendar?surface=tasks");
      void import("@/features/planner/calendar-page-shell");
      void import("@/features/today/checklist-shell");
      void import("@/features/tasks/tasks-tab");
      void warmAppTabData({ userId, partnerId });
    });
    return cancelIdle;
  }, [hrefPrefix, partnerId, plannerPrimaryTabPreference, router, userId]);

  useEffect(() => {
    return subscribePlannerTabCacheInvalidation(() => {
      void warmAppTabData({ userId, partnerId, forceRefresh: true });
    });
  }, [partnerId, userId]);
}
