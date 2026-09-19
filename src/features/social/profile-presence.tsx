"use client";

import { useRef } from "react";
import type {
  PublicProfileGrowPoint,
  PublicProfileHeatmapPoint,
} from "@cadence/shared/social/public-profile";
import { GrowScoreTrendChart } from "@/features/insights/grow-score-trend-chart";
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

export function ProfilePresenceSection({
  growSeries,
  heatmap,
  selectedYear,
}: {
  growSeries: readonly PublicProfileGrowPoint[];
  heatmap: readonly PublicProfileHeatmapPoint[];
  selectedYear: number;
}) {
  const heatmapRef = useRef<HTMLDivElement | null>(null);
  const chartSeries = toChartSeries(growSeries);

  return (
    <div className="space-y-4" data-testid="profile-presence">
      {hasGrowScoreSignal(chartSeries) ? (
        <GrowScoreTrendChart title="Goalmaxxing score" series={chartSeries} />
      ) : null}
      <PublicProfileActivityHeatmap
        heatmapRef={heatmapRef}
        selectedYear={selectedYear}
        values={[...heatmap]}
      />
    </div>
  );
}
