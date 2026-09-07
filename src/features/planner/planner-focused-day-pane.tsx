import { format, parse } from "date-fns";
import { useMemo } from "react";
import { CompletionToggle } from "@/components/ui/completion-toggle";
import {
  getEntryMilestoneFirstTitleWithTime,
  getEntrySubtitle,
  isEntryCredited,
  isEntryImmovableForDraft,
} from "@/features/planner/calendar-format";
import type {
  PlannerCompletionFactMarker,
  PlannerDayDetailEntry,
} from "@/features/planner/calendar-surface.types";
import { PlanDayUnplannedPanel } from "@/features/planner/plan-day-unplanned-panel";
import {
  filterPlannerDayEntries,
  filterPlannerDayMarkers,
} from "@/features/planner/plan-day-filters";
import { PlannerDayEntriesPanel } from "@/features/planner/planner-day-entries-panel";
import { PlannerTasksPanel } from "@/features/tasks/planner-tasks-panel";
import { planDayViewTransitionName } from "@/features/planner/plan-view-transition";
import { ChecklistPastPanels } from "@/features/today/checklist-past-panels";
import { ChecklistQuickFilterChips } from "@/features/today/checklist-quick-filter-chips";
import type { PlanDayChecklistModel } from "@/features/planner/use-plan-day-checklist-model";
import type { Goal } from "@/lib/goals/types";
import { cn } from "@/lib/utils";

interface PlannerFocusedDayPaneProps {
  day: string;
  entries: PlannerDayDetailEntry[];
  completionFactMarkers: PlannerCompletionFactMarker[];
  mutationLoading: boolean;
  asOfDate: string | null;
  canMutatePlanItems: boolean;
  canMutateEntryOnDay: (entry: PlannerDayDetailEntry, day: string | null) => boolean;
  onEntryOpen: (entryKey: string) => void;
  onToggleCompletion: (
    entry: PlannerDayDetailEntry,
    day: string,
    sourceElement?: HTMLButtonElement
  ) => void;
  onEntryPointerStart: (immovable: boolean) => void;
  onEntryPointerEnd: () => void;
  showTasksInsteadOfGoals?: boolean;
  titleAs?: "h2" | "p";
  shareDayTransition?: boolean;
  selectedEntryKey?: string | null;
  dayChecklist?: PlanDayChecklistModel | null;
}

export function PlannerFocusedDayPane({
  day,
  entries,
  completionFactMarkers,
  mutationLoading,
  asOfDate,
  canMutatePlanItems,
  canMutateEntryOnDay,
  onEntryOpen,
  onToggleCompletion,
  onEntryPointerStart,
  onEntryPointerEnd,
  showTasksInsteadOfGoals = false,
  titleAs = "p",
  shareDayTransition = false,
  selectedEntryKey = null,
  dayChecklist = null,
}: PlannerFocusedDayPaneProps) {
  const TitleTag = titleAs;
  const visibleEntries = useMemo(
    () => filterPlannerDayEntries(entries, dayChecklist?.visibleGoalIds ?? null),
    [dayChecklist?.visibleGoalIds, entries]
  );
  const visibleMarkers = useMemo(
    () =>
      filterPlannerDayMarkers(
        completionFactMarkers,
        dayChecklist?.visibleGoalIds ?? null
      ),
    [completionFactMarkers, dayChecklist?.visibleGoalIds]
  );
  const renderSupplementalGoal = (goal: Goal, options?: { archived?: boolean; key?: string }) => {
    if (!dayChecklist) {
      return null;
    }
    const completed = Boolean(
      dayChecklist.listModel.presentationByGoalId.get(goal.id)?.exactDateCompleted
    );
    const archived = options?.archived ?? false;
    return (
      <div
        key={options?.key ?? goal.id}
        className="flex items-center gap-3 py-3"
        data-plan-work-row="ledger"
      >
        <CompletionToggle
          completed={completed}
          pending={dayChecklist.savingGoalId === goal.id}
          size="sm"
          chrome="plain"
          onClick={(event) => {
            if (
              "currentTarget" in event &&
              event.currentTarget instanceof HTMLButtonElement
            ) {
              void dayChecklist.toggleCompletion(goal, event.currentTarget);
            }
          }}
          disabled={archived || dayChecklist.savingGoalId === goal.id}
          aria-label={
            completed ? `Mark ${goal.title} not done` : `Mark ${goal.title} done`
          }
        />
        <p
          className={cn(
            "font-display min-w-0 flex-1 text-base font-medium tracking-tight",
            completed && "line-through"
          )}
        >
          {goal.title}
        </p>
      </div>
    );
  };

  return (
    <div
      className="space-y-3"
      data-testid="plan-day-pane"
      style={
        shareDayTransition
          ? { viewTransitionName: planDayViewTransitionName(day) }
          : undefined
      }
    >
      <div className="border-b border-border pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Day
        </p>
        <TitleTag className="font-display mt-1 text-xl font-semibold tracking-tight">
          {format(parse(day, "yyyy-MM-dd", new Date()), "EEEE, MMM d")}
        </TitleTag>
      </div>
      {dayChecklist && !showTasksInsteadOfGoals ? (
        <ChecklistQuickFilterChips
          testId="plan-day-quick-filters"
          recurrenceFilters={dayChecklist.filters.recurrenceFilters}
          recurrenceQuickFilters={dayChecklist.filters.recurrenceQuickFilters}
          onClearRecurrenceFilters={() =>
            dayChecklist.filters.setRecurrenceFilters([])
          }
          onToggleRecurrenceFilter={dayChecklist.filters.toggleRecurrenceFilter}
          categoryFilters={dayChecklist.filters.categoryFilters}
          quickCategories={dayChecklist.quickCategories}
          onClearCategoryFilters={() => dayChecklist.filters.setCategoryFilters([])}
          onToggleCategoryFilter={dayChecklist.filters.toggleCategoryFilter}
        />
      ) : null}
      <PlannerDayEntriesPanel
        day={day}
        entries={visibleEntries}
        completionFactMarkers={visibleMarkers}
        mutationLoading={mutationLoading}
        asOfDate={asOfDate}
        canMutatePlanItems={canMutatePlanItems}
        canMutateEntryOnDay={canMutateEntryOnDay}
        getEntryDisplayTitle={getEntryMilestoneFirstTitleWithTime}
        getEntrySubtitle={getEntrySubtitle}
        isEntryCredited={isEntryCredited}
        isEntryImmovableForDraft={isEntryImmovableForDraft}
        onEntryOpen={onEntryOpen}
        onToggleCompletion={(entry, selectedDay) => {
          if (!canMutateEntryOnDay(entry, selectedDay)) {
            return;
          }
          onToggleCompletion(entry, selectedDay);
        }}
        onEntryPointerStart={onEntryPointerStart}
        onEntryPointerEnd={onEntryPointerEnd}
        density="expanded"
        includeSourceElement={false}
        selectedEntryKey={selectedEntryKey}
      />
      {showTasksInsteadOfGoals ? null : (
        <PlanDayUnplannedPanel
          day={day}
          placedEntries={visibleEntries}
          checklist={dayChecklist}
        />
      )}
      {showTasksInsteadOfGoals ? null : (
        <PlannerTasksPanel
          key={day}
          title="Tasks"
          description="One-time tasks for this day, separate from recurring goals."
          scheduledDate={day}
          allowCreate
          hideWhenEmpty={false}
        />
      )}
      {dayChecklist &&
      !showTasksInsteadOfGoals &&
      (dayChecklist.filters.showUpcomingGoals ||
        dayChecklist.filters.showEndedGoals ||
        dayChecklist.filters.showArchivedGoals) ? (
        <ChecklistPastPanels
          upcoming={dayChecklist.listModel.upcoming}
          pastGoals={dayChecklist.listModel.pastGoals}
          archivedGoals={dayChecklist.listModel.archivedGoals}
          showUpcoming={dayChecklist.filters.showUpcomingGoals}
          showEnded={dayChecklist.filters.showEndedGoals}
          showArchived={dayChecklist.filters.showArchivedGoals}
          upcomingOpen={dayChecklist.filters.upcomingOpen}
          pastPanelOpen={dayChecklist.filters.pastPanelOpen}
          archiveOpen={dayChecklist.filters.archiveOpen}
          onUpcomingOpenChange={dayChecklist.filters.setUpcomingOpen}
          onPastPanelOpenChange={dayChecklist.filters.setPastPanelOpen}
          onArchiveOpenChange={dayChecklist.filters.setArchiveOpen}
          renderGoal={renderSupplementalGoal}
        />
      ) : null}
    </div>
  );
}
