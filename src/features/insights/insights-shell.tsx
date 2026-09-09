"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { TabOnboardingOverlay } from "@/features/onboarding/tab-onboarding-overlay";
import { DuoLanes } from "@/features/social/duo/duo-lanes";
import { useDuoSurface } from "@/features/social/duo/use-duo-surface";
import { CompletionCreditMoveProvider } from "@/features/planner/completion-credit-move";
import {
  InsightsTab,
  type InsightsSharedGoalFilters,
  type HeatmapViewMode,
} from "@/features/insights/insights-tab";
import { InsightsTrackerHeader } from "@/features/insights/insights-tracker-header";
import { unionGoalsById } from "@/features/insights/insights-selectors";
import { invalidatePlannerRelatedTabCaches } from "@/lib/cache/planner-tab-cache";
import type { GoalDateSort } from "@/lib/goals/list-view";
import type { Goal } from "@/lib/goals/types";

export function InsightsShell() {
  const searchParams = useSearchParams();
  const { scope, activePartner, viewer, partner } = useDuoSurface("insights");
  const [monthCursor, setMonthCursor] = useState(new Date());
  const [perGoalViewMode, setPerGoalViewMode] = useState<HeatmapViewMode>("month");
  const [goalSearchQuery, setGoalSearchQuery] = useState("");
  const [goalEndMonths, setGoalEndMonths] = useState<string[]>([]);
  const [goalSort, setGoalSort] = useState<GoalDateSort>("earliest_end");
  const [showHistoricalGoals, setShowHistoricalGoals] = useState(false);
  const [viewerGoals, setViewerGoals] = useState<Goal[]>([]);
  const [partnerGoals, setPartnerGoals] = useState<Goal[]>([]);
  const sharePeriodControls = scope === "both" && Boolean(activePartner);
  const handleViewerGoalsChange = useCallback((goals: Goal[]) => {
    setViewerGoals(goals);
  }, []);
  const handlePartnerGoalsChange = useCallback((goals: Goal[]) => {
    setPartnerGoals(goals);
  }, []);
  const handleCreditMoveSaved = useCallback(() => {
    invalidatePlannerRelatedTabCaches();
  }, []);
  const sharedFilterGoals = useMemo(
    () => unionGoalsById([viewerGoals, partnerGoals]),
    [partnerGoals, viewerGoals]
  );

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
        <InsightsTrackerHeader
          goals={sharedFilterGoals}
          monthCursor={monthCursor}
          onMonthCursorChange={setMonthCursor}
          perGoalViewMode={perGoalViewMode}
          onPerGoalViewModeChange={setPerGoalViewMode}
          goalSearchQuery={goalSearchQuery}
          onGoalSearchQueryChange={setGoalSearchQuery}
          goalEndMonths={goalEndMonths}
          onGoalEndMonthsChange={setGoalEndMonths}
          goalSort={goalSort}
          onGoalSortChange={setGoalSort}
          showHistoricalGoals={showHistoricalGoals}
          onShowHistoricalGoalsChange={setShowHistoricalGoals}
        />
      ) : null}
      <DuoLanes
        scope={scope}
        viewer={viewer}
        partner={partner}
        renderLane={(subject) => (
          <CompletionCreditMoveProvider
            context={null}
            onMoved={handleCreditMoveSaved}
          >
            <InsightsTab
              subjectUserId={subject.userId}
              readOnly={subject.readOnly}
              sharedPeriod={sharedPeriod}
              sharedGoalFilters={sharedGoalFilters}
              contentMode={sharePeriodControls ? "lane" : undefined}
              onPersonalGoalsChange={
                sharePeriodControls
                  ? subject.id === "partner"
                    ? handlePartnerGoalsChange
                    : handleViewerGoalsChange
                  : undefined
              }
            />
          </CompletionCreditMoveProvider>
        )}
      />
    </div>
  );
}
