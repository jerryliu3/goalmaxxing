import { format, parse } from "date-fns";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  getEntryMilestoneFirstTitleWithTime,
  getEntrySubtitle,
  isEntryCredited,
  isEntryImmovableForDraft,
} from "@/features/planner/calendar-format";
import { useCompletionCreditMove } from "@/features/planner/completion-credit-move";
import { planUnscheduledLedgerControlMode } from "@/features/planner/completion-entry-dispatch";
import {
  PlanLedgerCompletionControl,
  type PlanLedgerCompletionMode,
} from "@/features/planner/plan-ledger-completion-control";
import type {
  PlannerCompletionFactMarker,
  PlannerDayDetailEntry,
} from "@/features/planner/calendar-surface.types";
import { PlanDayUnplannedPanel } from "@/features/planner/plan-day-unplanned-panel";
import { partitionDayEntriesByCompletion, partitionUnplannedGoalsByCompletion } from "@/features/planner/plan-day-completed";
import {
  placedGoalIdsForDay,
  selectVisibleUnplannedGoals,
} from "@/features/planner/plan-day-unplanned";
import { PlanDaySection } from "@/features/planner/plan-day-section";
import { CalendarPartnerChip } from "@/features/planner/calendar-partner-chip";
import { DuoLaneIdentity } from "@/features/social/duo/duo-lanes";
import type { DuoLaneSubject } from "@cadence/shared/social/duo";
import { PlannerDayEntriesPanel } from "@/features/planner/planner-day-entries-panel";
import { PlannerTasksPanel, PlannerTasksPrefetch } from "@/features/tasks/planner-tasks-panel";
import {
  planAgendaDayNumberClass,
  planLedgerTitleClass,
} from "@/features/planner/calendar-day-chrome";
import { PLAN_MORPH_CLASS, planDayViewTransitionName } from "@/features/planner/plan-view-transition";
import { ChecklistPastPanels } from "@/features/today/checklist-past-panels";
import type { PlanDayChecklistModel } from "@/features/planner/use-plan-day-checklist-model";
import type { Goal } from "@/lib/goals/types";
import type { OptimisticCompletionFacts } from "@/lib/planner/optimistic-completion-facts";
import { CompletionTitle } from "@/components/ui/completion-title";
import { cn } from "@/lib/utils";

interface PlannerFocusedDayPaneProps {
  day: string;
  entries: PlannerDayDetailEntry[];
  completionFactMarkers: PlannerCompletionFactMarker[];
  mutationLoadingKey: string | null;
  optimisticCompletionFacts?: OptimisticCompletionFacts;
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
  showDayHeading?: boolean;
  shareDayTransition?: boolean;
  selectedEntryKey?: string | null;
  dayChecklist?: PlanDayChecklistModel | null;
  partnerLabel?: string | null;
  viewerSubject?: DuoLaneSubject | null;
  partnerSubject?: DuoLaneSubject | null;
  splitPartnerChecklist?: boolean;
  onConfirmDraftMove?: (entry: PlannerDayDetailEntry, day: string) => void;
  onCancelDraftMove?: (entry: PlannerDayDetailEntry, day: string) => void;
}

export function PlannerFocusedDayPane({
  day,
  entries,
  completionFactMarkers,
  mutationLoadingKey,
  optimisticCompletionFacts,
  asOfDate,
  canMutatePlanItems,
  canMutateEntryOnDay,
  onEntryOpen,
  onToggleCompletion,
  onEntryPointerStart,
  onEntryPointerEnd,
  showTasksInsteadOfGoals = false,
  titleAs = "p",
  showDayHeading = true,
  shareDayTransition = false,
  selectedEntryKey = null,
  dayChecklist = null,
  partnerLabel = null,
  viewerSubject = null,
  partnerSubject = null,
  splitPartnerChecklist = false,
  onConfirmDraftMove,
  onCancelDraftMove,
}: PlannerFocusedDayPaneProps) {
  const TitleTag = titleAs;
  const creditMove = useCompletionCreditMove();
  const [todoCount, setTodoCount] = useState(0);
  const visibleEntries = entries;
  // Credited sessions move under Completed so the open list stays the work that
  // still needs doing.
  const { open: openEntries, completed: completedEntries } = useMemo(
    () =>
      partitionDayEntriesByCompletion({
        entries: visibleEntries,
        day,
        optimisticCompletionFacts,
      }),
    [day, optimisticCompletionFacts, visibleEntries]
  );
  const unscheduledCounts = useMemo(() => {
    if (!dayChecklist || showTasksInsteadOfGoals) {
      return { open: 0, completed: 0 };
    }
    if (dayChecklist.loading && (dayChecklist.data?.goals.length ?? 0) === 0) {
      return { open: 0, completed: 0 };
    }
    const unplanned = selectVisibleUnplannedGoals({
      goals: dayChecklist.listModel.completableGoals ?? [],
      placedGoalIds: placedGoalIdsForDay(visibleEntries),
      viewDate: day,
      visibleGoalIds: dayChecklist.visibleGoalIds,
    });
    const { open, completed } = partitionUnplannedGoalsByCompletion({
      goals: unplanned,
      presentationByGoalId: dayChecklist.listModel.presentationByGoalId,
    });
    return { open: open.length, completed: completed.length };
  }, [day, dayChecklist, showTasksInsteadOfGoals, visibleEntries]);
  const visibleMarkers = completionFactMarkers;
  const viewerMarkers = useMemo(
    () => visibleMarkers.filter((marker) => marker.owner !== "partner"),
    [visibleMarkers]
  );
  const partnerMarkers = useMemo(
    () => visibleMarkers.filter((marker) => marker.owner === "partner"),
    [visibleMarkers]
  );
  // A completion fact marker is credit earned somewhere other than this day's
  // plan, so it belongs under Completed by definition. The partner column keeps
  // its own markers in the duo split.
  const completedMarkers = splitPartnerChecklist ? viewerMarkers : visibleMarkers;
  const completedCount =
    completedEntries.length + completedMarkers.length + unscheduledCounts.completed;
  const renderSupplementalGoal = (goal: Goal, options?: { archived?: boolean; key?: string }) => {
    if (!dayChecklist) {
      return null;
    }
    const completed = Boolean(
      dayChecklist.listModel.presentationByGoalId.get(goal.id)?.exactDateCompleted
    );
    const archived = options?.archived ?? false;
    const completionMode: PlanLedgerCompletionMode = planUnscheduledLedgerControlMode({
      currentlyCredited: completed,
      selectedDate: day,
      asOfDate,
      canMoveScheduledSession: Boolean(
        !completed && !archived && creditMove?.goalRequiresMove(goal.id, day)
      ),
    });
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
        <Link
          href={`/goals/${goal.id}`}
          className={cn(planLedgerTitleClass, "min-w-0 flex-1 hover:underline")}
        >
          <CompletionTitle completed={completed}>{goal.title}</CompletionTitle>
        </Link>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "space-y-3",
        // The split aside gets its own scroller from `md:` up so the calendar
        // stays put beside it. On phones that nesting traps the gesture, so the
        // checklist grows into the page scroll the way day view already does.
        !shareDayTransition &&
          "overflow-x-hidden md:max-h-[min(70dvh,calc(100dvh-8rem))] md:overflow-y-auto md:overscroll-y-contain md:[touch-action:pan-y] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        // Carries the week row's selected-day ring into day view so the emphasis is
        // continuous through the morph instead of dropping at the end.
        shareDayTransition &&
          cn(PLAN_MORPH_CLASS, "min-h-[34rem] rounded-[10px] p-3 ring-2 ring-inset ring-primary")
      )}
      data-testid="plan-day-pane"
      data-plan-day={day}
      style={
        shareDayTransition
          ? {
              viewTransitionName: planDayViewTransitionName(day),
              minHeight: "max(34rem, var(--plan-day-canvas-height, 0px))",
            }
          : undefined
      }
    >
      {showDayHeading ? (
        <div className="border-b border-border pb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Day
          </p>
          <TitleTag className="font-display mt-1 text-xl font-semibold tracking-tight">
            {format(parse(day, "yyyy-MM-dd", new Date()), "EEEE, MMM d")}
          </TitleTag>
        </div>
      ) : null}
      {/*
        Mirrors the week row's weekday/number treatment so the day view is a real
        endpoint for the morph rather than a synthesised one, and gives the focused
        day the same date affordance the zoom concept shows at its day level.
      */}
      {shareDayTransition ? (
        <div className="w-14 shrink-0 px-1">
          <span
            data-plan-weekday="true"
            className="block font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
          >
            {format(parse(day, "yyyy-MM-dd", new Date()), "EEE")}
          </span>
          <span
            data-plan-day-number="true"
            className={cn(
              "font-display",
              planAgendaDayNumberClass({
                isToday: asOfDate === day,
                isSelected: true,
              })
            )}
          >
            {format(parse(day, "yyyy-MM-dd", new Date()), "d")}
          </span>
        </div>
      ) : null}
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
            count={openEntries.length}
          >
            <PlannerDayEntriesPanel
              day={day}
              entries={openEntries}
              completionFactMarkers={[]}
              mutationLoadingKey={mutationLoadingKey}
              optimisticCompletionFacts={optimisticCompletionFacts}
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
              emptyMessage={
                completedEntries.length > 0
                  ? "Everything scheduled is done."
                  : "No planned sessions."
              }
              onConfirmDraftMove={onConfirmDraftMove}
              onCancelDraftMove={onCancelDraftMove}
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
            <PlanDaySection
              key={`${day}-unplanned`}
              title="Unscheduled goals"
              count={unscheduledCounts.open}
              defaultOpen={false}
            >
              <PlanDayUnplannedPanel
                day={day}
                placedEntries={visibleEntries}
                checklist={dayChecklist}
                filter="open"
              />
            </PlanDaySection>
          )}
          {showTasksInsteadOfGoals ? null : (
            <>
              <PlannerTasksPrefetch scheduledDate={day} onCountChange={setTodoCount} />
              <PlanDaySection key={`${day}-todos`} title="Todos" count={todoCount} defaultOpen={false}>
                <PlannerTasksPanel
                  key={day}
                  title="Todos"
                  description={null}
                  scheduledDate={day}
                  asOfDate={asOfDate}
                  allowCreate
                  hideWhenEmpty={false}
                  chrome="plain"
                  onCountChange={setTodoCount}
                />
              </PlanDaySection>
            </>
          )}
          {completedCount > 0 ? (
            <PlanDaySection
              key={`${day}-completed`}
              title="Completed"
              count={completedCount}
              defaultOpen={false}
            >
              {completedEntries.length > 0 || completedMarkers.length > 0 ? (
                <PlannerDayEntriesPanel
                  day={day}
                  entries={completedEntries}
                  completionFactMarkers={completedMarkers}
                  mutationLoadingKey={mutationLoadingKey}
                  optimisticCompletionFacts={optimisticCompletionFacts}
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
              ) : null}
              {/* Only with a checklist model in hand: without one the panel
                  fetches its own, and a second copy here would mean two reads
                  of the same day and two independent optimistic states. */}
              {showTasksInsteadOfGoals || !dayChecklist ? null : (
                <PlanDayUnplannedPanel
                  day={day}
                  placedEntries={visibleEntries}
                  checklist={dayChecklist}
                  filter="completed"
                />
              )}
            </PlanDaySection>
          ) : null}
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
