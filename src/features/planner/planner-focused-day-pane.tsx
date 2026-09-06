import { format, parse } from "date-fns";
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
import { PlannerDayEntriesPanel } from "@/features/planner/planner-day-entries-panel";
import { PlannerTasksPanel } from "@/features/tasks/planner-tasks-panel";

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
}: PlannerFocusedDayPaneProps) {
  const TitleTag = titleAs;
  return (
    <div className="space-y-3" data-testid="plan-day-pane">
      <div className="border-b border-border pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Day
        </p>
        <TitleTag className="font-display mt-1 text-xl font-semibold tracking-tight">
          {format(parse(day, "yyyy-MM-dd", new Date()), "EEEE, MMM d")}
        </TitleTag>
      </div>
      <PlannerDayEntriesPanel
        day={day}
        entries={entries}
        completionFactMarkers={completionFactMarkers}
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
      />
      {showTasksInsteadOfGoals ? null : (
        <PlanDayUnplannedPanel day={day} placedEntries={entries} />
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
    </div>
  );
}
