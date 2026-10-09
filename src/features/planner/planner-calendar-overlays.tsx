"use client";

import type { PlannerGoalLinkSummary } from "@cadence/shared/planner/context";

import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";

import type { ReactNode } from "react";
import {
  getEntryGoalFirstTitleWithTime,
  getEntrySubtitle,
  isEntryCredited,
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
import type { ChecklistGoalPresentation } from "@/lib/goals/checklist-presentation";
import type { GoalMonthOption } from "@/lib/goals/list-view";
import type { Goal } from "@/lib/goals/types";
import type { OptimisticCompletionFacts } from "@/lib/planner/optimistic-completion-facts";

export interface PlannerCalendarOverlaysProps {
  renderMonthScopedOverlays: boolean;
  expandedPreviewDay: string | null;
  expandedPreviewEntries: PlannerDayDetailEntry[];
  expandedPreviewCompletionFactMarkers: PlannerCompletionFactMarker[];
  mutationLoadingKey: string | null;
  optimisticCompletionFacts?: OptimisticCompletionFacts;
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
  selectedEventLinkedTargets: PlannerGoalLinkSummary[];
  selectedEventGoal: Goal | null;
  selectedEventPresentation: ChecklistGoalPresentation | null;
  selectedEventProgress?: ProgressContextSummary | null;
  goalTitles: Record<string, string>;
  selectedEventBaselineUnit:
    | {
        effectiveScheduledLocalTime?: string | null;
      }
    | null;
  selectedEventDraftScheduledDate: string | null;
  selectedEventDraftTimeInputValue: string;
  canNavigateToFirstOpenInstance: boolean;
  canNavigateToPreviousOpenInstance: boolean;
  canNavigateToNextOpenInstance: boolean;
  canNavigateToLastOpenInstance: boolean;
  eventDetailCallbacks: PlannerEventDetailDialogCallbacks;
  /** Goal View has no checklist row to unfold in, so session details pop up. */
  eventDetailPresentation?: "inline" | "popup";
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  hideTasks: boolean;
  onHideTasksChange: (value: boolean) => void;
  tasksToggleDisabled?: boolean;
  showTasksToggle?: boolean;
  categoryFilters: string[];
  onCategoryFiltersChange: (value: string[]) => void;
  categoryOptions: GoalCategoryFilterOption[];
  endMonthFilters: string[];
  onEndMonthFiltersChange: (value: string[]) => void;
  endMonthOptions: GoalMonthOption[];
  showCompletedGoals?: boolean;
  onShowCompletedGoalsChange?: (value: boolean) => void;
  hideLinkedParents?: boolean;
  onHideLinkedParentsChange?: (value: boolean) => void;
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
  optimisticCompletionFacts,
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
  selectedEventGoal,
  selectedEventPresentation,
  selectedEventProgress,
  goalTitles,
  selectedEventBaselineUnit,
  selectedEventDraftScheduledDate,
  selectedEventDraftTimeInputValue,
  canNavigateToFirstOpenInstance,
  canNavigateToPreviousOpenInstance,
  canNavigateToNextOpenInstance,
  canNavigateToLastOpenInstance,
  eventDetailCallbacks,
  eventDetailPresentation = "inline",
  filtersOpen,
  onFiltersOpenChange,
  hideTasks,
  onHideTasksChange,
  tasksToggleDisabled = false,
  showTasksToggle = true,
  categoryFilters,
  onCategoryFiltersChange,
  categoryOptions,
  endMonthFilters,
  onEndMonthFiltersChange,
  endMonthOptions,
  showCompletedGoals = false,
  onShowCompletedGoalsChange,
  hideLinkedParents = false,
  onHideLinkedParentsChange,
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
            mutationLoadingKey={mutationLoadingKey}
            optimisticCompletionFacts={optimisticCompletionFacts}
            asOfDate={asOfDate}
            canMutatePlanItems={canMutatePlanItems}
            canMutateEntryOnDay={canMutateEntryOnDay}
            getEntryDisplayTitle={getEntryGoalFirstTitleWithTime}
            getEntrySubtitle={getEntrySubtitle}
            isEntryCredited={isEntryCredited}
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
            selectedEventGoal={selectedEventGoal}
            selectedEventPresentation={selectedEventPresentation}
        selectedEventProgress={selectedEventProgress}
            goalTitles={goalTitles}
            selectedEventBaselineUnit={selectedEventBaselineUnit}
            selectedEventDraftScheduledDate={selectedEventDraftScheduledDate}
            selectedEventDraftTimeInputValue={selectedEventDraftTimeInputValue}
            mutationLoadingKey={mutationLoadingKey}
            canMutatePlanItems={canMutatePlanItems}
            canNavigateToFirstOpenInstance={canNavigateToFirstOpenInstance}
            canNavigateToPreviousOpenInstance={canNavigateToPreviousOpenInstance}
            canNavigateToNextOpenInstance={canNavigateToNextOpenInstance}
            canNavigateToLastOpenInstance={canNavigateToLastOpenInstance}
            callbacks={eventDetailCallbacks}
            presentation={eventDetailPresentation}
          />
        </>
      ) : null}

      <PlannerFiltersDialog
        open={filtersOpen}
        onOpenChange={onFiltersOpenChange}
        hideTasks={hideTasks}
        onHideTasksChange={onHideTasksChange}
        tasksToggleDisabled={tasksToggleDisabled}
        showTasksToggle={showTasksToggle}
        categoryFilters={categoryFilters}
        onCategoryFiltersChange={onCategoryFiltersChange}
        categoryOptions={categoryOptions}
        endMonthFilters={endMonthFilters}
        onEndMonthFiltersChange={onEndMonthFiltersChange}
        endMonthOptions={endMonthOptions}
        showCompletedGoals={showCompletedGoals}
        onShowCompletedGoalsChange={onShowCompletedGoalsChange}
        hideLinkedParents={hideLinkedParents}
        onHideLinkedParentsChange={onHideLinkedParentsChange}
        dayFilters={dayFilters}
      />

      <PlannerSettingsDialog open={settingsOpen} onOpenChange={onSettingsOpenChange}>
        {plannerSettingsForm}
      </PlannerSettingsDialog>
    </>
  );
}
