"use client";

import { useRef } from "react";
import type {
  PublicProfileGrowPoint,
  PublicProfileHeatmapPoint,
  PublicProfileOverallStats,
} from "@cadence/shared/social/public-profile";
import { GrowScoreTrendChart } from "@/features/insights/grow-score-trend-chart";
import { InsightsOverallStatsTiles } from "@/features/insights/insights-overall-stats-card";
import { hasGrowScoreSignal, toGrowScoreChartSeries } from "@/features/insights/use-grow-score-series";
import { PublicProfileActivityHeatmap } from "@/features/social/public-profile/public-profile-activity-heatmap";

function OverallStatsBlock({
  overallStats,
  showMoreLink,
}: {
  overallStats: PublicProfileOverallStats;
  showMoreLink: boolean;
}) {
  return (
    <div>
      <h4 className="type-eyebrow mb-3 text-xs text-muted-foreground">
        Overall stats
      </h4>
      <InsightsOverallStatsTiles overallStats={overallStats} showMoreLink={showMoreLink} />
    </div>
  );
}

export function ProfilePresenceSection({
  growSeries,
  heatmap,
  selectedYear,
  overallStats = null,
  showMoreLink = false,
}: {
  growSeries: readonly PublicProfileGrowPoint[];
  heatmap: readonly PublicProfileHeatmapPoint[];
  selectedYear: number;
  overallStats?: PublicProfileOverallStats | null;
  showMoreLink?: boolean;
}) {
  const heatmapRef = useRef<HTMLDivElement | null>(null);
  const chartSeries = toGrowScoreChartSeries(growSeries);
  const stats = overallStats ? (
    <OverallStatsBlock overallStats={overallStats} showMoreLink={showMoreLink} />
  ) : null;

  return (
    <div className="min-w-0 space-y-4" data-testid="profile-presence">
      {hasGrowScoreSignal(chartSeries) ? (
        <GrowScoreTrendChart title="Goal score" series={chartSeries}>
          {stats}
        </GrowScoreTrendChart>
      ) : stats ? (
        <section className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm">
          {stats}
        </section>
      ) : null}
      <PublicProfileActivityHeatmap
        heatmapRef={heatmapRef}
        selectedYear={selectedYear}
        values={[...heatmap]}
      />
    </div>
  );
}
