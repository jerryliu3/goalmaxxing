"use client";

import { useId, useState } from "react";
import { useSearchParams } from "next/navigation";
import { resolveDuoLanes } from "@cadence/shared/social/duo";
import { useReportAppSurfaceReady } from "@/components/layout/app-boot-ready";
import { Button } from "@/components/ui/button";
import { LoadingCard } from "@/components/ui/loading-card";
import { AchievementsShowcase } from "@/features/achievements/showcase";
import { useAchievementsShowcase } from "@/features/achievements/use-achievements-showcase";
import { useCoachPageContext } from "@/features/coach/use-coach-page-context";
import { GrowScoreTrendChart } from "@/features/insights/grow-score-trend-chart";
import { InsightsOverallStatsTiles } from "@/features/insights/insights-overall-stats-card";
import { InsightsTab } from "@/features/insights/insights-tab";
import { toGrowScoreChartSeries } from "@/features/insights/use-grow-score-series";
import { useInsightsData } from "@/features/insights/use-insights-data";
import { TabOnboardingOverlay } from "@/features/onboarding/tab-onboarding-overlay";
import { DuoLanes } from "@/features/social/duo/duo-lanes";
import { useDuoSurface } from "@/features/social/duo/use-duo-surface";
import { useOwnProfilePresence } from "@/features/social/use-own-profile-presence";
import { ProfileMedalShelf } from "@/features/achievements/profile-medal-shelf";
import { GrowthDetailedStats } from "./growth-detailed-stats";

function GrowthLane({ userId, readOnly, anchors }: {
  userId: string;
  readOnly: boolean;
  anchors: boolean;
}) {
  const year = new Date().getFullYear();
  const [showStats, setShowStats] = useState(false);
  const detailsId = useId();
  const { state, loading, loadError, reload } = useInsightsData({
    subjectUserId: userId,
    selectedYear: String(year),
    failClosed: readOnly,
  });
  const { bundle, loading: presenceLoading, error: presenceError, reload: reloadPresence } = useOwnProfilePresence(userId, null);
  const awards = useAchievementsShowcase({ enabled: !readOnly });
  useReportAppSurfaceReady(!loading && !presenceLoading);

  if (loadError || (presenceError && !bundle)) {
    return (
      <div role="alert">
        <p>{loadError ?? presenceError}</p>
        <Button onClick={() => { reload(); reloadPresence(); }}>Try again</Button>
      </div>
    );
  }
  if (loading || presenceLoading) {
    return <LoadingCard title="Loading Growth…" description="Gathering your score, achievements and progress." />;
  }
  const series = toGrowScoreChartSeries(bundle?.growSeries ?? []);

  return (
    <div className="space-y-8" data-testid="growth-page">
      <section aria-label="Goal score" data-growth-section="score">
        <GrowScoreTrendChart title="Goal score" series={series} />
      </section>
      <section aria-label="Progress tracker" data-growth-section="tracker">
        <InsightsTab subjectUserId={userId} readOnly={readOnly} sectionIds={["history"]} progressView="all" anchorSections={anchors} />
      </section>
      <section
        id={anchors ? "achievements" : undefined}
        aria-label="Achievements"
        data-growth-section="achievements"
        data-onboarding={anchors ? "insights.achievements" : undefined}
      >
        <h2 className="type-title mb-4 text-2xl">Achievements</h2>
        {readOnly ? (
          <ProfileMedalShelf achievements={bundle?.globalAchievements ?? []} awardCatalogCount={bundle?.awardCatalogCount ?? 0} />
        ) : awards.loading ? (
          <p>Loading achievements…</p>
        ) : awards.error || !awards.payload ? (
          <div role="alert">
            <p>{awards.error ?? "Achievements could not be loaded."}</p>
            <Button onClick={() => void awards.reload()}>Try again</Button>
          </div>
        ) : (
          <AchievementsShowcase payload={awards.payload} />
        )}
      </section>
      <section id={anchors ? "stats" : undefined} aria-label="Stats" data-growth-section="stats">
        <h2 className="type-title mb-4 text-2xl">Stats</h2>
        {state.insightsStats ? <InsightsOverallStatsTiles overallStats={state.insightsStats.overall} showMoreLink={false} /> : null}
        {state.insightsStats ? <>
          <div className="mt-3 text-right">
            <Button variant="ghost" aria-expanded={showStats} aria-controls={detailsId} onClick={() => setShowStats(value => !value)}>
              {showStats ? "View less" : "View more"}
            </Button>
          </div>
          {showStats ? <div id={detailsId} className="mt-5"><GrowthDetailedStats stats={state.insightsStats} /></div> : null}
        </> : null}
      </section>
    </div>
  );
}

export function GrowthPage() {
  const searchParams = useSearchParams();
  const { scope, viewer, partner } = useDuoSurface("insights");
  const lanes = resolveDuoLanes({ scope, viewer, partner });
  useCoachPageContext({ surface: "progress", scope: scope === "me" ? "self" : "duo" });
  return (
    <div className="space-y-5">
      <TabOnboardingOverlay onboardingKey="insights.main" forceOpen={searchParams.get("onboarding") === "insights.main"} />
      <DuoLanes
        scope={scope}
        viewer={viewer}
        partner={partner}
        renderLane={subject => <GrowthLane userId={subject.userId} readOnly={subject.readOnly} anchors={subject.id === lanes[0]?.id} />}
      />
    </div>
  );
}
