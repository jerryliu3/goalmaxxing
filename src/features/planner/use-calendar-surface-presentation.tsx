"use client";

import { useCallback, useMemo } from "react";
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
import type { PlannerResetGoalOption } from "@/features/planner/planner-reset-goal-options";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";

type CalendarSurfacePresentationArgs = Omit<
  PlannerCalendarSurfaceLayoutProps,
  | "plannerSettingsForm"
  | "eventDetailCallbacks"
  | "saveButtonLabel"
  | "moveViewWindow"
  | "jumpToToday"
  | "renderCalendarDayCell"
> & {
  saveLoading: boolean;
  jumpToTodayBase: () => void;
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
  selectedEventEntryKey: string | null;
  setCalendarFocusedGoalId: (goalId: string | null) => void;
  calendarFocusedGoalId: string | null;
  togglePlannerGoalSelection: (
    entry: PlannerDayDetailEntry,
    options: { applyGoalFocus: boolean }
  ) => void;
  resetPlannerEntrySelection: (options?: { clearGoalFocus?: boolean }) => void;
  calendarAsOfDate: string;
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
  setupRestWeekdays: number[];
  setSetupRestWeekdays: (value: number[]) => void;
  setupLoading: boolean;
  recoverLoading: boolean;
  canRecoverPastSessions: boolean;
  rebuildBlockedMessage: string | undefined;
  fullResetLoading: boolean;
  goalResetLoading: boolean;
  openGoals: PlannerResetGoalOption[];
  submitSetup: () => Promise<void>;
  recoverPastSessions: () => Promise<void>;
  rebuildSchedule: () => Promise<void>;
  resetPlanFully: () => Promise<void>;
  resetPlanForGoals: (goals: PlannerResetGoalOption[]) => Promise<void>;
  rebuildLoading: boolean;
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
    selectedEventEntryKey,
    setCalendarFocusedGoalId,
    calendarFocusedGoalId,
    togglePlannerGoalSelection,
    resetPlannerEntrySelection,
    calendarAsOfDate,
    setDayPreview,
    canMutateEntryOnDay,
    getOrderedEntriesForDay,
    getCompletionFactMarkersForDay,
    cells,
    focusedWeekCells,
    dayPreviewInteractions,
    setupRestWeekdays,
    setSetupRestWeekdays,
    setupLoading,
    recoverLoading,
    canRecoverPastSessions,
    rebuildBlockedMessage,
    fullResetLoading,
    goalResetLoading,
    openGoals,
    submitSetup,
    recoverPastSessions,
    rebuildSchedule,
    resetPlanFully,
    resetPlanForGoals,
    rebuildLoading,
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
  const jumpToToday = jumpToTodayBase;
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
    selectedEventEntryKey,
    setCalendarFocusedGoalId,
    calendarFocusedGoalId,
    togglePlannerGoalSelection,
    resetPlannerEntrySelection,
    calendarAsOfDate,
    setDayPreview,
    canMutateEntryOnDay,
    getOrderedEntriesForDay,
    getCompletionFactMarkersForDay,
    visibleCells: viewMode === "month" ? cells : focusedWeekCells,
    dayPreviewInteractions,
    asOfDate: layoutProps.context?.asOfDate ?? null,
    canMutatePlanItems: layoutProps.canMutatePlanItems,
    mutationLoadingKey: layoutProps.mutationLoadingKey,
    optimisticCompletionFacts: layoutProps.optimisticCompletionFacts,
    onToggleCompletion: (entry, day, sourceElement) => {
      void layoutProps.toggleDateFact(entry, day, sourceElement ?? undefined);
    },
  });

  const plannerSettingsForm = useMemo(
    () =>
      buildPlannerSettingsForm({
        setupRestWeekdays,
        setSetupRestWeekdays,
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
        goalResetLoading,
        openGoals,
        submitSetup,
        recoverPastSessions,
        resetPlan: layoutProps.resetPlan,
        rebuildSchedule,
        resetPlanFully,
        resetPlanForGoals,
      }),
    [
      canRecoverPastSessions,
      fullResetLoading,
      goalResetLoading,
      layoutProps.canResetPlan,
      layoutProps.canShowSaveAction,
      layoutProps.hasDraftSession,
      layoutProps.loading,
      openGoals,
      rebuildLoading,
      layoutProps.resetLoading,
      layoutProps.resetPlan,
      rebuildBlockedMessage,
      rebuildSchedule,
      recoverLoading,
      recoverPastSessions,
      resetPlanForGoals,
      resetPlanFully,
      saveLoading,
      setSetupRestWeekdays,
      setupLoading,
      setupRestWeekdays,
      submitSetup,
      plannerReadOnly,
    ]
  );

  const eventDetailCallbacks = usePlannerEventDetailCallbacks({
    resetPlannerEntrySelection,
    setLocalSelectedDay,
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
    saveLoading,
    expandedMonthRows,
    plannerReadOnly,
    setLocalSelectedDay,
    setSelectedEventEntryKey,
    togglePlannerGoalSelection,
    setDayPreview,
    canMutateEntryOnDay,
    cells,
    focusedWeekCells,
    saveButtonLabel,
    moveViewWindow,
    jumpToToday,
    renderCalendarDayCell,
    plannerSettingsForm,
    eventDetailCallbacks,
    onClearSelectedEntry: resetPlannerEntrySelection,
  });
}
