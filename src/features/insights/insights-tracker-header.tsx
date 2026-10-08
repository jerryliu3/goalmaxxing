"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-field";
import { InsightsGoalStatsFilters } from "@/features/insights/insights-goal-stats-filters";
import { InsightsPeriodStepper } from "@/features/insights/insights-period-controls";
import { PlannerEndMonthQuickFilterChips } from "@/features/planner/planner-end-month-quick-filter-chips";
import type { HeatmapViewMode } from "@/features/insights/insights-tab";
import { selectProgressPeriodWindow } from "@/features/insights/insights-selectors";
import {
  resolveEffectiveEndMonths,
  type GoalDateSort,
} from "@/lib/goals/list-view";
import type { Goal } from "@/lib/goals/types";

export function InsightsTrackerHeader({
  goals,
  monthCursor,
  onMonthCursorChange,
  perGoalViewMode,
  onPerGoalViewModeChange,
  goalSearchQuery,
  onGoalSearchQueryChange,
  goalEndMonths,
  onGoalEndMonthsChange,
  goalSort,
  onGoalSortChange,
}: {
  goals: Goal[];
  monthCursor: Date;
  onMonthCursorChange: (next: Date) => void;
  perGoalViewMode: HeatmapViewMode;
  onPerGoalViewModeChange: (mode: HeatmapViewMode) => void;
  goalSearchQuery: string;
  onGoalSearchQueryChange: (value: string) => void;
  goalEndMonths: string[];
  onGoalEndMonthsChange: (value: string[]) => void;
  goalSort: GoalDateSort;
  onGoalSortChange: (value: GoalDateSort) => void;
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { start: visiblePeriodStart } = selectProgressPeriodWindow(
    monthCursor,
    perGoalViewMode
  );
  const goalFilterStartMonth = visiblePeriodStart.slice(0, 7);
  const effectiveGoalEndMonths = resolveEffectiveEndMonths(
    goalEndMonths,
    goalFilterStartMonth
  );
  const filtered = effectiveGoalEndMonths.length > 0;

  return (
    <section
      className="border-b border-border pb-4"
      data-onboarding="insights.goal-stats"
      data-testid="insights-tracker-header"
    >
      <div data-title-date-row="true" className="flex flex-wrap items-center justify-between gap-2 pb-3">
        <InsightsGoalStatsFilters
          goals={goals}
          referenceMonth={goalFilterStartMonth}
          endMonths={effectiveGoalEndMonths}
          onEndMonthsChange={onGoalEndMonthsChange}
          sort={goalSort}
          onSortChange={onGoalSortChange}
          viewMode={perGoalViewMode}
          onViewModeChange={onPerGoalViewModeChange}
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
        />
        <InsightsPeriodStepper
          monthCursor={monthCursor}
          onMonthCursorChange={onMonthCursorChange}
          perGoalViewMode={perGoalViewMode}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-round"
          className="relative shrink-0"
          aria-label={filtered ? "Open progress filters (end date filter on)" : "Open progress filters"}
          title="Open progress filters"
          onClick={() => setFiltersOpen(true)}
        >
          <SlidersHorizontal />
          {filtered ? (
            <span data-testid="progress-filters-active" aria-hidden className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary ring-2 ring-card" />
          ) : null}
        </Button>
      </div>
      <div data-search-row="true" className="flex items-center gap-2 [contain:inline-size]">
        <SearchField
          className="min-w-36"
          value={goalSearchQuery}
          onChange={(event) => onGoalSearchQueryChange(event.target.value)}
          placeholder="Search goals"
          aria-label="Search goals"
        />
        <div
          role="group"
          aria-label="Quick end dates"
          className="flex min-w-0 gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <PlannerEndMonthQuickFilterChips
            referenceMonth={goalFilterStartMonth}
            endMonthFilters={effectiveGoalEndMonths}
            onEndMonthFiltersChange={onGoalEndMonthsChange}
            testId="insights-end-date-chips"
          />
        </div>
      </div>
    </section>
  );
}
