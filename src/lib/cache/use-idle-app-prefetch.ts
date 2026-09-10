"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { buildAppTabs } from "@/components/navigation/tabs";
import {
  scheduleIdleTask,
} from "@/lib/browser/schedule-idle";
import { subscribePlannerTabCacheInvalidation } from "@/lib/cache/planner-tab-cache";
import { warmAppTabData } from "@/lib/cache/warm-app-tab-data";
import { withHrefPrefix } from "@/lib/navigation/demo-path";
import { useAppRouter } from "@/lib/navigation/use-app-router";

function isCalendarPath(pathname: string, hrefPrefix?: string) {
  const calendarHref = withHrefPrefix("/calendar", hrefPrefix);
  return pathname === calendarHref || pathname.startsWith(`${calendarHref}/`);
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
  const pathname = usePathname();

  useEffect(() => {
    const tabs = buildAppTabs(hrefPrefix ? { hrefPrefix } : undefined);
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
    return () => {
      cancelIdle();
    };
  }, [hrefPrefix, partnerId, pathname, router, userId]);

  useEffect(() => {
    return subscribePlannerTabCacheInvalidation(() => {
      void warmAppTabData({ userId, partnerId, forceRefresh: true });
    });
  }, [partnerId, userId]);
}
