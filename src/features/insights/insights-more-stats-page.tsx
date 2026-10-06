"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReportAppSurfaceReady } from "@/components/layout/app-boot-ready";
import { LoadingCard } from "@/components/ui/loading-card";
import { INSIGHTS_CHART_COLORS, insightsCategoryFill } from "@/features/insights/insights-chart-theme";
import {
  InsightsLabelWithTooltip,
  CountTrendInline,
  InsightsStatPlaque,
  InsightsStatStrip,
  RateTrendInline,
} from "@/features/insights/insights-stats-ui";
import {
  fetchInsightsStats,
  InsightsStatsAuthenticationError,
} from "@/lib/insights/stats";
import type { InsightsStatsGroup, InsightsStatsResponse } from "@/lib/insights/types";

interface StatsSectionProps {
  title: string;
  stats: InsightsStatsGroup;
}

const CHART_COLORS = INSIGHTS_CHART_COLORS;

function chartTooltipStyle() {
  return {
    background: CHART_COLORS.tooltipBg,
    border: `1px solid ${CHART_COLORS.tooltipBorder}`,
    borderRadius: "8px",
    color: CHART_COLORS.tooltipText,
  };
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function tooltipPercentFormatter(
  value: number | string | ReadonlyArray<number | string> | undefined
) {
  const resolved = Array.isArray(value) ? value[0] : value;
  return `${Math.round(Number(resolved ?? 0))}%`;
}

function tooltipCountFormatter(
  value: number | string | ReadonlyArray<number | string> | undefined
) {
  const resolved = Array.isArray(value) ? value[0] : value;
  return Number(resolved ?? 0).toLocaleString();
}

function EmptyChartState({ copy }: { copy: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-md border border-dashed border-muted-foreground/30 bg-muted/20 px-4 text-center text-sm text-muted-foreground">
      {copy}
    </div>
  );
}

function StatsSection({ title, stats }: StatsSectionProps) {
  const rateLineData = useMemo(
    () =>
      stats.completionRateByDay.map((point) => ({
        date: point.date.slice(5),
        percent: Number(point.percent.toFixed(2)),
      })),
    [stats.completionRateByDay]
  );

  const completionsLineData = useMemo(
    () =>
      stats.completionsPerDay.map((point) => ({
        date: point.date.slice(5),
        value: point.value,
      })),
    [stats.completionsPerDay]
  );

  const hasWeekdayData = stats.completionByWeekday.some((point) => point.denominator > 0);
  const hasRateLineData = stats.completionRateByDay.some(
    (point) => point.denominator > 0 || point.numerator > 0
  );
  const hasCompletionsLineData = stats.completionsPerDay.some((point) => point.value > 0);
  const hasCategoryData = stats.completionRateByCategory.some((point) => point.denominator > 0);
  const barGradientId = `insights-bar-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="size-4 text-primary" />
        <h2 className="type-heading text-base">{title}</h2>
      </div>

      <Card className="overflow-hidden border-border/70 shadow-[inset_0_1px_0_color-mix(in_srgb,white_35%,transparent),0_14px_28px_-18px_color-mix(in_srgb,var(--foreground)_22%,transparent)]">
        <CardHeader>
          <CardTitle className="text-sm">Summary percentages</CardTitle>
        </CardHeader>
        <CardContent>
          <InsightsStatStrip>
            <InsightsStatPlaque
              label="Current week completion %"
              tooltip="Numerator: completed goals this week. Denominator: goal opportunities this week, with weekly/monthly/milestone opportunities only counted on completion days."
              value={formatPercent(stats.currentWeekCompletion.percent)}
              hint={
                <RateTrendInline trend={stats.currentWeekCompletion} compareLabel="last week" />
              }
            />
            <InsightsStatPlaque
              label="Current month completion %"
              tooltip="Numerator: completed goals this month. Denominator: goal opportunities this month, with weekly/monthly/milestone opportunities only counted on completion days."
              value={formatPercent(stats.currentMonthCompletion.percent)}
              hint={
                <RateTrendInline
                  trend={stats.currentMonthCompletion}
                  compareLabel="last month window"
                />
              }
            />
            <InsightsStatPlaque
              label="Total active days %"
              tooltip="Numerator: days since account creation with one or more completions. Denominator: total days since account creation."
              value={formatPercent(stats.totalActiveDaysPercent.percent)}
            />
            <InsightsStatPlaque
              label="Total days #"
              tooltip="Numerator: total days elapsed since account creation. Denominator: not applicable."
              value={stats.totalDays.toLocaleString()}
            />
          </InsightsStatStrip>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-sm">
            <InsightsLabelWithTooltip
              label="Completion by day of week (last 30 days)"
              tooltip="Numerator: completed goals on each weekday in the last 30 days. Denominator: goal opportunities on that weekday in the last 30 days."
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {hasWeekdayData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.completionByWeekday}>
                <defs>
                  <linearGradient id={barGradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={1} />
                    <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0.68} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis dataKey="weekdayLabel" tick={{ fill: CHART_COLORS.axis, fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: CHART_COLORS.axis, fontSize: 12 }} />
                <Tooltip
                  formatter={tooltipPercentFormatter}
                  contentStyle={chartTooltipStyle()}
                  cursor={{ fill: CHART_COLORS.cursor }}
                />
                <Bar dataKey="percent" fill={`url(#${barGradientId})`} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState copy="No completion-rate data yet for weekday breakdown." />
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-sm">
            <InsightsLabelWithTooltip
              label="Completion rate % by day (last 30 days)"
              tooltip="Numerator: completed goals each day. Denominator: goal opportunities each day, with weekly/monthly/milestone opportunities only counted on completion days."
            />
          </CardTitle>
          <RateTrendInline trend={stats.rolling30DaysCompletion} compareLabel="previous 30 days" />
        </CardHeader>
        <CardContent className="h-64">
          {hasRateLineData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rateLineData}>
                <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis
                  dataKey="date"
                  minTickGap={20}
                  tick={{ fill: CHART_COLORS.axis, fontSize: 12 }}
                />
                <YAxis domain={[0, 100]} tick={{ fill: CHART_COLORS.axis, fontSize: 12 }} />
                <Tooltip
                  formatter={tooltipPercentFormatter}
                  contentStyle={chartTooltipStyle()}
                  cursor={{ stroke: CHART_COLORS.accent, strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey="percent"
                  stroke={CHART_COLORS.secondary}
                  strokeWidth={2.5}
                  dot={{ r: 2, fill: CHART_COLORS.accent, strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: CHART_COLORS.highlight, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState copy="No completion-rate data yet for daily trend." />
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-sm">
            <InsightsLabelWithTooltip
              label="Completions per day (last 30 days)"
              tooltip="Numerator: completion events per day. Denominator: not applicable."
            />
          </CardTitle>
          <CountTrendInline trend={stats.rolling30DaysActivities} compareLabel="previous 30 days" />
        </CardHeader>
        <CardContent className="h-64">
          {hasCompletionsLineData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={completionsLineData}>
                <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis
                  dataKey="date"
                  minTickGap={20}
                  tick={{ fill: CHART_COLORS.axis, fontSize: 12 }}
                />
                <YAxis tick={{ fill: CHART_COLORS.axis, fontSize: 12 }} />
                <Tooltip
                  formatter={tooltipCountFormatter}
                  contentStyle={chartTooltipStyle()}
                  cursor={{ stroke: CHART_COLORS.secondary, strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2.5}
                  dot={{ r: 2, fill: CHART_COLORS.accent, strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: CHART_COLORS.highlight, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState copy="No completion events yet for daily activity trend." />
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-sm">
            <InsightsLabelWithTooltip
              label="Completion rate % by category (last 30 days)"
              tooltip="Numerator: completed goals in each category over last 30 days. Denominator: category goal opportunities over last 30 days."
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {hasCategoryData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.completionRateByCategory}>
                <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis
                  dataKey="categoryLabel"
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                  tick={{ fill: CHART_COLORS.axis, fontSize: 12 }}
                />
                <YAxis domain={[0, 100]} tick={{ fill: CHART_COLORS.axis, fontSize: 12 }} />
                <Tooltip
                  formatter={tooltipPercentFormatter}
                  contentStyle={chartTooltipStyle()}
                  cursor={{ fill: CHART_COLORS.cursor }}
                />
                <Bar dataKey="percent" radius={[6, 6, 0, 0]}>
                  {stats.completionRateByCategory.map((point) => (
                    <Cell
                      key={point.categoryKey}
                      fill={insightsCategoryFill(point.categoryKey)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState copy="No category completion-rate data yet." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function InsightsMoreStatsPage() {
  const [stats, setStats] = useState<InsightsStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useReportAppSurfaceReady(!loading);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const payload = await fetchInsightsStats();
        if (cancelled) {
          return;
        }
        setStats(payload);
      } catch (loadError) {
        if (cancelled) {
          return;
        }
        if (loadError instanceof InsightsStatsAuthenticationError) {
          setError("Please sign in again to view more stats.");
        } else {
          setError(loadError instanceof Error ? loadError.message : "More stats could not be loaded.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <LoadingCard
        title="Loading more stats..."
        description="Crunching trend and completion metrics."
      />
    );
  }

  if (!stats || error) {
    return (
      <Card className="shadow-sm">
        <CardContent className="py-6 text-sm text-muted-foreground">
          {error ?? "More stats are unavailable right now."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Reached from "View more" on Profile settings; a plain page header, not a card. */}
      <header className="space-y-3">
        <Link href="/settings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to profile
        </Link>
        <h1 className="type-title text-2xl tracking-tight">More stats</h1>
      </header>

      <StatsSection title="Your goals" stats={stats.overall} />
      {stats.team ? <StatsSection title="Team goals" stats={stats.team} /> : null}
    </div>
  );
}
