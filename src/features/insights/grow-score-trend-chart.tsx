"use client";

import { format, parseISO } from "date-fns";
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TooltipIcon } from "@/components/ui/tooltip-icon";
import { INSIGHTS_CHART_COLORS } from "@/features/insights/insights-chart-theme";
import { growScoreChartLabel, type GrowScorePoint } from "@/lib/grow-score";

const CHART_COLORS = INSIGHTS_CHART_COLORS;
const FALLBACK_PLOT_WIDTH = 640;
const FALLBACK_PLOT_HEIGHT = 224;
const PLOT_PAD = { left: 40, right: 8, top: 16, bottom: 28 };

export const GROW_SCORE_CHART_HELP =
  "A picture of how much you have been completing lately, compared with your usual pace.";

function chartTooltipStyle() {
  return {
    background: CHART_COLORS.tooltipBg,
    border: `1px solid ${CHART_COLORS.tooltipBorder}`,
    borderRadius: "8px",
    color: CHART_COLORS.tooltipText,
  };
}

function ScoreSparkline({
  points,
}: {
  points: readonly { fullDate: string; label: string; score: number }[];
}) {
  const scores = points.map((point) => point.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const span = max - min || 1;
  const innerWidth = FALLBACK_PLOT_WIDTH - PLOT_PAD.left - PLOT_PAD.right;
  const innerHeight = FALLBACK_PLOT_HEIGHT - PLOT_PAD.top - PLOT_PAD.bottom;
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
  const xTicks = [0, Math.floor((points.length - 1) / 2), points.length - 1].filter(
    (index, position, list) => list.indexOf(index) === position,
  );
  const yTicks = [max, min + span / 2, min];

  return (
    <svg viewBox={`0 0 ${FALLBACK_PLOT_WIDTH} ${FALLBACK_PLOT_HEIGHT}`} className="h-full w-full">
      {yTicks.map((score, index) => (
        <g key={`y-${index}`}>
          <line
            x1={PLOT_PAD.left}
            x2={FALLBACK_PLOT_WIDTH - PLOT_PAD.right}
            y1={yFor(score)}
            y2={yFor(score)}
            stroke={CHART_COLORS.grid}
            strokeWidth="1"
          />
          <text
            x={PLOT_PAD.left - 8}
            y={yFor(score) + 4}
            textAnchor="end"
            fill={CHART_COLORS.axis}
            fontSize="12"
          >
            {score.toFixed(1)}
          </text>
        </g>
      ))}
      <path
        d={line}
        fill="none"
        stroke={CHART_COLORS.primary}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((point, index) => (
        <circle
          key={point.fullDate}
          cx={xFor(index)}
          cy={yFor(point.score)}
          r="2.2"
          fill={CHART_COLORS.accent}
        >
          <title>{`${point.fullDate}: ${point.score.toFixed(1)}`}</title>
        </circle>
      ))}
      {xTicks.map((index) => {
        const point = points[index];
        if (!point) {
          return null;
        }
        const anchor =
          index === 0 ? "start" : index === points.length - 1 ? "end" : "middle";
        return (
          <text
            key={`${point.fullDate}-tick`}
            x={xFor(index)}
            y={FALLBACK_PLOT_HEIGHT - 8}
            textAnchor={anchor}
            fill={CHART_COLORS.axis}
            fontSize="12"
          >
            {point.label}
          </text>
        );
      })}
    </svg>
  );
}

type ScoreChartDatum = { date: string; fullDate: string; score: number };

/** Days visible at once; older history is a horizontal scroll away. */
const VISIBLE_DAYS = 28;
const Y_AXIS_WIDTH = 40;
const X_AXIS_HEIGHT = 30;
const CHART_MARGIN = { top: 5, right: 0, bottom: 5, left: 0 };

/** One shared y-scale so the pinned axis lines up with the scrolling plot. */
function scoreTicks(data: readonly ScoreChartDatum[]): number[] {
  const scores = data.map((point) => point.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const rough = Math.max((max - min) / 4, 1);
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((v) => v >= rough)!;
  const low = Math.floor(min / step) * step;
  const high = Math.max(Math.ceil(max / step) * step, low + step);
  const ticks: number[] = [];
  for (let tick = low; tick <= high + step / 2; tick += step) {
    ticks.push(Number(tick.toFixed(2)));
  }
  return ticks;
}

function ScoreLineChart({
  width,
  height,
  data,
}: {
  width: number;
  height: number;
  data: readonly ScoreChartDatum[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const ticks = useMemo(() => scoreTicks(data), [data]);
  const domain: [number, number] = [ticks[0]!, ticks.at(-1)!];
  const plotViewport = Math.max(width - Y_AXIS_WIDTH, 1);
  const dayWidth = plotViewport / VISIBLE_DAYS;
  const plotWidth = Math.max(plotViewport, Math.round(data.length * dayWidth));
  const rows = [...data];

  // Open on the latest weeks; earlier history scrolls in from the left.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollLeft = el.scrollWidth;
    }
  }, [plotWidth, data.length]);

  return (
    <div className="flex h-full w-full" style={{ height }}>
      <LineChart
        width={Y_AXIS_WIDTH}
        height={height}
        data={rows}
        margin={{ ...CHART_MARGIN, right: 0, bottom: CHART_MARGIN.bottom + X_AXIS_HEIGHT }}
        aria-hidden
      >
        <YAxis
          domain={domain}
          ticks={ticks}
          interval={0}
          width={Y_AXIS_WIDTH}
          tick={{ fill: CHART_COLORS.axis, fontSize: 12 }}
        />
        <Line dataKey="score" stroke="none" dot={false} isAnimationActive={false} />
      </LineChart>
      <div
        ref={scrollRef}
        className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:thin]"
        data-testid="grow-score-scroll"
      >
        <LineChart
          width={plotWidth}
          height={height}
          data={rows}
          margin={CHART_MARGIN}
          style={{ width: plotWidth, height }}
        >
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis
            dataKey="date"
            height={X_AXIS_HEIGHT}
            minTickGap={24}
            padding={{ left: 16, right: 20 }}
            tick={{ fill: CHART_COLORS.axis, fontSize: 12 }}
          />
          <YAxis hide domain={domain} ticks={ticks} />
          <Tooltip
            contentStyle={chartTooltipStyle()}
            cursor={{ stroke: CHART_COLORS.accent, strokeWidth: 1 }}
            formatter={(value) => {
              const resolved = Array.isArray(value) ? value[0] : value;
              return [Number(resolved ?? 0).toFixed(1), "Goal score"];
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
            dot={data.length > VISIBLE_DAYS * 3 ? false : { r: 2, fill: CHART_COLORS.accent, strokeWidth: 0 }}
            activeDot={{ r: 4, fill: CHART_COLORS.highlight, strokeWidth: 0 }}
            // The draw-in sweep starts off-screen at the oldest day; skip it.
            isAnimationActive={false}
          />
        </LineChart>
      </div>
    </div>
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
  const plotRef = useRef<HTMLDivElement>(null);
  const [plotSize, setPlotSize] = useState<{ width: number; height: number } | null>(null);
  const chartData = useMemo(
    () =>
      series.map((point) => ({
        date: growScoreChartLabel(point.date),
        fullDate: point.date,
        label: growScoreChartLabel(point.date),
        score: Number(point.score.toFixed(2)),
      })),
    [series],
  );

  useLayoutEffect(() => {
    const el = plotRef.current;
    if (!el) {
      return;
    }

    const apply = () => {
      const width = Math.round(el.clientWidth);
      const height = Math.round(el.clientHeight);
      if (width > 0 && height > 0) {
        setPlotSize((current) =>
          current?.width === width && current.height === height
            ? current
            : { width, height },
        );
      }
    };

    apply();
    if (typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const latest = series.at(-1);
  const since = series[0] ? format(parseISO(series[0].date), "MMM d, yyyy") : "";

  if (series.length === 0) {
    return null;
  }

  return (
    <section
      className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm"
      data-testid="progress-grow-score-trend"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="type-title text-2xl tracking-tight">
              {title}
            </h3>
            <TooltipIcon content={GROW_SCORE_CHART_HELP} label={`${title} definition`} />
          </div>
          <p className="mt-1 font-sans text-sm text-muted-foreground">
            Since {since}
          </p>
        </div>
        {latest ? (
          <div className="text-right">
            <p className="font-sans text-sm text-muted-foreground">Current score</p>
            <p className="type-stat text-2xl tracking-tight">
              {latest.score.toFixed(1)}
            </p>
          </div>
        ) : null}
      </div>

      <div
        ref={plotRef}
        className="mt-4 h-56 w-full min-w-0"
        role="img"
        aria-label={`Goal score since ${since}`}
      >
        {plotSize ? (
          <ScoreLineChart width={plotSize.width} height={plotSize.height} data={chartData} />
        ) : (
          <ScoreSparkline points={chartData} />
        )}
      </div>

      {children ? (
        <div className="mt-5 border-t border-border pt-4">{children}</div>
      ) : null}
    </section>
  );
}
