"use client";

import { CalendarDayPreviewList } from "@/features/planner/calendar-day-preview-list";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";
import type { PlannerCompletionFactMarker } from "@/features/planner/calendar-surface.types";
import { getPlannerCompletionTogglePresentation } from "@/features/planner/completion-entry-dispatch";

interface PlannerDayEntriesPanelProps {
  day: string;
  entries: PlannerDayDetailEntry[];
  completionFactMarkers: PlannerCompletionFactMarker[];
  mutationLoading: boolean;
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
  includeSourceElement?: boolean;
  selectedEntryKey?: string | null;
  shareEntryTransition?: boolean;
}

export function PlannerDayEntriesPanel({
  day,
  entries,
  completionFactMarkers,
  mutationLoading,
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
  includeSourceElement = true,
  selectedEntryKey = null,
  shareEntryTransition = false,
}: PlannerDayEntriesPanelProps) {
  return (
    <CalendarDayPreviewList
      day={day}
      entries={entries}
      completionFactMarkers={completionFactMarkers}
      mutationLoading={mutationLoading}
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
      onToggleCompletion={(entry, selectedDay, sourceElement) =>
        includeSourceElement
          ? onToggleCompletion(entry, selectedDay, sourceElement)
          : onToggleCompletion(entry, selectedDay)
      }
      onEntryPointerStart={onEntryPointerStart}
      onEntryPointerEnd={onEntryPointerEnd}
      density={density}
      selectedEntryKey={selectedEntryKey}
      shareEntryTransition={shareEntryTransition}
    />
  );
}
