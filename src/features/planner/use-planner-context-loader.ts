"use client";

import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { toast } from "sonner";
import {
  getMonthInTimezone,
  normalizeWeekStartsOn,
} from "@/features/planner/calendar-format";
import type {
  PlannerCalendarViewMode,
  PlannerContextPayload,
} from "@/features/planner/calendar-surface.types";
import {
  buildCalendarVisibleDateWindow,
  selectCalendarViewWindowProjection,
} from "@/features/planner/calendar-view-projection";
import { buildGoalViewWindow } from "@/features/planner/goal-view/goal-view-model";
import { getApiErrorMessage, getJson, postJson } from "@/lib/api/client";
import {
  buildPlannerContextCacheKey,
} from "@/lib/cache/planner-tab-cache";
import {
  isTabDataCacheFresh,
  readTabDataCache,
  writeTabDataCache,
} from "@/lib/cache/tab-data-cache";
import { getDateInTimezone } from "@/lib/dates/timezone";
import type { PlannerPolicy } from "@/lib/planner/policy";

export interface LoadPlannerContextOptions {
  showLoading?: boolean;
  toastOnError?: boolean;
  forcePrepare?: boolean;
  rebalanceExistingAssignments?: boolean;
}

interface UsePlannerContextLoaderArgs {
  activeTab: string;
  month: string | null;
  selectedDay: string | null;
  viewMode: PlannerCalendarViewMode;
  goalViewOpen: boolean;
  setupTimezone: string;
  setupWeekStartsOn: number;
  onMonthChange: (month: string, mode: "push" | "replace") => void;
  setContext: Dispatch<SetStateAction<PlannerContextPayload | null>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setSetupTimezone: Dispatch<SetStateAction<string>>;
  setSetupWeekStartsOn: Dispatch<SetStateAction<number>>;
  setSetupRestWeekdays: Dispatch<SetStateAction<number[]>>;
  draftPolicyRef: MutableRefObject<PlannerPolicy | null>;
  calendarPreparedRef: MutableRefObject<boolean>;
}

export function usePlannerContextLoader({
  activeTab,
  month,
  selectedDay,
  viewMode,
  goalViewOpen,
  setupTimezone,
  setupWeekStartsOn,
  onMonthChange,
  setContext,
  setLoading,
  setError,
  setSetupTimezone,
  setSetupWeekStartsOn,
  setSetupRestWeekdays,
  draftPolicyRef,
  calendarPreparedRef,
}: UsePlannerContextLoaderArgs) {
  return useCallback(
    async ({
      showLoading = true,
      toastOnError = false,
      forcePrepare = false,
      rebalanceExistingAssignments = false,
    }: LoadPlannerContextOptions = {}) => {
      if (activeTab !== "calendar") {
        return false;
      }

      let shouldShowLoading = showLoading;
      if (shouldShowLoading) {
        setError(null);
      }
      if (!month) {
        const resolvedMonth = getMonthInTimezone(setupTimezone);
        onMonthChange(resolvedMonth, "replace");
        return true;
      }
      const calendarToday = getDateInTimezone(new Date(), setupTimezone);
      const projection = selectCalendarViewWindowProjection({
        month,
        selectedDay,
        calendarToday,
        weekStartsOn: setupWeekStartsOn,
        viewMode,
      });
      // Goal View browses months of sessions at once, so it asks for its own
      // wide window and never shares the month-keyed cache with calendar views.
      const visibleWindow = goalViewOpen
        ? buildGoalViewWindow(calendarToday)
        : buildCalendarVisibleDateWindow(projection.visibleDays);
      if (!visibleWindow) {
        return false;
      }
      const visibleStart = visibleWindow.start;
      const visibleEnd = visibleWindow.end;

      const plannerContextCacheKey = buildPlannerContextCacheKey(month);
      const cachedContextPayload = goalViewOpen
        ? null
        : readTabDataCache<PlannerContextPayload>(plannerContextCacheKey);
      if (cachedContextPayload) {
        setContext(cachedContextPayload);
        if (cachedContextPayload.preferences?.timezone) {
          const policyForSetup =
            draftPolicyRef.current ?? cachedContextPayload.preferences.defaultPolicy;
          setSetupTimezone(cachedContextPayload.preferences.timezone);
          setSetupWeekStartsOn(normalizeWeekStartsOn(policyForSetup.weekStartsOn));
          setSetupRestWeekdays(policyForSetup.restWeekdays);
        }
        shouldShowLoading = false;
        if (!forcePrepare && isTabDataCacheFresh(plannerContextCacheKey)) {
          calendarPreparedRef.current = true;
          setLoading(false);
          return true;
        }
      }

      if (shouldShowLoading) {
        setLoading(true);
      }
      let contextPayload: PlannerContextPayload;
      try {
        const shouldPrepare = forcePrepare || !calendarPreparedRef.current;
        contextPayload = shouldPrepare
          ? await postJson<PlannerContextPayload>("/api/planner/prepare", {
              scopeMonth: month,
              visibleStart,
              visibleEnd,
              ...(rebalanceExistingAssignments
                ? { rebalanceExistingAssignments: true }
                : {}),
            })
          : await getJson<PlannerContextPayload>("/api/planner/context", {
              query: {
                scopeMonth: month,
                visibleStart,
                visibleEnd,
              },
            });
        calendarPreparedRef.current = true;
      } catch (error) {
        if (shouldShowLoading) {
          setLoading(false);
        }
        const message = getApiErrorMessage(
          error,
          "Planner calendar context could not be loaded."
        );
        if (shouldShowLoading) {
          setContext(null);
          setError(message);
        }
        if (toastOnError) {
          toast.error(message);
        }
        return false;
      }
      if (shouldShowLoading) {
        setLoading(false);
      }
      if (!contextPayload) {
        const message = "Planner calendar context could not be loaded.";
        if (shouldShowLoading) {
          setContext(null);
          setError(message);
        }
        if (toastOnError) {
          toast.error(message);
        }
        return false;
      }

      setContext(contextPayload);
      if (!goalViewOpen) {
        writeTabDataCache(plannerContextCacheKey, contextPayload);
      }
      if (contextPayload.preferences?.timezone) {
        const policyForSetup =
          draftPolicyRef.current ?? contextPayload.preferences.defaultPolicy;
        setSetupTimezone(contextPayload.preferences.timezone);
        setSetupWeekStartsOn(normalizeWeekStartsOn(policyForSetup.weekStartsOn));
        setSetupRestWeekdays(policyForSetup.restWeekdays);
      }
      return true;
    },
    [
      activeTab,
      calendarPreparedRef,
      draftPolicyRef,
      month,
      onMonthChange,
      goalViewOpen,
      selectedDay,
      setContext,
      setError,
      setLoading,
      setSetupRestWeekdays,
      setSetupTimezone,
      setSetupWeekStartsOn,
      setupWeekStartsOn,
      setupTimezone,
      viewMode,
    ]
  );
}
