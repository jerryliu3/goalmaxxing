"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { buildAppTabs } from "@/components/navigation/tabs";
import {
  scheduleDelayedIdleTask,
  scheduleIdleTask,
} from "@/lib/browser/schedule-idle";
import { subscribePlannerTabCacheInvalidation } from "@/lib/cache/planner-tab-cache";
import { warmAppTabData } from "@/lib/cache/warm-app-tab-data";
import { withHrefPrefix } from "@/lib/navigation/demo-path";
import { useAppRouter } from "@/lib/navigation/use-app-router";
import type { PlannerPrimaryTabPreference } from "@cadence/shared/navigation/tabs";

function isCalendarPath(pathname: string, hrefPrefix?: string) {
  const calendarHref = withHrefPrefix("/calendar", hrefPrefix);
  return pathname === calendarHref || pathname.startsWith(`${calendarHref}/`);
}

// Past the calendar e2e "no eager progress-context" window (750ms), then
// warm Progress/Checklist so the first bottom-nav click can paint from cache.
const CALENDAR_PROGRESS_CONTEXT_WARM_DELAY_MS = 2000;

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
  const pathname = usePathname();

  useEffect(() => {
    const tabs = buildAppTabs(
      plannerPrimaryTabPreference,
      hrefPrefix ? { hrefPrefix } : undefined
    );
    const includeProgressContextNow = !isCalendarPath(pathname, hrefPrefix);
    const cancelIdle = scheduleIdleTask(() => {
      for (const tab of tabs) {
        void router.prefetch(tab.href);
      }
      void router.prefetch(withHrefPrefix("/calendar?view=day", hrefPrefix));
      void import("@/features/planner/calendar-page-shell");
      void warmAppTabData({
        userId,
        partnerId,
        includeProgressContext: includeProgressContextNow,
      });
    });
    const cancelDelayedProgressWarm = includeProgressContextNow
      ? () => undefined
      : scheduleDelayedIdleTask(() => {
          void warmAppTabData({
            userId,
            partnerId,
            includeProgressContext: true,
          });
        }, CALENDAR_PROGRESS_CONTEXT_WARM_DELAY_MS);
    return () => {
      cancelIdle();
      cancelDelayedProgressWarm();
    };
  }, [hrefPrefix, partnerId, pathname, plannerPrimaryTabPreference, router, userId]);

  useEffect(() => {
    return subscribePlannerTabCacheInvalidation(() => {
      void warmAppTabData({ userId, partnerId, forceRefresh: true });
    });
  }, [partnerId, userId]);
}
