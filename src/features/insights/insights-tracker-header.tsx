"use client";

import { format, startOfMonth, startOfYear } from "date-fns";
import { SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-field";
import { InsightsGoalStatsFilters } from "@/features/insights/insights-goal-stats-filters";
import { InsightsPeriodStepper } from "@/features/insights/insights-period-controls";
import type { HeatmapViewMode } from "@/features/insights/insights-tab";
import {
  selectSearchedGoals,
  selectVisiblePerGoalHeatmaps,
} from "@/features/insights/insights-selectors";
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
  showHistoricalGoals,
  onShowHistoricalGoalsChange,
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
  showHistoricalGoals: boolean;
  onShowHistoricalGoalsChange: (value: boolean) => void;
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const visiblePeriodStart = format(
    perGoalViewMode === "month" ? startOfMonth(monthCursor) : startOfYear(monthCursor),
    "yyyy-MM-dd"
  );
  const goalFilterStartMonth = visiblePeriodStart.slice(0, 7);
  const effectiveGoalEndMonths = resolveEffectiveEndMonths(
    goalEndMonths,
    goalFilterStartMonth
  );
  const searchedGoals = useMemo(
    () => selectSearchedGoals(goals, goalSearchQuery),
    [goalSearchQuery, goals]
  );
  const { historicalGoals } = useMemo(
    () =>
      selectVisiblePerGoalHeatmaps({
        goals: searchedGoals,
        visiblePeriodStart,
        endMonths: effectiveGoalEndMonths,
        showHistoricalGoals,
        sort: goalSort,
      }),
    [
      effectiveGoalEndMonths,
      goalSort,
      searchedGoals,
      showHistoricalGoals,
      visiblePeriodStart,
    ]
  );

  return (
    <section
      className="border-b border-border pb-4"
      data-onboarding="insights.goal-stats"
      data-testid="insights-tracker-header"
    >
      <div data-title-date-row="true" className="flex items-center justify-center gap-2 pb-3">
        <InsightsPeriodStepper
          monthCursor={monthCursor}
          onMonthCursorChange={onMonthCursorChange}
          perGoalViewMode={perGoalViewMode}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-round"
          className="shrink-0"
          aria-label="Open progress filters"
          title="Open progress filters"
          onClick={() => setFiltersOpen(true)}
        >
          <SlidersHorizontal />
        </Button>
      </div>
      <div className="space-y-3">
        <InsightsGoalStatsFilters
          goals={goals}
          referenceMonth={goalFilterStartMonth}
          endMonths={effectiveGoalEndMonths}
          onEndMonthsChange={onGoalEndMonthsChange}
          sort={goalSort}
          onSortChange={onGoalSortChange}
          viewMode={perGoalViewMode}
          onViewModeChange={onPerGoalViewModeChange}
          showEndedGoals={showHistoricalGoals}
          endedGoalCount={historicalGoals.length}
          onShowEndedGoalsChange={onShowHistoricalGoalsChange}
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
        />
        <SearchField
          value={goalSearchQuery}
          onChange={(event) => onGoalSearchQueryChange(event.target.value)}
          placeholder="Search goals"
          aria-label="Search goals"
        />
      </div>
    </section>
  );
}
