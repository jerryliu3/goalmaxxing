"use client";

import { useMemo } from "react";
import type {
  PlannerCompletionFactMarker,
  PlannerDayDetailEntry,
} from "@/features/planner/calendar-surface.types";
import type { MoveSourceCandidate } from "@/features/planner/planner-move-source-options";
import type {
  PlannerGoalLinkSummary,
  PlannerWorkUnit,
} from "@cadence/shared/planner/context";

export function useCalendarSurfaceDayEntryViews({
  focusedDay,
  dayPreviewDay,
  expandedPreviewDay,
  moveDialogDay,
  getOrderedEntriesForDay,
  getCompletionFactMarkersForDay,
}: {
  focusedDay: string;
  dayPreviewDay: string | null;
  expandedPreviewDay: string | null;
  moveDialogDay: string | null;
  getOrderedEntriesForDay: (day: string | null) => PlannerDayDetailEntry[];
  getCompletionFactMarkersForDay: (
    day: string | null
  ) => PlannerCompletionFactMarker[];
}) {
  const focusedDayEntries = useMemo(
    () => getOrderedEntriesForDay(focusedDay),
    [focusedDay, getOrderedEntriesForDay]
  );
  const focusedDayCompletionFactMarkers = useMemo(
    () => getCompletionFactMarkersForDay(focusedDay),
    [focusedDay, getCompletionFactMarkersForDay]
  );
  const previewDayEntries = useMemo(
    () => getOrderedEntriesForDay(dayPreviewDay),
    [dayPreviewDay, getOrderedEntriesForDay]
  );
  const previewDayCompletionFactMarkers = useMemo(
    () => getCompletionFactMarkersForDay(dayPreviewDay),
    [dayPreviewDay, getCompletionFactMarkersForDay]
  );
  const expandedPreviewEntries = useMemo(
    () => getOrderedEntriesForDay(expandedPreviewDay),
    [expandedPreviewDay, getOrderedEntriesForDay]
  );
  const expandedPreviewCompletionFactMarkers = useMemo(
    () => getCompletionFactMarkersForDay(expandedPreviewDay),
    [expandedPreviewDay, getCompletionFactMarkersForDay]
  );
  const moveDialogEntriesForTargetDay = useMemo(
    () => getOrderedEntriesForDay(moveDialogDay),
    [getOrderedEntriesForDay, moveDialogDay]
  );

  return {
    focusedDayEntries,
    focusedDayCompletionFactMarkers,
    previewDayEntries,
    previewDayCompletionFactMarkers,
    expandedPreviewEntries,
    expandedPreviewCompletionFactMarkers,
    moveDialogEntriesForTargetDay,
  };
}

export function useCalendarSurfaceSelectedEventState({
  selectedEventEntryKey,
  entryByKey,
  effectiveDraftItemEdits,
  draftWindowUnitByEntryKey,
  effectiveSelectedDay,
  linkedTargetIndexes,
}: {
  selectedEventEntryKey: string | null;
  entryByKey: Map<string, PlannerDayDetailEntry>;
  effectiveDraftItemEdits: Record<
    string,
    | {
        scheduledDate?: string | null;
        scheduledTimeOverride?: string | null;
      }
    | undefined
  >;
  draftWindowUnitByEntryKey: Map<string, PlannerWorkUnit>;
  effectiveSelectedDay: string | null;
  linkedTargetIndexes: {
    linksBySourceGoalId: Map<string, PlannerGoalLinkSummary[]>;
  };
}) {
  const selectedEventEntry = selectedEventEntryKey
    ? entryByKey.get(selectedEventEntryKey) ?? null
    : null;
  const selectedEventDraftEdit = selectedEventEntry
    ? effectiveDraftItemEdits[selectedEventEntry.key]
    : undefined;
  const selectedEventBaselineUnit = selectedEventEntry
    ? draftWindowUnitByEntryKey.get(selectedEventEntry.key) ?? null
    : null;
  const selectedEventDraftScheduledDate =
    selectedEventDraftEdit?.scheduledDate ??
    selectedEventEntry?.activeItem?.scheduled_date ??
    effectiveSelectedDay ??
    null;
  const selectedEventDraftTimeInputValue =
    selectedEventDraftEdit?.scheduledTimeOverride === null
      ? ""
      : selectedEventDraftEdit?.scheduledTimeOverride ??
        selectedEventBaselineUnit?.scheduledTimeOverride ??
        "";
  const selectedEventLinkedTargets = useMemo(
    () =>
      selectedEventEntry
        ? linkedTargetIndexes.linksBySourceGoalId.get(
            selectedEventEntry.originalGoalId
          ) ?? []
        : [],
    [linkedTargetIndexes.linksBySourceGoalId, selectedEventEntry]
  );

  return {
    selectedEventEntry,
    selectedEventDraftEdit,
    selectedEventBaselineUnit,
    selectedEventDraftScheduledDate,
    selectedEventDraftTimeInputValue,
    selectedEventLinkedTargets,
  };
}

export function useEffectiveMoveDialogSourceEntryKey({
  moveDialogSourceEntryKey,
  moveDialogSourceOptions,
}: {
  moveDialogSourceEntryKey: string;
  moveDialogSourceOptions: MoveSourceCandidate[];
}) {
  return useMemo(() => {
    if (
      moveDialogSourceEntryKey &&
      moveDialogSourceOptions.some(
        (option) => option.entryKey === moveDialogSourceEntryKey
      )
    ) {
      return moveDialogSourceEntryKey;
    }
    return moveDialogSourceOptions[0]?.entryKey ?? "";
  }, [moveDialogSourceEntryKey, moveDialogSourceOptions]);
}
