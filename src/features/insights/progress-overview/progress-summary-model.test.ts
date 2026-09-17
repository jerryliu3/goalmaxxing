import { describe, expect, it } from "vitest";
import {
  buildProgressWeekStrip,
  growScoreSummary,
  historyMonthSummary,
} from "@/features/insights/progress-overview/progress-summary-model";
import type { WeekRhythmGoalRow } from "@/features/insights/week-rhythm-model";
import type { GrowScorePoint } from "@/lib/grow-score";

function point(date: string, score: number): GrowScorePoint {
  return { date, score, pace: 0, earned: 0, rawCredits: 0, mode: "hold" };
}

function row(
  goalId: string,
  days: Array<[string, "empty" | "planned" | "complete"]>
): WeekRhythmGoalRow {
  return {
    goalId,
    title: goalId,
    color: null,
    days: days.map(([date, state]) => ({ date, weekdayLabel: "Mon", state })),
  };
}

describe("growScoreSummary", () => {
  it("reports the latest score and its trailing-week change", () => {
    const series = Array.from({ length: 10 }, (_, index) =>
      point(`2026-09-${String(index + 1).padStart(2, "0")}`, 100 + index * 5)
    );

    expect(growScoreSummary(series)).toEqual({
      score: 145,
      weekDelta: 35,
      points: series.map((entry) => entry.score),
    });
  });

  it("falls back to the first point for short series and handles empty input", () => {
    expect(growScoreSummary([point("2026-09-01", 20), point("2026-09-02", 26)]))
      .toMatchObject({ score: 26, weekDelta: 6 });
    expect(growScoreSummary([])).toBeNull();
  });
});

describe("buildProgressWeekStrip", () => {
  it("collapses per-goal rows into one week of day states", () => {
    const strip = buildProgressWeekStrip({
      rows: [
        row("run", [
          ["2026-09-14", "complete"],
          ["2026-09-15", "planned"],
        ]),
        row("lift", [
          ["2026-09-14", "planned"],
          ["2026-09-15", "empty"],
        ]),
      ],
      asOfDate: "2026-09-16",
      weekStartsOn: 1,
    });

    expect(strip.days).toHaveLength(7);
    expect(strip.days[0]).toMatchObject({ date: "2026-09-14", state: "complete" });
    expect(strip.days[1]).toMatchObject({ date: "2026-09-15", state: "planned" });
    expect(strip.days[2]).toMatchObject({ date: "2026-09-16", state: "empty", isToday: true });
    expect(strip.rangeLabel).toBe("September 14–20");
  });

  it("labels weeks that span two months", () => {
    expect(
      buildProgressWeekStrip({ rows: [], asOfDate: "2026-09-30", weekStartsOn: 1 })
        .rangeLabel
    ).toBe("September 28 – October 4");
  });
});

describe("historyMonthSummary", () => {
  it("summarizes the month's completions and marks future days", () => {
    const summary = historyMonthSummary({
      month: new Date(2026, 8, 16),
      asOfDate: "2026-09-16",
      completions: [
        { goal_id: "run", completed_on: "2026-09-01" },
        { goal_id: "run", completed_on: "2026-09-02" },
        { goal_id: "lift", completed_on: "2026-09-02" },
        { goal_id: "run", completed_on: "2026-08-31" },
      ],
    });

    expect(summary.monthLabel).toBe("September 2026");
    expect(summary.days).toHaveLength(30);
    expect(summary.completions).toBe(3);
    expect(summary.goalCount).toBe(2);
    expect(summary.days[1]).toMatchObject({ date: "2026-09-02", count: 2, isFuture: false });
    expect(summary.days.at(-1)).toMatchObject({ date: "2026-09-30", isFuture: true });
  });
});
