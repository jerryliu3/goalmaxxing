import { buildPlannerLinkedTargetIndexes } from "@/features/planner/calendar-linked-targets";
import { normalizeWeekStartsOn } from "@/features/planner/calendar-format";
import type {
  PlannerCalendarViewMode,
  PlannerCompletionFactMarker,
  PlannerContextPayload,
  PlannerDayDetailEntry,
} from "@/features/planner/calendar-surface.types";
import {
  buildCalendarVisibleDateWindow,
  selectCalendarViewWindowProjection,
} from "@/features/planner/calendar-view-projection";
import type { CalendarViewWindowProjection } from "@/features/planner/calendar-view-projection";
import {
  selectCalendarViewWindowModel,
  type CalendarViewWindowModel,
} from "@/features/planner/calendar-view-window";
import type { DraftCommandState } from "@/features/planner/draft-command-reducer";
import {
  type PlannerDraftSessionModel,
} from "@/features/planner/planner-draft-session-model";
import {
  selectPlannerEligibilityNotices,
  type PlannerEligibilityNotices,
} from "@/features/planner/planner-eligibility-notices";
import {
  selectPlannerSaveAvailability,
  type PlannerSaveAvailability,
} from "@/features/planner/planner-save-availability";
import {
  selectPlannerWarningModel,
  type PlannerWarningModel,
} from "@/features/planner/planner-warning-model";
import {
  selectCalendarDayAccessorsModel,
  type CalendarDayAccessorsMemoizedState,
  type CalendarDayAccessorsResult,
} from "@/features/planner/planner-calendar-day-accessors-model";
import type { PlannerPolicy } from "@/lib/planner/policy";
import { getDateInTimezone } from "@/lib/dates/timezone";

export interface PlannerCalendarModelArgs {
  context: PlannerContextPayload | null;
  draftPreview: NonNullable<PlannerContextPayload["preview"]> | null;
  draftPolicy: PlannerPolicy | null;
  draftCommandState: DraftCommandState;
  month: string | null;
  selectedDay: string | null;
  viewMode: PlannerCalendarViewMode;
  setupTimezone: string;
  duoScope: "me" | "partner" | "both";
  categoryFilters: string[];
  endMonthFilters: string[];
  goalIdFilters?: string[];
  searchQuery?: string;
  partnerCompletionMarkersByDate?: Map<string, PlannerCompletionFactMarker[]>;
  previewEntryOrderByDay: Record<string, string[]>;
  additionalProjectionDays: string[];
  calendarTaskEntriesByDate?: Map<string, PlannerDayDetailEntry[]>;
  hideTasks?: boolean;
  showCompletedGoals?: boolean;
  memoizedState: PlannerCalendarMemoizedState;
}

export interface PlannerCalendarMemoizedState
  extends CalendarDayAccessorsMemoizedState {
  draftSession: PlannerDraftSessionModel;
}

export interface PlannerCalendarModel {
  currentScopeMonth: string | null;
  weekStartsOn: number;
  calendarToday: string;
  viewProjection: CalendarViewWindowProjection;
  viewWindow: CalendarViewWindowModel;
  draftSession: PlannerDraftSessionModel;
  dayAccessors: CalendarDayAccessorsResult;
  saveAvailability: PlannerSaveAvailability;
  warningModel: PlannerWarningModel;
  eligibilityNotices: PlannerEligibilityNotices;
  linkedTargetIndexes: ReturnType<typeof buildPlannerLinkedTargetIndexes>;
}

export function selectPlannerCalendarModel({
  context,
  draftCommandState,
  month,
  selectedDay,
  viewMode,
  setupTimezone,
  duoScope,
  categoryFilters,
  endMonthFilters,
  goalIdFilters = [],
  searchQuery = "",
  partnerCompletionMarkersByDate,
  previewEntryOrderByDay,
  additionalProjectionDays,
  calendarTaskEntriesByDate,
  hideTasks = false,
  showCompletedGoals = false,
  memoizedState,
}: PlannerCalendarModelArgs): PlannerCalendarModel {
  const weekStartsOn = normalizeWeekStartsOn(
    context?.preferences?.defaultPolicy.weekStartsOn
  );
  const calendarToday =
    context?.asOfDate ??
    getDateInTimezone(new Date(), context?.timezone ?? setupTimezone);
  const viewProjection = selectCalendarViewWindowProjection({
    month,
    selectedDay,
    calendarToday,
    weekStartsOn,
    viewMode,
  });
  const currentScopeMonth = month ?? context?.scopeMonth ?? null;
  const editableDateWindow = buildCalendarVisibleDateWindow(
    viewProjection.visibleDays
  );
  const draftSession = memoizedState.draftSession;
  const dayAccessors = selectCalendarDayAccessorsModel({
    context,
    effectivePreview: draftSession.effectivePreview,
    draftCommandState,
    currentScopeMonth,
    calendarToday,
    editableDateWindow,
    categoryFilters,
    endMonthFilters,
    goalIdFilters,
    searchQuery,
    duoScope,
    partnerCompletionMarkersByDate,
    visibleDays: viewProjection.visibleDays,
    additionalProjectionDays: [viewProjection.focusedDay, ...additionalProjectionDays],
    previewEntryOrderByDay,
    calendarTaskEntriesByDate,
    hideTasks,
    showCompletedGoals,
    memoizedState,
  });
  const eligibilityNotices = selectPlannerEligibilityNotices({
    context,
    effectivePreview: draftSession.effectivePreview,
    month,
  });
  const saveAvailability = selectPlannerSaveAvailability({
    context,
    effectivePreview: draftSession.effectivePreview,
    draftSaveWindow: draftSession.draftSaveWindow,
    draftWindowTooWide: draftSession.draftWindowTooWide,
    hasDraftSession: draftSession.hasDraftSession,
  });
  const warningModel = selectPlannerWarningModel({
    unplaceableGoalCount: dayAccessors.unplaceableGoalSummaries.length,
    invalidLockGoalCount: dayAccessors.invalidLockGoalCount,
    capacityWarningGoalCount: dayAccessors.capacityWarningGoalCount,
    eligibilityNotices,
  });
  const viewWindow = selectCalendarViewWindowModel({
    month,
    viewMode,
    focusedDay: viewProjection.focusedDay,
    focusedWeekDays: viewProjection.focusedWeekDays,
    focusedThreeDayDays: viewProjection.focusedThreeDayDays,
    calendarToday,
  });
  const linkedTargetIndexes = buildPlannerLinkedTargetIndexes(context?.links ?? []);

  return {
    currentScopeMonth,
    weekStartsOn,
    calendarToday,
    viewProjection,
    viewWindow,
    draftSession,
    dayAccessors,
    saveAvailability,
    warningModel,
    eligibilityNotices,
    linkedTargetIndexes,
  };
}
