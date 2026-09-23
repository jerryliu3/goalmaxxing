"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GoalListControls } from "@/features/goals/goal-list-controls";
import type { HeatmapViewMode } from "@/features/insights/insights-tab";
import { toggleExclusiveSelection } from "@/lib/filters/toggle-exclusive-selection";
import { buildQuickEndDateChipOptions } from "@/lib/filters/quick-end-date-chips";
import type { GoalDateSort } from "@/lib/goals/list-view";
import type { Goal } from "@/lib/goals/types";

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
  const quickEndMonths = useMemo(
    () => buildQuickEndDateChipOptions(referenceMonth),
    [referenceMonth]
  );

  return (
    <>
      <div
        data-testid="insights-quick-filters"
        className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1"
      >
        {(["month", "year"] as const).map((mode) => (
          <Button
            key={mode}
            aria-pressed={viewMode === mode}
            type="button"
            variant={viewMode === mode ? "secondary" : "outline"}
            size="sm"
            className="h-8 shrink-0 rounded-full px-3 text-xs"
            onClick={() => onViewModeChange(mode)}
          >
            {mode === "month" ? "Month View" : "Year View"}
          </Button>
        ))}
        {quickEndMonths.map((option) => (
          <Button
            key={option.key}
            aria-pressed={option.value === null ? endMonths.length === 0 : endMonths.includes(option.value)}
            type="button"
            variant={
              option.value === null
                ? endMonths.length === 0
                  ? "secondary"
                  : "outline"
                : endMonths.includes(option.value)
                  ? "secondary"
                  : "outline"
            }
            size="sm"
            className="h-8 shrink-0 rounded-full px-3 text-xs"
            onClick={() => {
              if (option.value === null) {
                onEndMonthsChange([]);
                return;
              }
              onEndMonthsChange(toggleExclusiveSelection(endMonths, option.value));
            }}
          >
            {option.label}
          </Button>
        ))}
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
                className="size-4 rounded border-input accent-secondary"
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
