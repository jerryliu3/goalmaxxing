"use client";

import { useRef } from "react";
import type {
  PublicProfileGrowPoint,
  PublicProfileHeatmapPoint,
  PublicProfileOverallStats,
} from "@cadence/shared/social/public-profile";
import { GrowScoreTrendChart } from "@/features/insights/grow-score-trend-chart";
import { InsightsOverallStatsTiles } from "@/features/insights/insights-overall-stats-card";
import { hasGrowScoreSignal } from "@/features/insights/use-grow-score-series";
import { PublicProfileActivityHeatmap } from "@/features/social/public-profile/public-profile-activity-heatmap";
import type { GrowScorePoint } from "@/lib/grow-score";

function toChartSeries(series: readonly PublicProfileGrowPoint[]): GrowScorePoint[] {
  return series.map((point) => ({
    date: point.date,
    score: point.score,
    pace: point.pace,
    rawCredits: point.rawCredits,
    earned: 0,
    mode: point.rawCredits > 0 ? "earn" : "hold",
  }));
}

function OverallStatsBlock({
  overallStats,
  showMoreLink,
}: {
  overallStats: PublicProfileOverallStats;
  showMoreLink: boolean;
}) {
  return (
    <div>
      <h4 className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
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
  const chartSeries = toChartSeries(growSeries);
  const stats = overallStats ? (
    <OverallStatsBlock overallStats={overallStats} showMoreLink={showMoreLink} />
  ) : null;

  return (
    <div className="min-w-0 space-y-4" data-testid="profile-presence">
      {hasGrowScoreSignal(chartSeries) ? (
        <GrowScoreTrendChart title="Goalmaxxing score" series={chartSeries}>
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
