"use client";

import { useCallback, useEffect, useRef, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
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
  type CalendarVisibleDateWindow,
} from "@/features/planner/calendar-view-projection";
import { buildGoalViewWindow } from "@/features/planner/goal-view/goal-view-model";
import { getApiErrorMessage, getJson, postJson } from "@/lib/api/client";
import {
  buildPlannerContextCacheKey,
  PLANNER_CONTEXT_CACHE_PREFIX,
} from "@/lib/cache/planner-tab-cache";
import {
  invalidateTabDataCacheByPrefix,
  isTabDataCacheFresh,
  loadTabDataCache,
  markTabDataCacheStaleByPrefix,
  readTabDataCache,
  writeTabDataCache,
} from "@/lib/cache/tab-data-cache";
import { getDateInTimezone } from "@/lib/dates/timezone";
import type { PlannerPolicy } from "@/lib/planner/policy";
import { fetchPlannerContext } from "@/lib/planner/fetch-planner-context";

export interface LoadPlannerContextOptions {
  showLoading?: boolean;
  toastOnError?: boolean;
  forcePrepare?: boolean;
  clearCachedContext?: boolean;
  rebalanceExistingAssignments?: boolean;
}

interface UsePlannerContextLoaderArgs {
  activeTab: string;
  month: string | null;
  selectedDay: string | null;
  viewMode: PlannerCalendarViewMode;
  goalViewOpen: boolean;
  setGoalViewWindow: Dispatch<SetStateAction<CalendarVisibleDateWindow | null>>;
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
  setGoalViewWindow,
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
  const requestIdRef = useRef(0);
  const prepareRequestRef = useRef<{
    month: string;
    request: Promise<PlannerContextPayload>;
  } | null>(null);
  useEffect(() => () => { requestIdRef.current += 1; }, []);
  return useCallback(
    async ({
      showLoading = true,
      toastOnError = false,
      forcePrepare = false,
      clearCachedContext = false,
      rebalanceExistingAssignments = false,
    }: LoadPlannerContextOptions = {}) => {
      if (activeTab !== "calendar") {
        return false;
      }
      const requestId = ++requestIdRef.current;

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
      // Both lenses open from the same calendar window. Extra Goal View dates
      // are a background extension, never a prerequisite for the first paint.
      const visibleWindow = buildCalendarVisibleDateWindow(projection.visibleDays);
      if (!visibleWindow) {
        return false;
      }
      const visibleStart = visibleWindow.start;
      const visibleEnd = visibleWindow.end;

      if (clearCachedContext) invalidateTabDataCacheByPrefix(PLANNER_CONTEXT_CACHE_PREFIX);
      const plannerContextCacheKey = buildPlannerContextCacheKey(month);
      const goalWindow = buildGoalViewWindow(calendarToday);
      const goalCacheKey = buildPlannerContextCacheKey(month, goalWindow);
      const applyContext = (payload: PlannerContextPayload, window: CalendarVisibleDateWindow) => {
        setContext(payload);
        setGoalViewWindow(goalViewOpen ? window : null);
        if (payload.preferences?.timezone) {
          const policy = draftPolicyRef.current ?? payload.preferences.defaultPolicy;
          setSetupTimezone(payload.preferences.timezone);
          setSetupWeekStartsOn(normalizeWeekStartsOn(policy.weekStartsOn));
          setSetupRestWeekdays(policy.restWeekdays);
        }
      };
      const warmGoalView = (payload: PlannerContextPayload) => {
        const window = buildGoalViewWindow(goalViewAnchorDate ?? payload.asOfDate);
        void fetchPlannerContext({ month, window }).then(expanded => {
          if (goalViewOpen && requestId === requestIdRef.current) applyContext(expanded, window);
        }).catch(() => undefined);
      };
      const wideSnapshot = goalViewOpen ? readTabDataCache<PlannerContextPayload>(goalCacheKey) : null;
      const useWideSnapshot = Boolean(wideSnapshot && isTabDataCacheFresh(goalCacheKey));
      const cachedContextPayload = useWideSnapshot
        ? wideSnapshot
        : readTabDataCache<PlannerContextPayload>(plannerContextCacheKey) ?? wideSnapshot;
      const cachedWindowIsWide = Boolean(wideSnapshot && cachedContextPayload === wideSnapshot);
      if (cachedContextPayload) {
        applyContext(cachedContextPayload, cachedWindowIsWide ? goalWindow : visibleWindow);
        shouldShowLoading = false;
        setLoading(false);
        if (!forcePrepare && prepareRequestRef.current?.month !== month && isTabDataCacheFresh(cachedWindowIsWide ? goalCacheKey : plannerContextCacheKey)) {
          calendarPreparedRef.current = true;
          // A complete cached Goal View already has its projection; applying
          // the same expanded payload again would rebuild every projected day.
          if (!cachedWindowIsWide) warmGoalView(cachedContextPayload);
          return true;
        }
      }

      if (shouldShowLoading) {
        setLoading(true);
      }
      let contextPayload: PlannerContextPayload;
      try {
        const shouldPrepare = forcePrepare || !calendarPreparedRef.current;
        const readContext = () => loadTabDataCache(plannerContextCacheKey, () =>
          getJson<PlannerContextPayload>("/api/planner/context", {
            query: { scopeMonth: month, visibleStart, visibleEnd },
          })
        );
        const pendingPrepare = prepareRequestRef.current;
        if (!forcePrepare && pendingPrepare?.month === month) {
          // A view switch can show its warmed snapshot immediately, then read
          // the new range after the existing preparation finishes.
          await pendingPrepare.request;
          contextPayload = await readContext();
        } else if (shouldPrepare) {
          const pending = {
            month,
            request: postJson<PlannerContextPayload>("/api/planner/prepare", {
              scopeMonth: month,
              visibleStart,
              visibleEnd,
              ...(rebalanceExistingAssignments ? { rebalanceExistingAssignments: true } : {}),
            }).then(payload => {
              // Warm GETs may have finished before prepare created sessions.
              // Detach those reads even when this view load was superseded.
              markTabDataCacheStaleByPrefix(PLANNER_CONTEXT_CACHE_PREFIX);
              return payload;
            }),
          };
          prepareRequestRef.current = pending;
          try {
            contextPayload = await pending.request;
          } finally {
            if (prepareRequestRef.current === pending) prepareRequestRef.current = null;
          }
        } else {
          contextPayload = await readContext();
        }
        if (requestId !== requestIdRef.current) return false;
        calendarPreparedRef.current = true;
        if (shouldPrepare) writeTabDataCache(plannerContextCacheKey, contextPayload);
      } catch (error) {
        if (requestId !== requestIdRef.current) return false;
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
      setLoading(false);
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

      applyContext(contextPayload, visibleWindow);
      warmGoalView(contextPayload);
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
      setGoalViewWindow,
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
