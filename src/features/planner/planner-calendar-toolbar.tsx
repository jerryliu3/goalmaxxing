"use client";

import { CircleHelp, Settings, SlidersHorizontal } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckboxDropdown } from "@/components/ui/checkbox-dropdown";
import { Label } from "@/components/ui/label";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedControl, type SegmentedControlOption } from "@/components/ui/segmented-control";
import { Tooltip } from "@/components/ui/tooltip";
import type { GoalCategoryFilterOption } from "@/features/goals/goal-filters";
import type { PlannerCalendarViewMode } from "@/features/planner/calendar-surface.types";
import { PlannerEndMonthQuickFilterChips } from "@/features/planner/planner-end-month-quick-filter-chips";

// Goal View is the last segment; the calendar views lead.
const PLAN_VIEW_OPTIONS: ReadonlyArray<SegmentedControlOption<PlannerCalendarViewMode | "goals">> = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "goals", label: "Goal View" },
];

interface PlannerCalendarToolbarProps {
  plannerReadOnly: boolean;
  /** Beside the Agenda title: the recovery prompt when sessions slipped. */
  status?: ReactNode;
  loading: boolean;
  viewMode: PlannerCalendarViewMode;
  goalViewOpen: boolean;
  canOpenSettings: boolean;
  searchQuery: string;
  referenceMonth: string;
  endMonthFilters: string[];
  onEndMonthFiltersChange: (months: string[]) => void;
  onViewModeChange: (viewMode: PlannerCalendarViewMode) => void;
  goalIdFilters: string[];
  onGoalIdFiltersChange: (goalIds: string[]) => void;
  /** Empty hides the dropdown (for example while tasks replace goals). */
  goalFilterOptions: GoalCategoryFilterOption[];
  onGoalViewOpenChange: (open: boolean) => void;
  onOpenFilters: () => void;
  onOpenSettings: () => void;
  onSearchQueryChange: (query: string) => void;
}

type PlanViewOption = PlannerCalendarViewMode | "goals";

function PlanViewModeSwitch({
  viewMode,
  goalViewOpen,
  onViewModeChange,
  onGoalViewOpenChange,
}: {
  viewMode: PlannerCalendarViewMode;
  goalViewOpen: boolean;
  onViewModeChange: (viewMode: PlannerCalendarViewMode) => void;
  onGoalViewOpenChange: (open: boolean) => void;
}) {
  const resolvedViewMode = viewMode === "three_day" ? "week" : viewMode;
  // The thumb answers the click on the next frame. The view switches once that
  // frame has painted: re-rendering the planner and building its morph take
  // longer than a frame, and until then the click would show nothing.
  const [pending, setPending] = useState<PlanViewOption | null>(null);
  const latest = useRef<PlanViewOption | null>(null);
  const select = (value: PlanViewOption) => {
    if (value === "goals") {
      onGoalViewOpenChange(true);
      return;
    }
    onGoalViewOpenChange(false);
    onViewModeChange(value);
  };
  return (
    <SegmentedControl
      label="Plan view mode"
      thumbTestId="plan-view-mode-thumb"
      options={PLAN_VIEW_OPTIONS}
      value={pending ?? (goalViewOpen ? "goals" : resolvedViewMode)}
      onChange={(value) => {
        latest.current = value;
        setPending(value);
        requestAnimationFrame(() => setTimeout(() => {
          // Quick successive clicks switch once, to the last one.
          if (latest.current !== value) return;
          latest.current = null;
          setPending(null);
          select(value);
        }));
      }}
    />
  );
}

export function PlannerCalendarToolbar({
  plannerReadOnly,
  status = null,
  loading,
  viewMode,
  goalViewOpen,
  canOpenSettings,
  searchQuery,
  referenceMonth,
  endMonthFilters,
  onEndMonthFiltersChange,
  onViewModeChange,
  goalIdFilters,
  onGoalIdFiltersChange,
  goalFilterOptions,
  onGoalViewOpenChange,
  onOpenFilters,
  onOpenSettings,
  onSearchQueryChange,
}: PlannerCalendarToolbarProps) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div
      className="border-b border-border pb-4"
      data-testid="planner-calendar-toolbar"
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex w-max max-w-full flex-wrap items-center gap-1">
            <h2 className="type-title text-lg tracking-tight">Agenda</h2>
            <Tooltip content="Agenda help" side="top" align="start" className="shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon-round"
                aria-label="Open agenda help"
                title="Agenda help"
                onClick={() => setHelpOpen(true)}
              >
                <CircleHelp />
              </Button>
            </Tooltip>
            {status}
          </div>
          {plannerReadOnly ? (
            <span className="text-xs text-muted-foreground">
              Partner completions (view only)
            </span>
          ) : null}
        </div>
        <div data-onboarding="planner.calendar.controls" className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1">
          <PlanViewModeSwitch
            viewMode={viewMode}
            goalViewOpen={goalViewOpen}
            onViewModeChange={onViewModeChange}
            onGoalViewOpenChange={onGoalViewOpenChange}
          />
          {viewMode !== "day" || goalViewOpen ? <>
            <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-border" />
            <PlannerEndMonthQuickFilterChips
              referenceMonth={referenceMonth}
              endMonthFilters={endMonthFilters}
              onEndMonthFiltersChange={onEndMonthFiltersChange}
            />
          </> : null}
        </div>
        <div className="flex w-full items-center gap-2">
          <SearchField
            id="planner-calendar-search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Filter by goal or milestone name"
            aria-label="Search goals"
            disabled={loading}
          />
          {goalFilterOptions.length > 0 ? (
            <div className="w-28 shrink-0 sm:w-36">
              <Label htmlFor="planner-goal-filter" className="sr-only">
                Filter by goal
              </Label>
              <CheckboxDropdown
                id="planner-goal-filter"
                options={goalFilterOptions}
                selectedValues={goalIdFilters}
                onSelectedValuesChange={onGoalIdFiltersChange}
                placeholder="All goals"
                allLabel="All goals"
                triggerClassName="h-9 rounded-full border-border bg-background px-3.5 text-[13px] hover:border-foreground/40 hover:bg-background"
              />
            </div>
          ) : null}
          <div
            className="flex shrink-0 items-center gap-2"
            data-onboarding="planner.calendar.controls"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon-round"
              aria-label="Filters"
              title="Filters"
              onClick={onOpenFilters}
              disabled={loading}
            >
              <SlidersHorizontal />
            </Button>
            {canOpenSettings ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-round"
                aria-label="Settings"
                title="Settings"
                onClick={onOpenSettings}
                disabled={loading}
              >
                <Settings />
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <Dialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agenda help</DialogTitle>
            <DialogDescription>
              Try scheduling changes on the calendar. Nothing is saved until you press Save plan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <ul className="list-disc space-y-1.5 pl-4 text-muted-foreground">
              <li>Switch between day, week, and month views.</li>
              <li>Drag a session, or open it to change its date and time.</li>
              <li>Save plan or Discard from the bar at the bottom of the calendar.</li>
              <li>Refresh calendar in Settings rebalances unlocked sessions onto open days.</li>
            </ul>
            <Button type="button" variant="outline" size="sm" onClick={() => setHelpOpen(false)}>
              Back to agenda
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
