"use client";

import { useMemo, type ReactNode } from "react";
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
import { growScoreChartLabel, type GrowScorePoint } from "@/lib/grow-score";

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
  title,
  series,
  children,
}: {
  /** Section heading, rendered inside the card. */
  title: string;
  series: readonly GrowScorePoint[];
  /** Rendered below the chart, e.g. the overall stats tiles. */
  children?: ReactNode;
}) {
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

  if (series.length === 0) {
    return null;
  }

  return (
    <section
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
      data-testid="progress-grow-score-trend"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="font-display text-2xl font-semibold tracking-tight">
            {title}
          </h3>
          <p className="mt-1 font-sans text-sm text-muted-foreground">
            Last 4 weeks
          </p>
        </div>
        {latest ? (
          <p className="font-display text-2xl font-semibold tabular-nums tracking-tight">
            {latest.score.toFixed(1)}
          </p>
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
                return [Number(resolved ?? 0).toFixed(1), "Goalmaxxing score"];
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

      {children ? (
        <div className="mt-5 border-t border-border pt-4">{children}</div>
      ) : null}
    </section>
  );
}
