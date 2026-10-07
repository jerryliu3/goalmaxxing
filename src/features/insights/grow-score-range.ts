import { format, parseISO, subMonths, subYears } from "date-fns";
import type { SegmentedControlOption } from "@/components/ui/segmented-control";
import type { GrowScorePoint } from "@/lib/grow-score";

export type GrowScoreRange = "1m" | "3m" | "ytd" | "1y" | "all";

export const GROW_SCORE_RANGE_OPTIONS: ReadonlyArray<SegmentedControlOption<GrowScoreRange>> = [
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "ytd", label: "YTD" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "All" },
];

function rangeStart(range: GrowScoreRange, latest: string): string | null {
  const asOf = parseISO(latest);
  switch (range) {
    case "1m":
      return format(subMonths(asOf, 1), "yyyy-MM-dd");
    case "3m":
      return format(subMonths(asOf, 3), "yyyy-MM-dd");
    case "ytd":
      return `${latest.slice(0, 4)}-01-01`;
    case "1y":
      return format(subYears(asOf, 1), "yyyy-MM-dd");
    case "all":
      return null;
  }
}

/** Points from the range start through the latest day; shorter histories show everything. */
export function sliceGrowScoreRange(
  series: readonly GrowScorePoint[],
  range: GrowScoreRange,
): GrowScorePoint[] {
  const latest = series.at(-1);
  if (!latest) return [];
  const start = rangeStart(range, latest.date);
  return start ? series.filter((point) => point.date >= start) : [...series];
}

/** "Sep 7 – Oct 7, 2026", or with both years when the range crosses one. */
export function formatGrowScoreRangeLabel(from: string, to: string): string {
  const start = parseISO(from);
  const end = parseISO(to);
  if (from === to) return format(end, "MMM d, yyyy");
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  return `${format(start, sameYear ? "MMM d" : "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
}
