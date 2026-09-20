"use client";

import { useMemo, type ReactNode } from "react";
import { growScoreChartLabel, type GrowScorePoint } from "@/lib/grow-score";

const PLOT_WIDTH = 640;
const PLOT_HEIGHT = 224;
const PLOT_PAD = { left: 8, right: 8, top: 16, bottom: 28 };

function ScoreSparkline({
  points,
}: {
  points: readonly { date: string; label: string; score: number }[];
}) {
  const scores = points.map((point) => point.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const span = max - min || 1;
  const innerWidth = PLOT_WIDTH - PLOT_PAD.left - PLOT_PAD.right;
  const innerHeight = PLOT_HEIGHT - PLOT_PAD.top - PLOT_PAD.bottom;
  const xFor = (index: number) =>
    PLOT_PAD.left + (index / Math.max(points.length - 1, 1)) * innerWidth;
  const yFor = (score: number) =>
    PLOT_PAD.top + (1 - (score - min) / span) * innerHeight;
  const line = points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command}${xFor(index).toFixed(1)} ${yFor(point.score).toFixed(1)}`;
    })
    .join(" ");
  const ticks = [0, Math.floor((points.length - 1) / 2), points.length - 1].filter(
    (index, position, list) => list.indexOf(index) === position,
  );

  return (
    <svg
      viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`}
      className="h-full w-full"
      role="img"
      aria-label="Goalmaxxing score over the last 4 weeks"
    >
      <line
        x1={PLOT_PAD.left}
        x2={PLOT_WIDTH - PLOT_PAD.right}
        y1={yFor(min)}
        y2={yFor(min)}
        stroke="var(--border)"
        strokeWidth="1"
      />
      <path
        d={line}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((point, index) => (
        <circle
          key={point.date}
          cx={xFor(index)}
          cy={yFor(point.score)}
          r="2.2"
          fill="color-mix(in srgb, var(--primary) 55%, var(--gm-gain))"
        >
          <title>{`${point.date}: ${point.score.toFixed(1)}`}</title>
        </circle>
      ))}
      {ticks.map((index) => {
        const point = points[index];
        if (!point) {
          return null;
        }
        const anchor =
          index === 0 ? "start" : index === points.length - 1 ? "end" : "middle";
        return (
          <text
            key={`${point.date}-tick`}
            x={xFor(index)}
            y={PLOT_HEIGHT - 8}
            textAnchor={anchor}
            fill="var(--muted-foreground)"
            fontSize="12"
          >
            {point.label}
          </text>
        );
      })}
    </svg>
  );
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
        date: point.date,
        label: growScoreChartLabel(point.date),
        score: Number(point.score.toFixed(2)),
      })),
    [series],
  );

  const latest = series.at(-1);

  if (series.length === 0) {
    return null;
  }

  return (
    <section
      className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm"
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

      <div className="mt-4 h-56 w-full min-w-0">
        <ScoreSparkline points={chartData} />
      </div>

      {children ? (
        <div className="mt-5 border-t border-border pt-4">{children}</div>
      ) : null}
    </section>
  );
}
