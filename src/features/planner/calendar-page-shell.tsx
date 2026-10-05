"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { CalendarSurface } from "@/features/planner/calendar-surface";
import { usePartnerCompletionOverlay } from "@/features/planner/use-partner-completion-overlay";
import {
  getTodayDateParam,
  isValidDate,
  isValidMonth,
  normalizeCalendarRoute,
  resolveDayInMonth,
  type PlannerCalendarViewMode,
} from "@/features/today/checklist-shell-routing";
import { useDuoSurface } from "@/features/social/duo/use-duo-surface";
import { useClientSearchParamsUpdater } from "@/lib/navigation/use-client-search-params-updater";
import {
  DEFAULT_CALENDAR_VIEW_MODE,
  isPlannerCalendarPathname,
} from "@/lib/planner/calendar-view-memory";

export function CalendarPageShell({ isActive = true }: { isActive?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { applySearchParams } = useClientSearchParamsUpdater();
  const onCalendarPath = isPlannerCalendarPathname(pathname);
  const routeIsActive = isActive && onCalendarPath;
  const defaultCalendarViewMode = DEFAULT_CALENDAR_VIEW_MODE;
  const { scope, activePartner, partner, viewer } = useDuoSurface("calendar");
  const overlayEnabled =
    isActive && Boolean(activePartner) && (scope === "partner" || scope === "both");

  const liveNormalized = useMemo(
    () =>
      normalizeCalendarRoute({
        searchParams,
        defaultCalendarViewMode,
      }),
    [defaultCalendarViewMode, searchParams]
  );
  const calendarRouteRef = useRef(liveNormalized);
  if (onCalendarPath) {
    calendarRouteRef.current = liveNormalized;
  }
  const normalized = onCalendarPath ? liveNormalized : calendarRouteRef.current;
  const partnerOverlay = usePartnerCompletionOverlay({
    enabled: overlayEnabled,
    partnerId: activePartner?.partnerId,
    month: normalized.month,
  });

  useEffect(() => {
    if (!routeIsActive || !normalized.changed) {
      return;
    }
    applySearchParams(
      (params) => {
        for (const key of Array.from(params.keys())) {
          params.delete(key);
        }
        for (const [key, value] of normalized.nextParams.entries()) {
          params.set(key, value);
        }
      },
      "replace"
    );
  }, [applySearchParams, normalized.changed, normalized.nextParams, routeIsActive]);

  const updateMonth = useCallback(
    (month: string, mode: "push" | "replace") => {
      if (!routeIsActive) {
        return;
      }
      applySearchParams(
        (params) => {
          params.set("view", normalized.viewMode);
          params.set("month", month);
          params.set(
            "day",
            resolveDayInMonth({
              month,
              preferredDay: normalized.day,
              today: getTodayDateParam(),
            })
          );
        },
        mode
      );
    },
    [applySearchParams, normalized.day, normalized.viewMode, routeIsActive]
  );

  const updateViewMode = useCallback(
    (viewMode: PlannerCalendarViewMode, mode: "push" | "replace") => {
      if (!routeIsActive) {
        return;
      }
      applySearchParams(
        (params) => {
          params.delete("lens");
          params.set("view", viewMode);
          const today = getTodayDateParam();
          const day =
            normalized.day ??
            (isValidMonth(normalized.month)
              ? resolveDayInMonth({
                  month: normalized.month,
                  preferredDay: null,
                  today,
                })
              : today);
          if (isValidDate(day)) {
            params.set("day", day);
            params.set("month", day.slice(0, 7));
          }
        },
        mode
      );
    },
    [applySearchParams, normalized.day, normalized.month, routeIsActive]
  );

  const updateSelectedDay = useCallback(
    (
      day: string | null,
      mode: "push" | "replace",
      nextViewMode?: PlannerCalendarViewMode,
      options?: { alignMonth?: boolean }
    ) => {
      if (!routeIsActive) {
        return;
      }
      applySearchParams(
        (params) => {
          if (nextViewMode) params.delete("lens");
          if (day && isValidDate(day)) {
            const resolvedViewMode = nextViewMode ?? normalized.viewMode;
            params.set("view", resolvedViewMode);
            params.set("day", day);
            const viewedMonth = normalized.month;
            const keepViewedMonth =
              resolvedViewMode === "month" &&
              isValidMonth(viewedMonth) &&
              options?.alignMonth !== true;
            params.set(
              "month",
              keepViewedMonth && viewedMonth ? viewedMonth : day.slice(0, 7)
            );
            return;
          }
          const fallbackDay = getTodayDateParam();
          params.set("view", nextViewMode ?? normalized.viewMode);
          params.set("day", fallbackDay);
          params.set("month", fallbackDay.slice(0, 7));
        },
        mode
      );
    },
    [applySearchParams, normalized.month, normalized.viewMode, routeIsActive]
  );

  return (
    <CalendarSurface
      goalTimelineOpen={searchParams.get("lens") === "goals"}
      onGoalTimelineOpenChange={(open) => {
        if (!routeIsActive) return;
        applySearchParams((params) => {
          if (open) params.set("lens", "goals");
          else params.delete("lens");
        }, "push");
      }}
      activeTab="calendar"
      month={normalized.month}
      selectedDay={normalized.day}
      viewMode={normalized.viewMode}
      onMonthChange={updateMonth}
      onViewModeChange={updateViewMode}
      onSelectedDayChange={updateSelectedDay}
      onPlannerMutation={() => {}}
      duoScope={scope}
      partnerCompletionMarkersByDate={partnerOverlay.markersByDate}
      partnerOverlayError={partnerOverlay.error}
      partnerLabel={scope === "both" ? partner?.label ?? null : null}
      viewerSubject={scope === "both" ? viewer : null}
      partnerSubject={scope === "both" ? partner : null}
    />
  );
}
