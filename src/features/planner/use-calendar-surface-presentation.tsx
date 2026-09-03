"use client";

import { useCallback, useMemo } from "react";
import { PlannerRollingWeekStrip } from "@/features/planner/planner-rolling-week-strip";
import {
  buildCalendarSurfaceLayoutProps,
  type PlannerCalendarSurfaceLayoutProps,
} from "@/features/planner/planner-calendar-surface-layout";
import {
  buildPlannerSettingsForm,
  usePlannerEventDetailCallbacks,
} from "@/features/planner/planner-calendar-overlay-bindings";
import { usePlannerCalendarDayCellRenderer } from "@/features/planner/use-planner-calendar-day-cell-renderer";
import type { PlannerDayPreviewInteractions } from "@/features/planner/use-planner-day-preview-interactions";
import type { OpenGoalInstance } from "@/features/planner/use-calendar-view-navigation";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";

type CalendarSurfacePresentationArgs = Omit<
  PlannerCalendarSurfaceLayoutProps,
  | "rollingWeekStrip"
  | "plannerSettingsForm"
  | "eventDetailCallbacks"
  | "saveButtonLabel"
  | "moveViewWindow"
  | "jumpToToday"
  | "renderCalendarDayCell"
> & {
  saveLoading: boolean;
  jumpToTodayBase: (syncShortcut: () => void) => void;
  queueTodayShortcutVisibilitySync: () => void;
  moveViewWindowBase: (
    direction: -1 | 1,
    resolvedFocusedDay: string,
    stepDays: number
  ) => void;
  resolvedFocusedDay: string;
  stepDays: number;
  expandedMonthRows: boolean;
  draggingEntryKey: string | null;
  calendarToday: string;
  plannerReadOnly: boolean;
  onSelectedDayChange: CalendarSurfacePresentationArgs extends never
    ? never
    : import("@/features/planner/calendar-surface.types").CalendarSurfaceProps["onSelectedDayChange"];
  setLocalSelectedDay: (day: string | null) => void;
  setSelectedEventEntryKey: (value: string | null) => void;
  setDayPreview: React.Dispatch<
    React.SetStateAction<
      import("@/features/planner/calendar-surface.types").DayPreviewState | null
    >
  >;
  canMutateEntryOnDay: (
    entry: PlannerDayDetailEntry,
    day: string | null
  ) => boolean;
  getOrderedEntriesForDay: (day: string | null) => PlannerDayDetailEntry[];
  getCompletionFactMarkersForDay: (
    day: string | null
  ) => import("@/features/planner/calendar-surface.types").PlannerCompletionFactMarker[];
  cells: Array<{ date: string; inMonth: boolean }>;
  focusedWeekCells: Array<{ date: string; inMonth: boolean }>;
  dayPreviewInteractions: PlannerDayPreviewInteractions;
  rollingWeekStripRef: React.RefObject<HTMLDivElement | null>;
  focusedWeekDays: string[];
  setupRestWeekdays: number[];
  setSetupRestWeekdays: (value: number[]) => void;
  showTasksOnCalendar: boolean;
  onShowTasksOnCalendarChange: (value: boolean) => void;
  setupLoading: boolean;
  recoverLoading: boolean;
  canRecoverPastSessions: boolean;
  rebuildBlockedMessage: string | undefined;
  fullResetLoading: boolean;
  submitSetup: () => Promise<void>;
  recoverPastSessions: () => Promise<void>;
  rebuildSchedule: () => Promise<void>;
  resetPlanFully: () => Promise<void>;
  rebuildLoading: boolean;
  updateDraftLabel: (entry: PlannerDayDetailEntry, label: string) => void;
  updateDraftScheduledDate: (entry: PlannerDayDetailEntry, date: string) => void;
  updateDraftScheduledTimeOverride: (
    entry: PlannerDayDetailEntry,
    localTime: string
  ) => void;
  toggleItemLock: (entry: PlannerDayDetailEntry) => Promise<void>;
  navigateToOpenInstance: (target: OpenGoalInstance | undefined) => void;
  selectedGoalOpenInstances: OpenGoalInstance[];
  selectedGoalOpenInstanceIndex: number;
};

export function useCalendarSurfacePresentation(args: CalendarSurfacePresentationArgs) {
  const {
    saveLoading,
    jumpToTodayBase,
    queueTodayShortcutVisibilitySync,
    moveViewWindowBase,
    resolvedFocusedDay,
    stepDays,
    expandedMonthRows,
    draggingEntryKey,
    calendarToday,
    plannerReadOnly,
    onSelectedDayChange,
    setLocalSelectedDay,
    setSelectedEventEntryKey,
    setDayPreview,
    canMutateEntryOnDay,
    getOrderedEntriesForDay,
    getCompletionFactMarkersForDay,
    cells,
    focusedWeekCells,
    dayPreviewInteractions,
    rollingWeekStripRef,
    focusedWeekDays,
    setupRestWeekdays,
    setSetupRestWeekdays,
    showTasksOnCalendar,
    onShowTasksOnCalendarChange,
    setupLoading,
    recoverLoading,
    canRecoverPastSessions,
    rebuildBlockedMessage,
    fullResetLoading,
    submitSetup,
    recoverPastSessions,
    rebuildSchedule,
    resetPlanFully,
    rebuildLoading,
    updateDraftLabel,
    updateDraftScheduledDate,
    updateDraftScheduledTimeOverride,
    toggleItemLock,
    navigateToOpenInstance,
    selectedGoalOpenInstances,
    selectedGoalOpenInstanceIndex,
    viewMode,
    ...layoutProps
  } = args;

  const saveButtonLabel = saveLoading ? "Saving..." : "Save plan";
  const jumpToToday = useCallback(
    () => jumpToTodayBase(queueTodayShortcutVisibilitySync),
    [jumpToTodayBase, queueTodayShortcutVisibilitySync]
  );
  const moveViewWindow = useCallback(
    (direction: -1 | 1) => {
      moveViewWindowBase(direction, resolvedFocusedDay, stepDays);
    },
    [moveViewWindowBase, resolvedFocusedDay, stepDays]
  );

  const renderCalendarDayCell = usePlannerCalendarDayCellRenderer({
    viewMode,
    expandedMonthRows,
    draggingEntryKey,
    calendarToday,
    focusedDay: layoutProps.focusedDay,
    plannerReadOnly,
    onSelectedDayChange,
    setLocalSelectedDay,
    setSelectedEventEntryKey,
    setDayPreview,
    canMutateEntryOnDay,
    getOrderedEntriesForDay,
    getCompletionFactMarkersForDay,
    visibleCells: viewMode === "month" ? cells : focusedWeekCells,
    dayPreviewInteractions,
  });

  const rollingWeekStrip = useMemo(
    () => (
      <PlannerRollingWeekStrip
        rollingWeekStripRef={rollingWeekStripRef}
        viewMode={viewMode}
        focusedWeekDays={focusedWeekDays}
        focusedWeekCells={focusedWeekCells}
        renderCalendarDayCell={renderCalendarDayCell}
      />
    ),
    [
      focusedWeekCells,
      focusedWeekDays,
      renderCalendarDayCell,
      rollingWeekStripRef,
      viewMode,
    ]
  );

  const plannerSettingsForm = useMemo(
    () =>
      buildPlannerSettingsForm({
        setupRestWeekdays,
        setSetupRestWeekdays,
        showTasksOnCalendar,
        onShowTasksOnCalendarChange,
        setupLoading,
        plannerReadOnly,
        recoverLoading,
        loading: layoutProps.loading,
        saveLoading,
        canRecoverPastSessions,
        canResetPlan: layoutProps.canResetPlan,
        resetLoading: layoutProps.resetLoading,
        rebuildLoading,
        hasDraftSession: layoutProps.hasDraftSession,
        canShowSaveAction: layoutProps.canShowSaveAction,
        rebuildBlockedMessage,
        fullResetLoading,
        submitSetup,
        recoverPastSessions,
        resetPlan: layoutProps.resetPlan,
        rebuildSchedule,
        resetPlanFully,
      }),
    [
      canRecoverPastSessions,
      fullResetLoading,
      layoutProps.canResetPlan,
      layoutProps.canShowSaveAction,
      layoutProps.hasDraftSession,
      layoutProps.loading,
      rebuildLoading,
      layoutProps.resetLoading,
      layoutProps.resetPlan,
      rebuildBlockedMessage,
      rebuildSchedule,
      recoverLoading,
      recoverPastSessions,
      resetPlanFully,
      saveLoading,
      setSetupRestWeekdays,
      setupLoading,
      setupRestWeekdays,
      showTasksOnCalendar,
      onShowTasksOnCalendarChange,
      submitSetup,
      plannerReadOnly,
    ]
  );

  const eventDetailCallbacks = usePlannerEventDetailCallbacks({
    setSelectedEventEntryKey,
    setLocalSelectedDay,
    updateDraftLabel,
    updateDraftScheduledDate,
    updateDraftScheduledTimeOverride,
    toggleItemLock,
    navigateToOpenInstance,
    selectedGoalOpenInstances,
    selectedGoalOpenInstanceIndex,
  });

  return buildCalendarSurfaceLayoutProps({
    ...layoutProps,
    viewMode,
    showTasksOnCalendar,
    saveLoading,
    expandedMonthRows,
    plannerReadOnly,
    setLocalSelectedDay,
    setSelectedEventEntryKey,
    setDayPreview,
    canMutateEntryOnDay,
    cells,
    focusedWeekCells,
    saveButtonLabel,
    moveViewWindow,
    jumpToToday,
    rollingWeekStrip,
    renderCalendarDayCell,
    plannerSettingsForm,
    eventDetailCallbacks,
  });
}
