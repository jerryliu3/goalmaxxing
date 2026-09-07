"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
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
import { useMediaQuery } from "@/lib/ui/use-media-query";

export function CalendarPageShell({ isActive = true }: { isActive?: boolean }) {
  const searchParams = useSearchParams();
  const { applySearchParams } = useClientSearchParamsUpdater();
  const isMobileViewport = useMediaQuery("(max-width: 767px)");
  const defaultCalendarViewMode: PlannerCalendarViewMode = isMobileViewport ? "week" : "month";
  const { scope, activePartner, partner } = useDuoSurface("calendar");
  const overlayEnabled =
    isActive && Boolean(activePartner) && (scope === "partner" || scope === "both");

  const normalized = useMemo(
    () =>
      normalizeCalendarRoute({
        searchParams,
        defaultCalendarViewMode,
      }),
    [defaultCalendarViewMode, searchParams]
  );
  const partnerOverlay = usePartnerCompletionOverlay({
    enabled: overlayEnabled,
    partnerId: activePartner?.partnerId,
    month: normalized.month,
  });

  useEffect(() => {
    if (!isActive || !normalized.changed) {
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
  }, [applySearchParams, isActive, normalized.changed, normalized.nextParams]);

  const updateMonth = useCallback(
    (month: string, mode: "push" | "replace") => {
      if (!isActive) {
        return;
      }
      applySearchParams(
        (params) => {
          params.set("view", "month");
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
    [applySearchParams, isActive, normalized.day]
  );

  const updateViewMode = useCallback(
    (viewMode: PlannerCalendarViewMode, mode: "push" | "replace") => {
      if (!isActive) {
        return;
      }
      applySearchParams(
        (params) => {
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
    [applySearchParams, isActive, normalized.day, normalized.month]
  );

  const updateSelectedDay = useCallback(
    (
      day: string | null,
      mode: "push" | "replace",
      nextViewMode?: PlannerCalendarViewMode,
      options?: { alignMonth?: boolean }
    ) => {
      if (!isActive) {
        return;
      }
      applySearchParams(
        (params) => {
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
    [applySearchParams, isActive, normalized.month, normalized.viewMode]
  );

  return (
    <CalendarSurface
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
    />
  );
}
