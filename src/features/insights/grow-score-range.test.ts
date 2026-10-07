import { describe, expect, it } from "vitest";
import {
  formatGrowScoreRangeLabel,
  sliceGrowScoreRange,
} from "@/features/insights/grow-score-range";
import type { GrowScorePoint } from "@/lib/grow-score";

const point = (date: string): GrowScorePoint => ({
  date,
  score: 1,
  pace: 0,
  earned: 0,
  rawCredits: 0,
  mode: "hold",
});

const series = ["2025-09-01", "2025-10-07", "2026-01-01", "2026-07-07", "2026-09-07", "2026-10-07"].map(point);
const dates = (range: Parameters<typeof sliceGrowScoreRange>[1]) =>
  sliceGrowScoreRange(series, range).map((entry) => entry.date);

describe("sliceGrowScoreRange", () => {
  it("anchors every range to the latest day", () => {
    expect(dates("1m")).toEqual(["2026-09-07", "2026-10-07"]);
    expect(dates("3m")).toEqual(["2026-07-07", "2026-09-07", "2026-10-07"]);
    expect(dates("ytd")).toEqual(["2026-01-01", "2026-07-07", "2026-09-07", "2026-10-07"]);
    expect(dates("1y")).toEqual(["2025-10-07", "2026-01-01", "2026-07-07", "2026-09-07", "2026-10-07"]);
    expect(dates("all")).toHaveLength(series.length);
  });

  it("shows the whole history when it is shorter than the range", () => {
    expect(sliceGrowScoreRange([point("2026-10-01"), point("2026-10-07")], "1y")).toHaveLength(2);
    expect(sliceGrowScoreRange([], "1m")).toEqual([]);
  });
});

describe("formatGrowScoreRangeLabel", () => {
  it("states exact dates, adding the start year only across years", () => {
    expect(formatGrowScoreRangeLabel("2026-09-07", "2026-10-07")).toBe("Sep 7 – Oct 7, 2026");
    expect(formatGrowScoreRangeLabel("2025-10-07", "2026-10-07")).toBe("Oct 7, 2025 – Oct 7, 2026");
    expect(formatGrowScoreRangeLabel("2026-10-07", "2026-10-07")).toBe("Oct 7, 2026");
  });
});
