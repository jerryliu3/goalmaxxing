import {
  buildActiveGoalIndexes,
  orderEntriesForDay,
} from "@/features/planner/calendar-entries";
import { isEntryCredited } from "@/features/planner/calendar-format";
import {
  applyCalendarCompletionMarkerFilters,
  buildCalendarGoalFilterOptions,
  entryMatchesCalendarSearchQuery,
  goalPassesCalendarFilters,
  shouldHideCompletedOnFutureCalendarDay,
} from "@/features/planner/calendar-filters";
import {
  linkedParentGoalIds,
  showsGoalWhenHidingLinkedParents,
} from "@/features/planner/calendar-linked-targets";
import { isPlannerTaskCalendarEntry } from "@/features/planner/calendar-task-entries";
import {
  readPlannerCalendarDayProjection,
  selectPlannerCalendarDayProjectionsByDay,
  selectPlannerCalendarStoreProjection,
} from "@/features/planner/calendar-store-selectors";
import type {
  PlannerCalendarStoreProjection,
  PlannerCalendarDayProjection,
} from "@/features/planner/calendar-store-selectors";
import type {
  PlannerCompletionFactMarker,
  PlannerContextPayload,
  PlannerDayDetailEntry,
} from "@/features/planner/calendar-surface.types";
import type { DraftCommandState } from "@/features/planner/draft-command-reducer";
import {
  buildGoalEndMonthOptions,
  resolveEffectiveEndMonths,
} from "@/lib/goals/list-view";

function collectCalendarTaskLookup(
  calendarTaskEntriesByDate: Map<string, PlannerDayDetailEntry[]> | undefined
) {
  const entryByKey = new Map<string, PlannerDayDetailEntry>();
  const entryDayByKey = new Map<string, string>();
  if (!calendarTaskEntriesByDate) {
    return { entryByKey, entryDayByKey };
  }
  for (const [day, entries] of calendarTaskEntriesByDate) {
    for (const entry of entries) {
      entryByKey.set(entry.key, entry);
      entryDayByKey.set(entry.key, day);
    }
  }
  return { entryByKey, entryDayByKey };
}

export interface CalendarDayAccessorsArgs {
  context: PlannerContextPayload | null;
  effectivePreview: PlannerContextPayload["preview"] | null;
  draftCommandState: DraftCommandState;
  currentScopeMonth: string | null;
  calendarToday: string;
  editableDateWindow: {
    start: string;
    end: string;
  } | null;
  categoryFilters: string[];
  endMonthFilters: string[];
  goalIdFilters?: string[];
  searchQuery?: string;
  duoScope: "me" | "partner" | "both";
  partnerCompletionMarkersByDate?: Map<string, PlannerCompletionFactMarker[]>;
  visibleDays: string[];
  additionalProjectionDays: string[];
  previewEntryOrderByDay: Record<string, string[]>;
  calendarTaskEntriesByDate?: Map<string, PlannerDayDetailEntry[]>;
  hideTasks?: boolean;
  showCompletedGoals?: boolean;
  hideLinkedParents?: boolean;
}

export interface CalendarDayAccessorsMemoizedState {
  activeGoalIndexes?: ReturnType<typeof buildActiveGoalIndexes>;
  calendarStoreProjection?: PlannerCalendarStoreProjection;
}

export interface CalendarDayAccessorsResult {
  entriesByDate: Map<string, PlannerDayDetailEntry[]>;
  entryByKey: Map<string, PlannerDayDetailEntry>;
  entryDayByKey: Map<string, string>;
  effectiveDraftItemEdits: PlannerCalendarStoreProjection["effectiveDraftItemEdits"];
  invalidLockGoalSummaries: PlannerCalendarStoreProjection["invalidLockGoalSummaries"];
  totalInvalidLockSessionCount: number;
  invalidLockGoalCount: number;
  goalFilterOptions: ReturnType<typeof buildCalendarGoalFilterOptions>;
  endMonthOptions: ReturnType<typeof buildGoalEndMonthOptions>;
  effectiveEndMonthFilters: string[];
  getEntriesForDay: (day: string | null) => PlannerDayDetailEntry[];
  getCompletionFactMarkersForDay: (
    day: string | null
  ) => PlannerCompletionFactMarker[];
  getPartnerCompletionFactMarkersForDay: (
    day: string | null
  ) => PlannerCompletionFactMarker[];
  getOrderedEntriesForDay: (day: string | null) => PlannerDayDetailEntry[];
  canMutateEntryOnDay: (entry: PlannerDayDetailEntry, day: string | null) => boolean;
  hideViewerPlan: boolean;
  plannerReadOnly: boolean;
}

export function selectCalendarDayAccessorsModel({
  context,
  effectivePreview,
  draftCommandState,
  currentScopeMonth,
  calendarToday,
  editableDateWindow,
  categoryFilters,
  endMonthFilters,
  goalIdFilters = [],
  searchQuery = "",
  duoScope,
  partnerCompletionMarkersByDate,
  visibleDays,
  additionalProjectionDays,
  previewEntryOrderByDay,
  calendarTaskEntriesByDate,
  hideTasks = false,
  showCompletedGoals = false,
  hideLinkedParents = false,
  memoizedState,
}: CalendarDayAccessorsArgs & {
  memoizedState?: CalendarDayAccessorsMemoizedState;
}): CalendarDayAccessorsResult {
  const activeGoalIndexes =
    memoizedState?.activeGoalIndexes ??
    buildActiveGoalIndexes(context?.activePlan?.goals);
  const activeGoalsByPlanGoalId = activeGoalIndexes.byPlanGoalId;
  const activeGoalsByOriginalGoalId = activeGoalIndexes.byOriginalGoalId;
  const filterReferenceMonth = currentScopeMonth ?? calendarToday.slice(0, 7);
  const effectiveEndMonthFilters = resolveEffectiveEndMonths(
    endMonthFilters,
    filterReferenceMonth
  );

  const goalFilterOptions = buildCalendarGoalFilterOptions(
    activeGoalsByOriginalGoalId,
    context?.goalTitles ?? {},
    {
      categoryFilters,
      endMonthFilters: effectiveEndMonthFilters,
      searchQuery,
      workUnits: effectivePreview?.workUnits ?? [],
    }
  );
  const endMonthOptions = (() => {
    const goalEndDates = Array.from(activeGoalsByOriginalGoalId.values()).map(
      (goal) => goal.end_date
    );
    return buildGoalEndMonthOptions(
      goalEndDates,
      filterReferenceMonth,
      effectiveEndMonthFilters
    );
  })();

  const parentGoalIds = linkedParentGoalIds(context?.links ?? []);
  const goalPassesFilters = (
    goalId: string,
    goalOverride?: { category: string; end_date?: string | null }
  ) =>
    goalPassesCalendarFilters({
      goalId,
      goalsByOriginalId: activeGoalsByOriginalGoalId,
      categoryFilters,
      endMonthFilters: effectiveEndMonthFilters,
      goalIdFilters,
      goalOverride,
    }) &&
    showsGoalWhenHidingLinkedParents({
      hideLinkedParents,
      goalId,
      parentGoalIds,
    });

  const calendarStoreProjection =
    memoizedState?.calendarStoreProjection ??
    selectPlannerCalendarStoreProjection({
      context,
      effectivePreview,
      draftCommandState,
      activeGoalsByPlanGoalId,
      activeGoalsByOriginalGoalId,
    });

  const {
    effectiveDraftItemEdits,
    entriesByDate,
    entryByKey: goalEntryByKey,
    entryDayByKey: goalEntryDayByKey,
    invalidLockGoalSummaries,
    totalInvalidLockSessionCount,
  } = calendarStoreProjection;

  const invalidLockGoalCount = invalidLockGoalSummaries.length;

  const projectionDays = (() => {
    const days = new Set<string>(visibleDays);
    for (const day of additionalProjectionDays) {
      if (day) {
        days.add(day);
      }
    }
    return Array.from(days);
  })();

  const dayProjectionByDay = selectPlannerCalendarDayProjectionsByDay({
    days: projectionDays,
    storeProjection: calendarStoreProjection,
    previewEntryOrderByDay,
  });

  const getCalendarDayProjection = (day: string | null): PlannerCalendarDayProjection =>
    readPlannerCalendarDayProjection(dayProjectionByDay, day);

  const isDayInEditableScope = (day: string | null) => {
    if (!day || !editableDateWindow) {
      return false;
    }
    return day >= editableDateWindow.start && day <= editableDateWindow.end;
  };

  const hideViewerPlan = duoScope === "partner";
  const plannerReadOnly = duoScope === "partner";
  const overlayPartnerOnViewer = duoScope === "partner" || duoScope === "both";
  const taskLookup = collectCalendarTaskLookup(
    hideTasks ? undefined : calendarTaskEntriesByDate
  );
  const entryByKey = new Map([...goalEntryByKey, ...taskLookup.entryByKey]);
  const entryDayByKey = new Map([...goalEntryDayByKey, ...taskLookup.entryDayByKey]);

  const canMutateEntryOnDay = (entry: PlannerDayDetailEntry, day: string | null) => {
    if (!day) {
      return false;
    }
    if (isDayInEditableScope(day)) {
      return true;
    }
    return entryDayByKey.get(entry.key) === day;
  };

  const filterEntries = (entries: PlannerDayDetailEntry[], day: string | null) =>
    entries.filter((entry) => {
      if (
        shouldHideCompletedOnFutureCalendarDay({
          day,
          calendarToday,
          showCompletedGoals,
        }) &&
        isEntryCredited(entry)
      ) {
        return false;
      }
      if (isPlannerTaskCalendarEntry(entry)) {
        return entryMatchesCalendarSearchQuery(entry, searchQuery);
      }
      return (
        goalPassesFilters(entry.originalGoalId) &&
        entryMatchesCalendarSearchQuery(entry, searchQuery)
      );
    });

  const entriesForDay = (day: string | null) => {
    if (!day) {
      return [];
    }
    return filterEntries([
      ...getCalendarDayProjection(day).entries,
      ...(!hideTasks ? calendarTaskEntriesByDate?.get(day) ?? [] : []),
    ], day);
  };

  const getEntriesForDay = (day: string | null) => {
    if (hideViewerPlan) {
      return [];
    }
    return entriesForDay(day);
  };

  const getPartnerCompletionFactMarkersForDay = (day: string | null) => {
    if (!day || duoScope === "me") {
      return [];
    }
    if (
      shouldHideCompletedOnFutureCalendarDay({
        day,
        calendarToday,
        showCompletedGoals,
      })
    ) {
      return [];
    }
    return applyCalendarCompletionMarkerFilters({
      viewerMarkers: [],
      partnerMarkers: partnerCompletionMarkersByDate?.get(day) ?? [],
      goalPassesFilters,
      searchQuery,
    });
  };

  const getCompletionFactMarkersForDay = (day: string | null) => {
    if (
      shouldHideCompletedOnFutureCalendarDay({
        day,
        calendarToday,
        showCompletedGoals,
      })
    ) {
      return [];
    }
    const viewerMarkers = hideViewerPlan
      ? []
      : getCalendarDayProjection(day).completionFactMarkers;
    const partnerMarkers = overlayPartnerOnViewer
      ? getPartnerCompletionFactMarkersForDay(day)
      : [];
    return applyCalendarCompletionMarkerFilters({
      viewerMarkers,
      partnerMarkers,
      goalPassesFilters,
      searchQuery,
    });
  };

  const getOrderedEntriesForDay = (day: string | null) => {
    if (hideViewerPlan) {
      return [];
    }
    return orderEntriesForDay({
      day,
      entries: filterEntries([
        ...getCalendarDayProjection(day).orderedEntries,
        ...(!hideTasks && day ? calendarTaskEntriesByDate?.get(day) ?? [] : []),
      ], day),
      previewEntryOrderByDay,
    });
  };

  return {
    entriesByDate,
    entryByKey,
    entryDayByKey,
    effectiveDraftItemEdits,
    invalidLockGoalSummaries,
    totalInvalidLockSessionCount,
    invalidLockGoalCount,
    goalFilterOptions,
    endMonthOptions,
    effectiveEndMonthFilters,
    getEntriesForDay,
    getCompletionFactMarkersForDay,
    getPartnerCompletionFactMarkersForDay,
    getOrderedEntriesForDay,
    canMutateEntryOnDay,
    hideViewerPlan,
    plannerReadOnly,
  };
}
