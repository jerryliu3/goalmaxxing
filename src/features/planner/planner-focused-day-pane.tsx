import { format, parse } from "date-fns";
import { useMemo } from "react";
import {
  getEntryMilestoneFirstTitleWithTime,
  getEntrySubtitle,
  isEntryCredited,
  isEntryImmovableForDraft,
} from "@/features/planner/calendar-format";
import { useCompletionCreditMove } from "@/features/planner/completion-credit-move";
import { planCompletionControlModeForDate } from "@/features/planner/completion-entry-dispatch";
import {
  PlanLedgerCompletionControl,
  type PlanLedgerCompletionMode,
} from "@/features/planner/plan-ledger-completion-control";
import type {
  PlannerCompletionFactMarker,
  PlannerDayDetailEntry,
} from "@/features/planner/calendar-surface.types";
import { PlanDayUnplannedPanel } from "@/features/planner/plan-day-unplanned-panel";
import { PlanDaySection } from "@/features/planner/plan-day-section";
import { CalendarPartnerChip } from "@/features/planner/calendar-partner-chip";
import { DuoLaneIdentity } from "@/features/social/duo/duo-lanes";
import type { DuoLaneSubject } from "@cadence/shared/social/duo";
import { PlannerDayEntriesPanel } from "@/features/planner/planner-day-entries-panel";
import { PlannerTasksPanel, PlannerTasksPrefetch } from "@/features/tasks/planner-tasks-panel";
import { planDayViewTransitionName } from "@/features/planner/plan-view-transition";
import { ChecklistPastPanels } from "@/features/today/checklist-past-panels";
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
  partnerLabel?: string | null;
  viewerSubject?: DuoLaneSubject | null;
  partnerSubject?: DuoLaneSubject | null;
  splitPartnerChecklist?: boolean;
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
  partnerLabel = null,
  viewerSubject = null,
  partnerSubject = null,
  splitPartnerChecklist = false,
}: PlannerFocusedDayPaneProps) {
  const TitleTag = titleAs;
  const creditMove = useCompletionCreditMove();
  const visibleEntries = entries;
  const visibleMarkers = completionFactMarkers;
  const viewerMarkers = useMemo(
    () => visibleMarkers.filter((marker) => marker.owner !== "partner"),
    [visibleMarkers]
  );
  const partnerMarkers = useMemo(
    () => visibleMarkers.filter((marker) => marker.owner === "partner"),
    [visibleMarkers]
  );
  const renderSupplementalGoal = (goal: Goal, options?: { archived?: boolean; key?: string }) => {
    if (!dayChecklist) {
      return null;
    }
    const completed = Boolean(
      dayChecklist.listModel.presentationByGoalId.get(goal.id)?.exactDateCompleted
    );
    const archived = options?.archived ?? false;
    let completionMode: PlanLedgerCompletionMode = planCompletionControlModeForDate({
      currentlyCredited: completed,
      selectedDate: day,
      asOfDate,
    });
    if (
      completionMode === "toggle" &&
      !completed &&
      !archived &&
      creditMove?.goalRequiresMove(goal.id, day)
    ) {
      completionMode = "move";
    }
    return (
      <div
        key={options?.key ?? goal.id}
        className="flex items-center gap-3 py-3"
        data-plan-work-row="ledger"
      >
        <PlanLedgerCompletionControl
          completed={completed}
          pending={dayChecklist.savingGoalId === goal.id}
          mode={completionMode}
          label={goal.title}
          disabled={archived}
          onToggle={(sourceElement) => {
            void dayChecklist.toggleCompletion(goal, sourceElement);
          }}
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
      <div
        className={
          splitPartnerChecklist
            ? "md:grid md:grid-cols-2 md:items-start md:gap-8"
            : undefined
        }
      >
        <div
          className="space-y-3"
          data-testid={splitPartnerChecklist ? "plan-day-viewer-checklist" : undefined}
        >
          {splitPartnerChecklist && viewerSubject ? (
            <DuoLaneIdentity subject={viewerSubject} className="mb-1 px-0" />
          ) : null}
          <PlanDaySection
            key={`${day}-planned`}
            title="Scheduled goals"
            count={
              visibleEntries.length +
              (splitPartnerChecklist ? viewerMarkers.length : visibleMarkers.length)
            }
          >
            <PlannerDayEntriesPanel
              day={day}
              entries={visibleEntries}
              completionFactMarkers={
                splitPartnerChecklist ? viewerMarkers : visibleMarkers
              }
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
              shareEntryTransition={shareDayTransition}
            />
            {splitPartnerChecklist
              ? partnerMarkers.map((marker) => (
                  <div key={`mobile-partner-${marker.key}`} className="md:hidden">
                    <CalendarPartnerChip
                      title={marker.goalTitle}
                      completed
                      density="expanded"
                      description="Partner marked this done."
                    />
                  </div>
                ))
              : null}
          </PlanDaySection>
          {showTasksInsteadOfGoals ? null : (
            <PlanDaySection key={`${day}-unplanned`} title="Unscheduled goals" defaultOpen={false}>
              <PlanDayUnplannedPanel
                day={day}
                placedEntries={visibleEntries}
                checklist={dayChecklist}
              />
            </PlanDaySection>
          )}
          {showTasksInsteadOfGoals ? null : (
            <>
              <PlannerTasksPrefetch scheduledDate={day} />
              <PlanDaySection key={`${day}-todos`} title="Todos" defaultOpen={false}>
                <PlannerTasksPanel
                  key={day}
                  title="Todos"
                  description={null}
                  scheduledDate={day}
                  asOfDate={asOfDate}
                  allowCreate
                  hideWhenEmpty={false}
                  chrome="plain"
                />
              </PlanDaySection>
            </>
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
        {splitPartnerChecklist ? (
          <div
            className="hidden min-w-0 md:block"
            data-testid="plan-day-partner-checklist"
          >
            <div className="mb-3">
              {partnerSubject ? (
                <DuoLaneIdentity subject={partnerSubject} className="px-0" />
              ) : (
                <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {partnerLabel ?? "Partner"}
                </p>
              )}
            </div>
            <PlanDaySection
              key={`${day}-partner-planned`}
              title="Scheduled goals"
              count={partnerMarkers.length}
            >
              {partnerMarkers.length > 0 ? (
                partnerMarkers.map((marker) => (
                  <CalendarPartnerChip
                    key={`desktop-partner-${marker.key}`}
                    title={marker.goalTitle}
                    completed
                    density="expanded"
                    description="Partner marked this done."
                  />
                ))
              ) : (
                <p className="py-3 text-sm text-muted-foreground">
                  No partner goals this day.
                </p>
              )}
            </PlanDaySection>
          </div>
        ) : null}
      </div>
    </div>
  );
}
