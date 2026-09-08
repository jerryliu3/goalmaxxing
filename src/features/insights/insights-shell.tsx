"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { TabOnboardingOverlay } from "@/features/onboarding/tab-onboarding-overlay";
import { DuoLanes } from "@/features/social/duo/duo-lanes";
import { useDuoSurface } from "@/features/social/duo/use-duo-surface";
import {
  InsightsTab,
  type InsightsSharedGoalFilters,
  type HeatmapViewMode,
} from "@/features/insights/insights-tab";
import type { GoalDateSort } from "@/lib/goals/list-view";

export function InsightsShell() {
  const searchParams = useSearchParams();
  const { scope, activePartner, viewer, partner } = useDuoSurface("insights");
  const [monthCursor, setMonthCursor] = useState(new Date());
  const [perGoalViewMode, setPerGoalViewMode] = useState<HeatmapViewMode>("month");
  const [goalSearchQuery, setGoalSearchQuery] = useState("");
  const [goalEndMonths, setGoalEndMonths] = useState<string[]>([]);
  const [goalSort, setGoalSort] = useState<GoalDateSort>("earliest_end");
  const [showHistoricalGoals, setShowHistoricalGoals] = useState(false);
  const sharePeriodControls = scope === "both" && Boolean(activePartner);

  const sharedPeriod = useMemo(
    () =>
      sharePeriodControls
        ? {
            monthCursor,
            onMonthCursorChange: setMonthCursor,
            perGoalViewMode,
            onPerGoalViewModeChange: setPerGoalViewMode,
          }
        : undefined,
    [monthCursor, perGoalViewMode, sharePeriodControls]
  );
  const sharedGoalFilters = useMemo<InsightsSharedGoalFilters | undefined>(
    () =>
      sharePeriodControls
        ? {
            goalSearchQuery,
            setGoalSearchQuery,
            goalEndMonths,
            setGoalEndMonths,
            goalSort,
            setGoalSort,
            showHistoricalGoals,
            setShowHistoricalGoals,
          }
        : undefined,
    [
      goalEndMonths,
      goalSearchQuery,
      goalSort,
      sharePeriodControls,
      showHistoricalGoals,
    ]
  );

  return (
    <div className="space-y-4">
      <TabOnboardingOverlay
        onboardingKey="insights.main"
        forceOpen={searchParams.get("onboarding") === "insights.main"}
      />
      {sharePeriodControls ? (
        <InsightsTab
          sharedPeriod={sharedPeriod}
          sharedGoalFilters={sharedGoalFilters}
          contentMode="goal-stats-only"
        />
      ) : null}
      <DuoLanes
        scope={scope}
        viewer={viewer}
        partner={partner}
        renderLane={(subject) => (
          <InsightsTab
            subjectUserId={subject.userId}
            readOnly={subject.readOnly}
            sharedPeriod={sharedPeriod}
            sharedGoalFilters={sharedGoalFilters}
            contentMode={sharePeriodControls ? "lane" : undefined}
          />
        )}
      />
    </div>
  );
}
