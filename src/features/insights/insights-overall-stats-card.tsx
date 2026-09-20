"use client";

import { type ReactNode, type RefObject } from "react";
import Link from "next/link";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { Layers3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CountTrendInline,
  InsightsStatPlaque,
  InsightsStatStrip,
} from "@/features/insights/insights-stats-ui";
import type { InsightsStatsGroup } from "@/lib/insights/types";

type InsightsOverallStatsSummary = Pick<
  InsightsStatsGroup,
  | "totalActivities"
  | "totalGoalsCompleted"
  | "todayActivities"
  | "activeStreakWeeks"
  | "currentWeekActivities"
  | "currentMonthActivities"
>;

const aggregateWeekdayLabels: [string, string, string, string, string, string, string] = [
  "Su",
  "M",
  "T",
  "W",
  "Th",
  "F",
  "S",
];

export function InsightsOverallStatsTiles({
  overallStats,
  showMoreLink = true,
}: {
  overallStats: InsightsOverallStatsSummary;
  showMoreLink?: boolean;
}) {
  return (
    <>
      <InsightsStatStrip>
        <InsightsStatPlaque
          label="Total Activities"
          tooltip="Numerator: every completion event ever logged."
          value={overallStats.totalActivities.toLocaleString()}
        />
        <InsightsStatPlaque
          label="Total Goals Completed"
          tooltip="Numerator: unique goals in achieved outcome."
          value={overallStats.totalGoalsCompleted.toLocaleString()}
        />
        <InsightsStatPlaque
          label="Current Month Activities"
          tooltip="Numerator: completion events in the current month."
          value={overallStats.currentMonthActivities.current.toLocaleString()}
          hint={
            <CountTrendInline
              trend={overallStats.currentMonthActivities}
              compareLabel="last month window"
            />
          }
        />
        <InsightsStatPlaque
          label="Current Week Activities"
          tooltip="Numerator: completion events in the current week."
          value={overallStats.currentWeekActivities.current.toLocaleString()}
          hint={
            <CountTrendInline
              trend={overallStats.currentWeekActivities}
              compareLabel="last week"
            />
          }
        />
        <InsightsStatPlaque
          label="Today's Activities"
          tooltip="Numerator: completion events on today's date."
          value={overallStats.todayActivities.toLocaleString()}
        />
        <InsightsStatPlaque
          label="Active Streak"
          tooltip="Consecutive calendar weeks ending this week with at least one completed activity."
          value={`${overallStats.activeStreakWeeks.toLocaleString()} ${
            overallStats.activeStreakWeeks === 1 ? "week" : "weeks"
          }`}
        />
      </InsightsStatStrip>
      {showMoreLink ? (
        <div className="text-right text-sm">
          <Link href="/insights/more" className="font-medium text-primary hover:underline">
            View more -&gt;
          </Link>
        </div>
      ) : null}
    </>
  );
}

export function InsightsOverallStatsCard({
  heatmapRef,
  selectedYearStart,
  selectedYearEnd,
  values,
  overallCompletion,
  overallStats,
  classForValue,
  titleForValue,
  onDayClick,
  legend,
  showMoreLink = true,
}: {
  heatmapRef: RefObject<HTMLDivElement | null>;
  selectedYearStart: Date;
  selectedYearEnd: Date;
  values: Array<{ date: string; count: number }>;
  overallCompletion: number;
  overallStats?: InsightsOverallStatsSummary | null;
  classForValue: (value?: { date?: string; count?: number }) => string;
  titleForValue: (value?: { date?: string; count?: number }) => string;
  onDayClick: (value?: { date?: string; count?: number }) => void;
  legend?: ReactNode;
  showMoreLink?: boolean;
}) {
  return (
    <Card className="shadow-sm" data-onboarding="insights.overall">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Layers3 className="size-4 text-primary" />
          <CardTitle>Overall stats</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-0">
          <div ref={heatmapRef} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <CalendarHeatmap
              startDate={selectedYearStart}
              endDate={selectedYearEnd}
              values={values}
              showWeekdayLabels
              weekdayLabels={aggregateWeekdayLabels}
              classForValue={(value) =>
                classForValue({
                  date: value?.date,
                  count: value?.count,
                })
              }
              titleForValue={(value) =>
                titleForValue({
                  date: value?.date,
                  count: value?.count,
                })
              }
              onClick={(value) =>
                onDayClick({
                  date: value?.date,
                  count: value?.count,
                })
              }
            />
          </div>
          {legend ?? (
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
          )}
        </div>
        {overallStats ? (
          <InsightsOverallStatsTiles
            overallStats={overallStats}
            showMoreLink={showMoreLink}
          />
        ) : (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall completion</span>
              <span>{Math.round(overallCompletion)}%</span>
            </div>
            <Progress value={overallCompletion} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
