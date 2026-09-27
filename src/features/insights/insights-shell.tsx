"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { TabOnboardingOverlay } from "@/features/onboarding/tab-onboarding-overlay";
import { DuoLanes } from "@/features/social/duo/duo-lanes";
import { useDuoSurface } from "@/features/social/duo/use-duo-surface";
import { resolveDuoLanes } from "@cadence/shared/social/duo";
import { ProgressOverviewLayout } from "@/features/insights/progress-overview/progress-overview-layout";
import type { ProgressSectionId } from "@/features/insights/progress-overview/progress-view-model";
import {
  InsightsTab,
  type InsightsSharedGoalFilters,
  type HeatmapViewMode,
} from "@/features/insights/insights-tab";
import { InsightsTrackerHeader } from "@/features/insights/insights-tracker-header";
import { unionGoalsById } from "@/features/insights/insights-selectors";
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
  const [sectionIdsByLane, setSectionIdsByLane] = useState<
    Record<string, ProgressSectionId[]>
  >({});
  const sharePeriodControls = scope === "both" && Boolean(activePartner);
  const handleViewerGoalsChange = useCallback((goals: Goal[]) => {
    setViewerGoals(goals);
  }, []);
  const handlePartnerGoalsChange = useCallback((goals: Goal[]) => {
    setPartnerGoals(goals);
  }, []);
  const handleViewerSectionsChange = useCallback((ids: ProgressSectionId[]) => {
    setSectionIdsByLane((current) => ({ ...current, viewer: ids }));
  }, []);
  const handlePartnerSectionsChange = useCallback((ids: ProgressSectionId[]) => {
    setSectionIdsByLane((current) => ({ ...current, partner: ids }));
  }, []);
  const sharedFilterGoals = useMemo(
    () => unionGoalsById([viewerGoals, partnerGoals]),
    [partnerGoals, viewerGoals]
  );
  const lanes = useMemo(
    () => resolveDuoLanes({ scope, viewer, partner }),
    [partner, scope, viewer]
  );
  // The index spans every visible lane, so a section only a partner can show
  // still gets an entry, and a lane that left the page stops contributing.
  const availableSectionIds = useMemo(() => {
    const ids = new Set<ProgressSectionId>();
    for (const lane of lanes) {
      for (const id of sectionIdsByLane[lane.id] ?? []) {
        ids.add(id);
      }
    }
    return [...ids];
  }, [lanes, sectionIdsByLane]);

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
      <ProgressOverviewLayout availableSectionIds={availableSectionIds}>
        {(view) => (
          <div className="space-y-4">
            {/* Shared ledger controls drive the Completion history section in
                both lanes, so they sit above the lanes on the current view. */}
            {sharePeriodControls && view === "current" ? (
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
                <InsightsTab
                    subjectUserId={subject.userId}
                    readOnly={subject.readOnly}
                    sharedPeriod={sharedPeriod}
                    sharedGoalFilters={sharedGoalFilters}
                    contentMode={sharePeriodControls ? "lane" : undefined}
                    progressView={view}
                    anchorSections={subject.id === lanes[0]?.id}
                    onSectionsChange={
                      subject.id === "partner"
                        ? handlePartnerSectionsChange
                        : handleViewerSectionsChange
                    }
                    onPersonalGoalsChange={
                      sharePeriodControls
                        ? subject.id === "partner"
                          ? handlePartnerGoalsChange
                          : handleViewerGoalsChange
                        : undefined
                    }
                />
              )}
            />
          </div>
        )}
      </ProgressOverviewLayout>
    </div>
  );
}
