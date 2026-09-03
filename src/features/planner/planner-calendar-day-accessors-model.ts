import {
  buildActiveGoalIndexes,
  orderEntriesForDay,
} from "@/features/planner/calendar-entries";
import {
  applyCalendarCompletionMarkerFilters,
  buildCalendarCategoryFilterOptions,
  entryMatchesCalendarSearchQuery,
  goalPassesCalendarFilters,
} from "@/features/planner/calendar-filters";
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
import { allCategoriesValue } from "@/features/goals/goal-filters";
import {
  buildGoalEndMonthOptions,
  resolveEffectiveEndMonth,
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
  categoryFilter: string;
  endMonthFilter: string | null;
  searchQuery?: string;
  duoScope: "me" | "partner" | "both";
  partnerCompletionMarkersByDate?: Map<string, PlannerCompletionFactMarker[]>;
  visibleDays: string[];
  additionalProjectionDays: string[];
  previewEntryOrderByDay: Record<string, string[]>;
  calendarTaskEntriesByDate?: Map<string, PlannerDayDetailEntry[]>;
  showTasksInsteadOfGoals?: boolean;
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
  unplaceableGoalSummaries: PlannerCalendarStoreProjection["unplaceableGoalSummaries"];
  totalUnplacedCount: number;
  invalidLockGoalCount: number;
  capacityWarningGoalCount: number;
  categoryOptions: ReturnType<typeof buildCalendarCategoryFilterOptions>;
  endMonthOptions: ReturnType<typeof buildGoalEndMonthOptions>;
  effectiveEndMonthFilter: string | null;
  getEntriesForDay: (day: string | null) => PlannerDayDetailEntry[];
  getCompletionFactMarkersForDay: (
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
  categoryFilter,
  endMonthFilter,
  searchQuery = "",
  duoScope,
  partnerCompletionMarkersByDate,
  visibleDays,
  additionalProjectionDays,
  previewEntryOrderByDay,
  calendarTaskEntriesByDate,
  showTasksInsteadOfGoals = false,
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
  const effectiveEndMonthFilter = resolveEffectiveEndMonth(
    endMonthFilter,
    filterReferenceMonth
  );

  const categoryOptions = buildCalendarCategoryFilterOptions(activeGoalsByOriginalGoalId);
  const endMonthOptions = (() => {
    const goalEndDates = Array.from(activeGoalsByOriginalGoalId.values()).map(
      (goal) => goal.end_date
    );
    return buildGoalEndMonthOptions(
      goalEndDates,
      filterReferenceMonth,
      effectiveEndMonthFilter ? [effectiveEndMonthFilter] : []
    );
  })();

  const goalPassesFilters = (goalId: string) =>
    goalPassesCalendarFilters({
      goalId,
      goalsByOriginalId: activeGoalsByOriginalGoalId,
      categoryFilter,
      allCategoriesValue,
      endMonthFilter: effectiveEndMonthFilter,
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
    unplaceableGoalSummaries,
    totalUnplacedCount,
  } = calendarStoreProjection;

  const invalidLockGoalCount = unplaceableGoalSummaries.filter(
    (entry) => entry.reason === "invalid_lock"
  ).length;
  const capacityWarningGoalCount = unplaceableGoalSummaries.filter(
    (entry) => entry.reason === "capacity"
  ).length;

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
  const taskLookup = collectCalendarTaskLookup(
    showTasksInsteadOfGoals ? calendarTaskEntriesByDate : undefined
  );
  const entryByKey = showTasksInsteadOfGoals ? taskLookup.entryByKey : goalEntryByKey;
  const entryDayByKey = showTasksInsteadOfGoals
    ? taskLookup.entryDayByKey
    : goalEntryDayByKey;

  const canMutateEntryOnDay = (entry: PlannerDayDetailEntry, day: string | null) => {
    if (!day) {
      return false;
    }
    if (isDayInEditableScope(day)) {
      return true;
    }
    return entryDayByKey.get(entry.key) === day;
  };

  const filterEntries = (entries: PlannerDayDetailEntry[]) =>
    entries.filter((entry) => {
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
    if (showTasksInsteadOfGoals) {
      return filterEntries(calendarTaskEntriesByDate?.get(day) ?? []);
    }
    return filterEntries(getCalendarDayProjection(day).entries);
  };

  const getEntriesForDay = (day: string | null) => {
    if (hideViewerPlan) {
      return [];
    }
    return entriesForDay(day);
  };

  const getCompletionFactMarkersForDay = (day: string | null) => {
    if (showTasksInsteadOfGoals) {
      return [];
    }
    const viewerMarkers = hideViewerPlan
      ? []
      : getCalendarDayProjection(day).completionFactMarkers;
    const partnerMarkers =
      day && (duoScope === "partner" || duoScope === "both")
        ? partnerCompletionMarkersByDate?.get(day) ?? []
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
      entries: showTasksInsteadOfGoals
        ? entriesForDay(day)
        : filterEntries(getCalendarDayProjection(day).orderedEntries),
      previewEntryOrderByDay,
    });
  };

  return {
    entriesByDate,
    entryByKey,
    entryDayByKey,
    effectiveDraftItemEdits,
    unplaceableGoalSummaries,
    totalUnplacedCount,
    invalidLockGoalCount,
    capacityWarningGoalCount,
    categoryOptions,
    endMonthOptions,
    effectiveEndMonthFilter,
    getEntriesForDay,
    getCompletionFactMarkersForDay,
    getOrderedEntriesForDay,
    canMutateEntryOnDay,
    hideViewerPlan,
    plannerReadOnly,
  };
}
