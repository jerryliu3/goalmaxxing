"use client";

import type { ProgressHistorySummary as HistorySummary } from "@/features/insights/progress-overview/progress-summary-model";
import { getHeatmapScaleClass } from "@/lib/goals/heatmap";
import { cn } from "@/lib/utils";

export function ProgressHistorySummary({ summary }: { summary: HistorySummary }) {
  return (
    <div data-testid="progress-history-summary">
      <div className="flex items-stretch gap-1" aria-hidden="true">
        {summary.days.map((day) => (
          <span
            key={day.date}
            title={`${day.date}: ${day.count} completion${day.count === 1 ? "" : "s"}`}
            className={cn(
              "h-8 min-w-0 flex-1 rounded-[4px]",
              day.isFuture
                ? "border border-dashed border-border/60"
                : getHeatmapScaleClass(day.count)
            )}
          />
        ))}
      </div>
      <p className="mt-3 font-sans text-sm text-muted-foreground">
        {summary.completions} completion{summary.completions === 1 ? "" : "s"} ·{" "}
        {summary.goalCount} goal{summary.goalCount === 1 ? "" : "s"}
      </p>
    </div>
  );
}
