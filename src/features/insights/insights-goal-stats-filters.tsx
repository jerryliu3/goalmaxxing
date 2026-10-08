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
  open,
  onOpenChange,
}: InsightsGoalStatsFiltersProps) {
  return (
    <>
      <div data-testid="insights-quick-filters" className="flex shrink-0 items-center">
        <SegmentedControl
          label="Progress period"
          options={PERIOD_OPTIONS}
          value={viewMode}
          onChange={onViewModeChange}
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
              Only goals overlapping the displayed period appear. Refine them by end date or sort order.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[min(24rem,calc(85vh-8rem))] overflow-y-auto overflow-x-visible pr-0.5">
            <GoalListControls
              goals={goals}
              referenceMonth={referenceMonth}
              endMonths={endMonths}
              onEndMonthsChange={onEndMonthsChange}
              sort={sort}
              onSortChange={onSortChange}
              className="grid grid-cols-2 gap-3 [&>div]:min-w-0 [&>div]:w-full [&_[role=combobox]]:w-full"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
