"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { INSIGHTS_CHART_COLORS } from "@/features/insights/insights-chart-theme";
import {
  buildGrowScoreSeries,
  growScoreChartLabel,
  isIsoDateString,
  type GrowCompletionFact,
  type GrowGoalDifficultyRef,
} from "@/lib/grow-score";

const CHART_COLORS = INSIGHTS_CHART_COLORS;

function chartTooltipStyle() {
  return {
    background: CHART_COLORS.tooltipBg,
    border: `1px solid ${CHART_COLORS.tooltipBorder}`,
    borderRadius: "8px",
    color: CHART_COLORS.tooltipText,
  };
}

export function GrowScoreTrendChart({
  completions,
  goals,
  asOfDate,
  weekStartsOn = 1,
}: {
  completions: readonly GrowCompletionFact[];
  goals: readonly GrowGoalDifficultyRef[];
  asOfDate: string;
  weekStartsOn?: number;
}) {
  const series = useMemo(() => {
    if (!isIsoDateString(asOfDate)) return [];
    return buildGrowScoreSeries({
      completions,
      goals,
      asOfDate,
      displayDays: 28,
      warmupDays: 56,
      weekStartsOn,
    });
  }, [completions, goals, asOfDate, weekStartsOn]);

  const chartData = useMemo(
    () =>
      series.map((point) => ({
        date: growScoreChartLabel(point.date),
        fullDate: point.date,
        score: Number(point.score.toFixed(2)),
        pace: Number(point.pace.toFixed(2)),
      })),
    [series],
  );

  const latest = series.at(-1);
  const first = series[0];
  const delta =
    latest && first ? latest.score - first.score : 0;
  const hasSignal = series.some((point) => point.rawCredits > 0 || point.score > 0);

  if (!hasSignal) {
    return null;
  }

  return (
    <section
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
      data-testid="progress-grow-score-trend"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Grow score
          </p>
          <h2 className="mt-1 font-display text-base font-semibold tracking-tight">
            Last 4 weeks
          </h2>
        </div>
        {latest ? (
          <div className="text-right">
            <p className="font-display text-2xl font-semibold tabular-nums tracking-tight">
              {latest.score.toFixed(1)}
            </p>
            <p className="font-sans text-xs text-muted-foreground">
              {delta >= 0 ? "+" : ""}
              {delta.toFixed(1)} over the window · pace{" "}
              {latest.pace.toFixed(2)}/day
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
            <XAxis
              dataKey="date"
              minTickGap={24}
              tick={{ fill: CHART_COLORS.axis, fontSize: 12 }}
            />
            <YAxis
              domain={["auto", "auto"]}
              width={40}
              tick={{ fill: CHART_COLORS.axis, fontSize: 12 }}
            />
            <Tooltip
              contentStyle={chartTooltipStyle()}
              cursor={{ stroke: CHART_COLORS.accent, strokeWidth: 1 }}
              formatter={(value) => {
                const resolved = Array.isArray(value) ? value[0] : value;
                return [Number(resolved ?? 0).toFixed(1), "Grow score"];
              }}
              labelFormatter={(label, payload) => {
                const full = payload?.[0]?.payload?.fullDate;
                return typeof full === "string" ? full : String(label);
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke={CHART_COLORS.primary}
              strokeWidth={2.5}
              dot={{ r: 2, fill: CHART_COLORS.accent, strokeWidth: 0 }}
              activeDot={{ r: 4, fill: CHART_COLORS.highlight, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 font-sans text-xs text-muted-foreground">
        Effort remembered over time — weighted by goal difficulty, capped per
        day/week/month. Not XP.
      </p>
    </section>
  );
}
