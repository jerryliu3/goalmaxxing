"use client";

import type { ProgressScoreSummary } from "@/features/insights/progress-overview/progress-summary-model";

const SPARKLINE_WIDTH = 220;
const SPARKLINE_HEIGHT = 56;

function sparklinePath(points: readonly number[]): string | null {
  if (points.length < 2) {
    return null;
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * SPARKLINE_WIDTH;
      const y = SPARKLINE_HEIGHT - ((point - min) / span) * SPARKLINE_HEIGHT;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function ProgressScoreSummary({ summary }: { summary: ProgressScoreSummary }) {
  const path = sparklinePath(summary.points);
  const delta = summary.weekDelta;

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-4"
      data-testid="progress-score-summary"
    >
      <div>
        <p className="font-display text-4xl font-semibold leading-none tracking-tight tabular-nums">
          {Math.round(summary.score)}
        </p>
        <p className="mt-2 font-sans text-sm text-muted-foreground">
          {delta >= 0 ? "+" : ""}
          {delta.toFixed(1)} this week
        </p>
      </div>
      {path ? (
        <svg
          viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}
          className="h-14 w-full max-w-[16rem] text-primary"
          role="img"
          aria-label={`Score trend over the last ${summary.points.length} days`}
          preserveAspectRatio="none"
        >
          <path
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      ) : null}
    </div>
  );
}
