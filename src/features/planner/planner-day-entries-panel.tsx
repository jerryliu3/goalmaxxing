"use client";

import { CalendarDayPreviewList } from "@/features/planner/calendar-day-preview-list";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";
import type { PlannerCompletionFactMarker } from "@/features/planner/calendar-surface.types";
import { getPlannerCompletionTogglePresentation } from "@/features/planner/completion-entry-dispatch";
import type { OptimisticCompletionFacts } from "@/lib/planner/optimistic-completion-facts";

interface PlannerDayEntriesPanelProps {
  day: string;
  entries: PlannerDayDetailEntry[];
  completionFactMarkers: PlannerCompletionFactMarker[];
  mutationLoadingKey: string | null;
  optimisticCompletionFacts?: OptimisticCompletionFacts;
  asOfDate: string | null;
  canMutatePlanItems: boolean;
  canMutateEntryOnDay: (entry: PlannerDayDetailEntry, day: string | null) => boolean;
  getEntryDisplayTitle: (entry: PlannerDayDetailEntry) => string;
  getEntrySubtitle: (entry: PlannerDayDetailEntry) => string | null;
  isEntryCredited: (entry: PlannerDayDetailEntry) => boolean;
  isEntryImmovableForDraft: (entry: PlannerDayDetailEntry) => boolean;
  onEntryOpen: (entryKey: string) => void;
  onToggleCompletion: (
    entry: PlannerDayDetailEntry,
    day: string,
    sourceElement?: HTMLButtonElement
  ) => void;
  onEntryPointerStart: (immovable: boolean) => void;
  onEntryPointerEnd: () => void;
  density?: "compact" | "expanded";
  selectedEntryKey?: string | null;
  shareEntryTransition?: boolean;
  onConfirmDraftMove?: (entry: PlannerDayDetailEntry, day: string) => void;
  onCancelDraftMove?: (entry: PlannerDayDetailEntry, day: string) => void;
}

export function PlannerDayEntriesPanel({
  day,
  entries,
  completionFactMarkers,
  mutationLoadingKey,
  optimisticCompletionFacts,
  asOfDate,
  canMutatePlanItems,
  canMutateEntryOnDay,
  getEntryDisplayTitle,
  getEntrySubtitle,
  isEntryCredited,
  isEntryImmovableForDraft,
  onEntryOpen,
  onToggleCompletion,
  onEntryPointerStart,
  onEntryPointerEnd,
  density = "compact",
  selectedEntryKey = null,
  shareEntryTransition = false,
  onConfirmDraftMove,
  onCancelDraftMove,
}: PlannerDayEntriesPanelProps) {
  return (
    <CalendarDayPreviewList
      day={day}
      entries={entries}
      completionFactMarkers={completionFactMarkers}
      mutationLoadingKey={mutationLoadingKey}
      optimisticCompletionFacts={optimisticCompletionFacts}
      getEntryDisplayTitle={getEntryDisplayTitle}
      getEntrySubtitle={getEntrySubtitle}
      isEntryCredited={isEntryCredited}
      isEntryImmovableForDraft={(entry) =>
        !canMutateEntryOnDay(entry, day) || isEntryImmovableForDraft(entry)
      }
      getCompletionToggleState={(entry, selectedDay) =>
        getPlannerCompletionTogglePresentation({
          entry,
          selectedDay,
          asOfDate,
          canMutatePlanItems,
          canMutateEntryOnDay,
        })
      }
      onEntryOpen={onEntryOpen}
      onToggleCompletion={onToggleCompletion}
      onEntryPointerStart={onEntryPointerStart}
      onEntryPointerEnd={onEntryPointerEnd}
      density={density}
      selectedEntryKey={selectedEntryKey}
      shareEntryTransition={shareEntryTransition}
      onConfirmDraftMove={onConfirmDraftMove}
      onCancelDraftMove={onCancelDraftMove}
    />
  );
}
