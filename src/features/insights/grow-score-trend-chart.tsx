"use client";

import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import { format, parseISO } from "date-fns";
import { TooltipIcon } from "@/components/ui/tooltip-icon";
import {
  GROW_SCORE_RANGE_OPTIONS,
  formatGrowScoreRangeLabel,
  growScoreRangePeriodLabel,
  sliceGrowScoreRange,
  type GrowScoreRange,
} from "@/features/insights/grow-score-range";
import type { GrowScorePoint } from "@/lib/grow-score";
import { cn } from "@/lib/utils";

export const GROW_SCORE_CHART_HELP =
  "A picture of how much you have been completing lately, compared with your usual pace.";

const FALLBACK_WIDTH = 640;
const PLOT_HEIGHT = 240;
const PAD = { left: 6, right: 36, top: 26, bottom: 24 };
const UP_COLOR = "var(--gm-gain)";
const DOWN_COLOR = "var(--destructive)";
const AXIS_TEXT = { fontSize: 11, fill: "var(--muted-foreground)" } as const;
const GRID = { stroke: "var(--border)", strokeDasharray: "2 4", vectorEffect: "non-scaling-stroke" } as const;

/** About three round score values inside [min, max] for the gridlines. */
export function scoreTicks(min: number, max: number): number[] {
  const magnitude = 10 ** Math.floor(Math.log10((max - min) / 3 || 1));
  const countFor = (step: number) => Math.floor(max / step + 1e-6) - Math.ceil(min / step - 1e-6) + 1;
  const step = [1, 2, 5, 10]
    .map((m) => m * magnitude)
    .reduce((best, s) => (Math.abs(countFor(s) - 3) < Math.abs(countFor(best) - 3) ? s : best));
  const ticks: number[] = [];
  for (let value = Math.ceil(min / step) * step; value <= max + step * 1e-6; value += step) {
    ticks.push(Number(value.toFixed(6)));
  }
  return ticks;
}

function axisDateLabel(date: string, longRange: boolean) {
  return format(parseISO(date), longRange ? "MMM yyyy" : "MMM d");
}

/** The pointer's day, and where a mouse drag started when measuring between two days. */
type Selection = { index: number; anchor: number | null };

/** The earlier and later day of a mouse drag, or null when not measuring. */
function measuredSpan(selection: Selection | null): [number, number] | null {
  if (!selection || selection.anchor === null || selection.anchor === selection.index) return null;
  return [Math.min(selection.anchor, selection.index), Math.max(selection.anchor, selection.index)];
}

function dayLabel(date: string) {
  return format(parseISO(date), "MMM d");
}

function ScoreLine({
  points,
  width,
  color,
  selection,
  onSelectionChange,
}: {
  points: readonly GrowScorePoint[];
  width: number;
  color: string;
  selection: Selection | null;
  onSelectionChange: (next: Selection | null) => void;
}) {
  const last = points.length - 1;
  const scores = points.map((point) => point.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const flat = min === max;
  const scoreSpan = flat ? 1 : max - min;
  const innerWidth = width - PAD.left - PAD.right;
  const innerHeight = PLOT_HEIGHT - PAD.top - PAD.bottom;
  const axisY = PLOT_HEIGHT - PAD.bottom;
  const xFor = (index: number) => PAD.left + (last > 0 ? (index / last) * innerWidth : innerWidth / 2);
  const yFor = (score: number) =>
    flat ? PAD.top + innerHeight / 2 : PAD.top + (1 - (score - min) / scoreSpan) * innerHeight;
  const pathFor = (from: number, to: number) =>
    points
      .slice(from, to + 1)
      .map((point, offset) => `${offset ? "L" : "M"}${xFor(from + offset).toFixed(1)} ${yFor(point.score).toFixed(1)}`)
      .join(" ");

  const indexAt = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const scale = rect.width / width;
    const ratio = (event.clientX - rect.left - PAD.left * scale) / Math.max(innerWidth * scale, 1);
    return Math.round(Math.min(Math.max(ratio, 0), 1) * last);
  };

  const span = measuredSpan(selection);
  const markers = span ?? (selection ? [selection.index] : []);
  const highlight = span ?? (selection ? [0, selection.index] : null);
  const longRange =
    last > 0 && parseISO(points[last]!.date).getTime() - parseISO(points[0]!.date).getTime() > 120 * 86_400_000;
  const dateTicks = [...new Set(last > 1 ? [0, Math.round(last / 2), last] : [0, last])];

  return (
    <svg
      width="100%"
      height={PLOT_HEIGHT}
      viewBox={`0 0 ${width} ${PLOT_HEIGHT}`}
      preserveAspectRatio="none"
      className="block cursor-crosshair touch-pan-y select-none"
      onPointerDown={(event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        event.preventDefault();
        const index = indexAt(event);
        const mouse = event.pointerType === "mouse";
        if (mouse) event.currentTarget.setPointerCapture(event.pointerId);
        onSelectionChange({ index, anchor: mouse ? index : null });
      }}
      onPointerMove={(event) => {
        const index = indexAt(event);
        onSelectionChange({ index, anchor: selection?.anchor ?? null });
      }}
      onPointerUp={(event) => {
        onSelectionChange(event.pointerType === "mouse" ? { index: indexAt(event), anchor: null } : null);
      }}
      onPointerLeave={() => {
        if (selection?.anchor == null) onSelectionChange(null);
      }}
      onPointerCancel={() => onSelectionChange(null)}
    >
      <g data-score-axis="" aria-hidden>
        {(flat ? [min] : scoreTicks(min, max)).map((tick) => (
          <g key={tick}>
            <line x1={PAD.left} x2={width - PAD.right} y1={yFor(tick)} y2={yFor(tick)} {...GRID} />
            <text x={width - PAD.right + 6} y={yFor(tick)} dominantBaseline="middle" {...AXIS_TEXT}>
              {Number.isInteger(tick) ? tick : tick.toFixed(1)}
            </text>
          </g>
        ))}
        <line
          data-score-baseline=""
          x1={PAD.left}
          x2={width - PAD.right}
          y1={yFor(points[0]!.score)}
          y2={yFor(points[0]!.score)}
          stroke="var(--muted-foreground)"
          strokeOpacity={0.6}
          strokeDasharray="1 3"
          vectorEffect="non-scaling-stroke"
        />
        <line x1={PAD.left} x2={width - PAD.right} y1={axisY} y2={axisY} stroke="var(--border)" vectorEffect="non-scaling-stroke" />
        {dateTicks.map((index, position) => (
          <text
            key={index}
            x={xFor(index)}
            y={PLOT_HEIGHT - 6}
            textAnchor={position === 0 ? "start" : index === last ? "end" : "middle"}
            {...AXIS_TEXT}
          >
            {axisDateLabel(points[index]!.date, longRange)}
          </text>
        ))}
      </g>
      {span ? (
        <rect
          data-score-measure=""
          x={xFor(span[0])}
          width={xFor(span[1]) - xFor(span[0])}
          y={PAD.top - 6}
          height={axisY - PAD.top + 6}
          fill={color}
          fillOpacity={0.08}
        />
      ) : null}
      <path
        d={pathFor(0, last)}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeOpacity={highlight ? 0.3 : 1}
        vectorEffect="non-scaling-stroke"
      />
      {highlight ? (
        <path
          data-score-highlight=""
          d={pathFor(highlight[0], highlight[1])}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {markers.map((index) => {
        const point = points[index]!;
        const x = xFor(index);
        const labelX = Math.min(Math.max(x, PAD.left + 22), width - PAD.right - 22);
        return (
          <g key={`marker-${index}`} data-score-marker={point.date}>
            <line
              x1={x}
              x2={x}
              y1={PAD.top - 6}
              y2={axisY}
              stroke="var(--muted-foreground)"
              strokeOpacity={0.5}
              vectorEffect="non-scaling-stroke"
            />
            <text x={labelX} y={14} textAnchor="middle" fontSize={12} fill="var(--muted-foreground)">
              {dayLabel(point.date)}
            </text>
            <circle cx={x} cy={yFor(point.score)} r={4.5} fill={color} stroke="var(--card)" strokeWidth={2} />
          </g>
        );
      })}
    </svg>
  );
}

function ScoreChange({ change, label }: { change: number; label: string }) {
  const rounded = Number(change.toFixed(1));
  const trend = rounded > 0 ? "up" : rounded < 0 ? "down" : "flat";
  return (
    <p
      data-testid="grow-score-change"
      data-trend={trend}
      className={cn(
        "mt-1 font-sans text-sm font-medium tabular-nums",
        trend === "up" ? "text-gain" : trend === "down" ? "text-destructive" : "text-muted-foreground"
      )}
    >
      {`${rounded > 0 ? "+" : rounded < 0 ? "−" : "±"}${Math.abs(rounded).toFixed(1)}`}
      <span className="ml-1.5 font-normal text-muted-foreground">{label}</span>
    </p>
  );
}

export function GrowScoreTrendChart({
  title,
  series,
  topPercent = null,
  children,
}: {
  /** Section heading, rendered inside the card. */
  title: string;
  series: readonly GrowScorePoint[];
  /** Rank among all real accounts by current score, shown as "Top N%". */
  topPercent?: number | null;
  /** Rendered below the chart, e.g. the overall stats tiles. */
  children?: ReactNode;
}) {
  const plotRef = useRef<HTMLDivElement>(null);
  const [plotWidth, setPlotWidth] = useState<number | null>(null);
  const [range, setRange] = useState<GrowScoreRange>("all");
  const [selection, setSelection] = useState<Selection | null>(null);
  const visible = useMemo(() => sliceGrowScoreRange(series, range), [series, range]);

  useLayoutEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    const apply = () => {
      const width = Math.round(el.clientWidth);
      if (width > 0) setPlotWidth(width);
    };
    apply();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const latest = visible.at(-1);
  const first = visible[0];
  if (!latest || !first) {
    return null;
  }

  const color = latest.score >= first.score ? UP_COLOR : DOWN_COLOR;
  const span = measuredSpan(selection);
  const shown = (selection ? visible[selection.index] : undefined) ?? latest;
  let change = shown.score - first.score;
  let changeLabel = growScoreRangePeriodLabel(range);
  if (span) {
    const from = visible[span[0]]!;
    const to = visible[span[1]]!;
    change = to.score - from.score;
    changeLabel = `${dayLabel(from.date)} – ${dayLabel(to.date)}`;
  }

  return (
    <section
      className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm"
      data-testid="progress-grow-score-trend"
    >
      <div className="flex items-center gap-1.5">
        <h3 className="type-title text-2xl tracking-tight">{title}</h3>
        <TooltipIcon content={GROW_SCORE_CHART_HELP} label={`${title} definition`} />
      </div>
      <div className="mt-2 flex items-baseline gap-3">
        <p className="type-stat text-4xl tracking-tight tabular-nums">
          {shown.score.toFixed(1)}
        </p>
        {selection === null && topPercent !== null ? (
          <span className="font-sans text-sm text-muted-foreground">Top {topPercent}%</span>
        ) : null}
      </div>
      <ScoreChange change={change} label={changeLabel} />

      <div
        ref={plotRef}
        className="mt-4 w-full min-w-0"
        role="img"
        aria-label={`${title}, ${formatGrowScoreRangeLabel(first.date, latest.date)}`}
      >
        <ScoreLine
          points={visible}
          width={plotWidth ?? FALLBACK_WIDTH}
          color={color}
          selection={selection}
          onSelectionChange={setSelection}
        />
      </div>

      <div role="group" aria-label="Goal score range" className="mt-2 flex gap-1 border-b border-border">
        {GROW_SCORE_RANGE_OPTIONS.map((option) => {
          const selected = option.value === range;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setSelection(null);
                setRange(option.value);
              }}
              style={selected ? { color, borderColor: color } : undefined}
              className={cn(
                "-mb-px h-9 border-b-2 px-3 font-sans text-[13px] font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                selected ? "" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {children ? (
        <div className="mt-5 border-t border-border pt-4">{children}</div>
      ) : null}
    </section>
  );
}
