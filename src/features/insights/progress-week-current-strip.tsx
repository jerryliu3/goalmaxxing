"use client";

import { CountTrendInline } from "@/features/insights/insights-stats-ui";
import type { InsightsStatsGroup } from "@/lib/insights/types";

export function ProgressWeekCurrentStrip({
  overallStats,
}: {
  overallStats: Pick<
    InsightsStatsGroup,
    "currentWeekCompletion" | "currentWeekActivities"
  >;
}) {
  const { numerator, denominator } = overallStats.currentWeekCompletion;
  return (
    <section
      className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
      data-testid="progress-week-current-strip"
    >
      <p className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        This week
      </p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <p className="font-display text-3xl font-semibold leading-none tracking-tight">
          {numerator}
          <span className="font-sans text-lg font-medium text-muted-foreground">
            {" "}
            of {denominator}
          </span>
        </p>
        <p className="font-sans text-sm text-muted-foreground">
          <CountTrendInline
            trend={overallStats.currentWeekActivities}
            compareLabel="last week"
          />
        </p>
      </div>
    </section>
  );
}
