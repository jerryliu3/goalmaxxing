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
} from "@/features/planner/calendar-view-projection";
import { buildGoalViewWindow } from "@/features/planner/goal-view/goal-view-model";
import { getApiErrorMessage, getJson, postJson } from "@/lib/api/client";
import {
  buildPlannerContextCacheKey,
  PLANNER_CONTEXT_CACHE_PREFIX,
} from "@/lib/cache/planner-tab-cache";
import {
  isTabDataCacheFresh,
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
  rebalanceExistingAssignments?: boolean;
}

interface UsePlannerContextLoaderArgs {
  activeTab: string;
  month: string | null;
  selectedDay: string | null;
  viewMode: PlannerCalendarViewMode;
  goalViewOpen: boolean;
  setGoalViewReady: Dispatch<SetStateAction<boolean>>;
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
  setGoalViewReady,
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
      // Goal View keeps its complete window separate from the month snapshot.
      const visibleWindow = goalViewOpen
        ? buildGoalViewWindow(calendarToday)
        : buildCalendarVisibleDateWindow(projection.visibleDays);
      if (!visibleWindow) {
        return false;
      }
      const visibleStart = visibleWindow.start;
      const visibleEnd = visibleWindow.end;

      const plannerContextCacheKey = buildPlannerContextCacheKey(month, goalViewOpen ? visibleWindow : undefined);
      const warmGoalView = (payload: PlannerContextPayload) => {
        if (!goalViewOpen) {
          void fetchPlannerContext({ month, window: buildGoalViewWindow(payload.asOfDate) }).catch(() => undefined);
        }
      };
      const cachedContextPayload = readTabDataCache<PlannerContextPayload>(plannerContextCacheKey);
      if (cachedContextPayload) {
        setContext(cachedContextPayload);
        setGoalViewReady(goalViewOpen);
        if (cachedContextPayload.preferences?.timezone) {
          const policyForSetup =
            draftPolicyRef.current ?? cachedContextPayload.preferences.defaultPolicy;
          setSetupTimezone(cachedContextPayload.preferences.timezone);
          setSetupWeekStartsOn(normalizeWeekStartsOn(policyForSetup.weekStartsOn));
          setSetupRestWeekdays(policyForSetup.restWeekdays);
        }
        shouldShowLoading = false;
        setLoading(false);
        if (!forcePrepare && prepareRequestRef.current?.month !== month && isTabDataCacheFresh(plannerContextCacheKey)) {
          calendarPreparedRef.current = true;
          warmGoalView(cachedContextPayload);
          return true;
        }
      }

      if (shouldShowLoading) {
        setLoading(true);
      }
      let contextPayload: PlannerContextPayload;
      try {
        const shouldPrepare = forcePrepare || !calendarPreparedRef.current;
        const readContext = () =>
          goalViewOpen
            ? fetchPlannerContext({ month, window: visibleWindow })
            : getJson<PlannerContextPayload>("/api/planner/context", {
                query: { scopeMonth: month, visibleStart, visibleEnd },
              });
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
        if (shouldPrepare || !goalViewOpen) writeTabDataCache(plannerContextCacheKey, contextPayload);
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

      setContext(contextPayload);
      setGoalViewReady(goalViewOpen);
      warmGoalView(contextPayload);
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
      setGoalViewReady,
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
