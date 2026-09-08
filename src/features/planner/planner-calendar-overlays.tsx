"use client";

import type { ReactNode } from "react";
import {
  getEntryGoalFirstTitleWithTime,
  getEntrySubtitle,
  isEntryCredited,
  isEntryImmovableForDraft,
} from "@/features/planner/calendar-format";
import type {
  PlannerCompletionFactMarker,
  PlannerDayDetailEntry,
} from "@/features/planner/calendar-surface.types";
import type { GoalCategoryFilterOption } from "@/features/goals/goal-filters";
import { MoveSessionDialog } from "@/features/planner/move-session-dialog";
import {
  PlannerEventDetailDialog,
  type PlannerEventDetailDialogCallbacks,
} from "@/features/planner/planner-event-detail-dialog";
import { PlannerExpandedPreviewDialog } from "@/features/planner/planner-expanded-preview-dialog";
import { PlannerFiltersDialog } from "@/features/planner/planner-filters-dialog";
import type { MoveSourceCandidate } from "@/features/planner/planner-move-source-options";
import { PlannerSettingsDialog } from "@/features/planner/planner-settings-dialog";
import type { ChecklistFiltersFormProps } from "@/features/today/checklist-filters-dialog";
import type { GoalMonthOption } from "@/lib/goals/list-view";

export interface PlannerCalendarOverlaysProps {
  renderMonthScopedOverlays: boolean;
  expandedPreviewDay: string | null;
  expandedPreviewEntries: PlannerDayDetailEntry[];
  expandedPreviewCompletionFactMarkers: PlannerCompletionFactMarker[];
  mutationLoadingKey: string | null;
  asOfDate: string | null;
  canMutatePlanItems: boolean;
  canMutateEntryOnDay: (entry: PlannerDayDetailEntry, day: string | null) => boolean;
  onExpandedPreviewOpenChange: (open: boolean) => void;
  onExpandedPreviewMoveDay: (day: string) => void;
  onExpandedPreviewContract: () => void;
  onExpandedPreviewEntryOpen: (entryKey: string, day: string) => void;
  onExpandedPreviewToggleCompletion: (
    entry: PlannerDayDetailEntry,
    day: string,
    sourceElement?: HTMLButtonElement
  ) => void;
  onExpandedPreviewEntryPointerStart: (immovable: boolean) => void;
  onExpandedPreviewEntryPointerEnd: () => void;
  moveDialogDay: string | null;
  effectiveMoveDialogSourceEntryKey: string;
  moveDialogSourceOptions: MoveSourceCandidate[];
  onMoveDialogOpenChange: (open: boolean) => void;
  onMoveDialogSourceChange: (entryKey: string) => void;
  onMoveDialogCancel: () => void;
  onMoveDialogSubmit: () => void;
  selectedEventEntry: PlannerDayDetailEntry | null;
  selectedEventLinkedTargets: Array<{
    sourceGoalId: string;
    targetGoalId: string;
    targetSuppressionKind: "none" | "until" | "indefinite";
    targetResumesOn: string | null;
  }>;
  goalTitles: Record<string, string>;
  scopeMonth: string;
  selectedEventDraftEdit:
    | {
        label?: string | null;
        scheduledDate?: string | null;
        scheduledTimeOverride?: string | null;
      }
    | undefined;
  selectedEventBaselineUnit:
    | {
        effectiveScheduledLocalTime?: string | null;
        scheduledTimeOverride?: string | null;
      }
    | null;
  selectedEventDraftScheduledDate: string | null;
  selectedEventDraftTimeInputValue: string;
  canNavigateToFirstOpenInstance: boolean;
  canNavigateToPreviousOpenInstance: boolean;
  canNavigateToNextOpenInstance: boolean;
  canNavigateToLastOpenInstance: boolean;
  eventDetailCallbacks: PlannerEventDetailDialogCallbacks;
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  showTasksInsteadOfGoals: boolean;
  onShowTasksInsteadOfGoalsChange: (value: boolean) => void;
  tasksToggleDisabled?: boolean;
  categoryFilters: string[];
  onCategoryFiltersChange: (value: string[]) => void;
  categoryOptions: GoalCategoryFilterOption[];
  endMonthFilters: string[];
  onEndMonthFiltersChange: (value: string[]) => void;
  endMonthOptions: GoalMonthOption[];
  dayFilters?: ChecklistFiltersFormProps | null;
  settingsOpen: boolean;
  onSettingsOpenChange: (open: boolean) => void;
  plannerSettingsForm: ReactNode;
}

export function PlannerCalendarOverlays({
  renderMonthScopedOverlays,
  expandedPreviewDay,
  expandedPreviewEntries,
  expandedPreviewCompletionFactMarkers,
  mutationLoadingKey,
  asOfDate,
  canMutatePlanItems,
  canMutateEntryOnDay,
  onExpandedPreviewOpenChange,
  onExpandedPreviewMoveDay,
  onExpandedPreviewContract,
  onExpandedPreviewEntryOpen,
  onExpandedPreviewToggleCompletion,
  onExpandedPreviewEntryPointerStart,
  onExpandedPreviewEntryPointerEnd,
  moveDialogDay,
  effectiveMoveDialogSourceEntryKey,
  moveDialogSourceOptions,
  onMoveDialogOpenChange,
  onMoveDialogSourceChange,
  onMoveDialogCancel,
  onMoveDialogSubmit,
  selectedEventEntry,
  selectedEventLinkedTargets,
  goalTitles,
  scopeMonth,
  selectedEventDraftEdit,
  selectedEventBaselineUnit,
  selectedEventDraftScheduledDate,
  selectedEventDraftTimeInputValue,
  canNavigateToFirstOpenInstance,
  canNavigateToPreviousOpenInstance,
  canNavigateToNextOpenInstance,
  canNavigateToLastOpenInstance,
  eventDetailCallbacks,
  filtersOpen,
  onFiltersOpenChange,
  showTasksInsteadOfGoals,
  onShowTasksInsteadOfGoalsChange,
  tasksToggleDisabled = false,
  categoryFilters,
  onCategoryFiltersChange,
  categoryOptions,
  endMonthFilters,
  onEndMonthFiltersChange,
  endMonthOptions,
  dayFilters = null,
  settingsOpen,
  onSettingsOpenChange,
  plannerSettingsForm,
}: PlannerCalendarOverlaysProps) {
  return (
    <>
      {renderMonthScopedOverlays ? (
        <>
          <PlannerExpandedPreviewDialog
            expandedPreviewDay={expandedPreviewDay}
            entries={expandedPreviewEntries}
            completionFactMarkers={expandedPreviewCompletionFactMarkers}
            mutationLoading={Boolean(mutationLoadingKey)}
            asOfDate={asOfDate}
            canMutatePlanItems={canMutatePlanItems}
            canMutateEntryOnDay={canMutateEntryOnDay}
            getEntryDisplayTitle={getEntryGoalFirstTitleWithTime}
            getEntrySubtitle={getEntrySubtitle}
            isEntryCredited={isEntryCredited}
            isEntryImmovableForDraft={isEntryImmovableForDraft}
            onOpenChange={onExpandedPreviewOpenChange}
            onMoveDay={onExpandedPreviewMoveDay}
            onContract={onExpandedPreviewContract}
            onEntryOpen={onExpandedPreviewEntryOpen}
            onToggleCompletion={onExpandedPreviewToggleCompletion}
            onEntryPointerStart={onExpandedPreviewEntryPointerStart}
            onEntryPointerEnd={onExpandedPreviewEntryPointerEnd}
          />

          <MoveSessionDialog
            open={Boolean(moveDialogDay)}
            targetDate={moveDialogDay ?? ""}
            selectedSourceEntryKey={effectiveMoveDialogSourceEntryKey}
            sourceOptions={moveDialogSourceOptions.map((option) => ({
              entryKey: option.entryKey,
              sourceDay: option.sourceDay,
              sourceLabel: option.sourceLabel,
            }))}
            onOpenChange={onMoveDialogOpenChange}
            onSourceChange={onMoveDialogSourceChange}
            onCancel={onMoveDialogCancel}
            onSubmit={onMoveDialogSubmit}
            submitDisabled={!effectiveMoveDialogSourceEntryKey}
          />

          <PlannerEventDetailDialog
            selectedEventEntry={selectedEventEntry}
            selectedEventLinkedTargets={selectedEventLinkedTargets}
            goalTitles={goalTitles}
            scopeMonth={scopeMonth}
            selectedEventDraftEdit={selectedEventDraftEdit}
            selectedEventBaselineUnit={selectedEventBaselineUnit}
            selectedEventDraftScheduledDate={selectedEventDraftScheduledDate}
            selectedEventDraftTimeInputValue={selectedEventDraftTimeInputValue}
            mutationLoadingKey={mutationLoadingKey}
            canMutatePlanItems={canMutatePlanItems}
            canNavigateToFirstOpenInstance={canNavigateToFirstOpenInstance}
            canNavigateToPreviousOpenInstance={canNavigateToPreviousOpenInstance}
            canNavigateToNextOpenInstance={canNavigateToNextOpenInstance}
            canNavigateToLastOpenInstance={canNavigateToLastOpenInstance}
            getEntryGoalFirstTitleWithTime={getEntryGoalFirstTitleWithTime}
            callbacks={eventDetailCallbacks}
          />
        </>
      ) : null}

      <PlannerFiltersDialog
        open={filtersOpen}
        onOpenChange={onFiltersOpenChange}
        showTasksInsteadOfGoals={showTasksInsteadOfGoals}
        onShowTasksInsteadOfGoalsChange={onShowTasksInsteadOfGoalsChange}
        tasksToggleDisabled={tasksToggleDisabled}
        categoryFilters={categoryFilters}
        onCategoryFiltersChange={onCategoryFiltersChange}
        categoryOptions={categoryOptions}
        endMonthFilters={endMonthFilters}
        onEndMonthFiltersChange={onEndMonthFiltersChange}
        endMonthOptions={endMonthOptions}
        dayFilters={dayFilters}
      />

      <PlannerSettingsDialog open={settingsOpen} onOpenChange={onSettingsOpenChange}>
        {plannerSettingsForm}
      </PlannerSettingsDialog>
    </>
  );
}
