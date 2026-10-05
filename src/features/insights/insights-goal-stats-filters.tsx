"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { GoalListControls } from "@/features/goals/goal-list-controls";
import { PlannerEndMonthQuickFilterChips } from "@/features/planner/planner-end-month-quick-filter-chips";
import type { HeatmapViewMode } from "@/features/insights/insights-tab";
import type { GoalDateSort } from "@/lib/goals/list-view";
import type { Goal } from "@/lib/goals/types";

const PERIOD_OPTIONS = [
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
] as const satisfies ReadonlyArray<{ value: HeatmapViewMode; label: string }>;

interface InsightsGoalStatsFiltersProps {
  goals: Goal[];
  referenceMonth: string;
  endMonths: string[];
  onEndMonthsChange: (months: string[]) => void;
  sort: GoalDateSort;
  onSortChange: (sort: GoalDateSort) => void;
  viewMode: HeatmapViewMode;
  onViewModeChange: (mode: HeatmapViewMode) => void;
  showEndedGoals: boolean;
  endedGoalCount: number;
  onShowEndedGoalsChange: (show: boolean) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InsightsGoalStatsFilters({
  goals,
  referenceMonth,
  endMonths,
  onEndMonthsChange,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  showEndedGoals,
  endedGoalCount,
  onShowEndedGoalsChange,
  open,
  onOpenChange,
}: InsightsGoalStatsFiltersProps) {
  return (
    <>
      <div
        data-testid="insights-quick-filters"
        className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1"
      >
        <SegmentedControl
          label="Progress period"
          options={PERIOD_OPTIONS}
          value={viewMode}
          onChange={onViewModeChange}
        />
        <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-border" />
        <PlannerEndMonthQuickFilterChips
          referenceMonth={referenceMonth}
          endMonthFilters={endMonths}
          onEndMonthFiltersChange={onEndMonthsChange}
          testId="insights-end-date-chips"
        />
      </div>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          onOpenAutoFocus={(event) => {
            event.preventDefault();
          }}
          className="max-h-[85vh] max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>Progress filters</DialogTitle>
            <DialogDescription>
              Refine which goal statistics are shown.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[min(24rem,calc(85vh-8rem))] space-y-4 overflow-y-auto overflow-x-visible pr-0.5">
            <GoalListControls
              goals={goals}
              referenceMonth={referenceMonth}
              endMonths={endMonths}
              onEndMonthsChange={onEndMonthsChange}
              sort={sort}
              onSortChange={onSortChange}
              className="grid grid-cols-2 gap-3 [&>div]:min-w-0 [&>div]:w-full [&_[role=combobox]]:w-full"
            />
            <label
              className={`flex min-h-8 items-center gap-2 text-sm ${
                endedGoalCount === 0 ? "text-muted-foreground opacity-60" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={showEndedGoals}
                disabled={endedGoalCount === 0}
                onChange={(event) => onShowEndedGoalsChange(event.target.checked)}
                className="size-4 rounded border-input accent-primary"
              />
              Show past goals
              <span>({endedGoalCount})</span>
            </label>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
