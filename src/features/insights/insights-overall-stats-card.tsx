"use client";

import Link from "next/link";
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
          label="Total activities"
          tooltip="Numerator: every completion event ever logged."
          value={overallStats.totalActivities.toLocaleString()}
        />
        <InsightsStatPlaque
          label="Total goals completed"
          tooltip="Numerator: unique goals in achieved outcome."
          value={overallStats.totalGoalsCompleted.toLocaleString()}
        />
        <InsightsStatPlaque
          label="Current month activities"
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
          label="Current week activities"
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
          label="Active streak"
          tooltip="Consecutive calendar weeks ending this week with at least one completed activity."
          value={`${overallStats.activeStreakWeeks.toLocaleString()} ${
            overallStats.activeStreakWeeks === 1 ? "week" : "weeks"
          }`}
        />
      </InsightsStatStrip>
      {showMoreLink ? (
        <div className="text-right text-sm">
          <Link href="/growth#stats" className="font-medium text-primary hover:underline">
            View more -&gt;
          </Link>
        </div>
      ) : null}
    </>
  );
}
