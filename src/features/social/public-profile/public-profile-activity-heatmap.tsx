"use client";

import { type RefObject } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicProfileHeatmapPoint } from "@cadence/shared/social/public-profile";
import { getHeatmapScaleClass } from "@/lib/goals/heatmap";

const aggregateWeekdayLabels: [string, string, string, string, string, string, string] = [
  "Su",
  "M",
  "T",
  "W",
  "Th",
  "F",
  "S",
];

export function PublicProfileActivityHeatmap({
  heatmapRef,
  selectedYear,
  values,
}: {
  heatmapRef: RefObject<HTMLDivElement | null>;
  selectedYear: number;
  values: PublicProfileHeatmapPoint[];
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-primary" />
          <CardTitle>{selectedYear} activity</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={heatmapRef} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <CalendarHeatmap
            startDate={new Date(`${selectedYear}-01-01`)}
            endDate={new Date(`${selectedYear}-12-31`)}
            values={values}
            showWeekdayLabels
            weekdayLabels={aggregateWeekdayLabels}
            classForValue={(value) => getHeatmapScaleClass(value?.count ?? 0)}
            titleForValue={(value) =>
              `${value?.date ?? "N/A"}: ${value?.count ?? 0} completion${
                (value?.count ?? 0) === 1 ? "" : "s"
              }`
            }
            onClick={() => undefined}
          />
        </div>
        <div className="-mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((scale) => (
            <span
              key={scale}
              className={`inline-block size-3 rounded-[3px] heatmap-scale-${scale}`}
            />
          ))}
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
