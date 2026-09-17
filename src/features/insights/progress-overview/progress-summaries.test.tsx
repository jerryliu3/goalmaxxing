import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProgressHistorySummary } from "@/features/insights/progress-overview/progress-history-summary";
import { ProgressScoreSummary } from "@/features/insights/progress-overview/progress-score-summary";
import { ProgressWeekSummary } from "@/features/insights/progress-overview/progress-week-summary";

describe("progress section summaries", () => {
  afterEach(cleanup);

  it("shows the rounded score, weekly change and a sparkline", () => {
    render(
      <ProgressScoreSummary
        summary={{ score: 283.6, weekDelta: 18.2, points: [200, 240, 283.6] }}
      />
    );

    expect(screen.getByText("284")).toBeInTheDocument();
    expect(screen.getByText("+18.2 this week")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Score trend/ })).toBeInTheDocument();
  });

  it("omits the sparkline when there is a single point", () => {
    render(<ProgressScoreSummary summary={{ score: 12, weekDelta: 0, points: [12] }} />);

    expect(screen.queryByRole("img")).toBeNull();
  });

  it("renders one knot per week day", () => {
    render(
      <ProgressWeekSummary
        days={[
          { date: "2026-09-14", weekdayLabel: "M", state: "complete", isToday: false },
          { date: "2026-09-15", weekdayLabel: "T", state: "planned", isToday: true },
        ]}
      />
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("2026-09-14: complete")).toBeInTheDocument();
  });

  it("captions the history strip with completions and goals", () => {
    render(
      <ProgressHistorySummary
        summary={{
          monthLabel: "September 2026",
          completions: 23,
          goalCount: 4,
          days: [
            { date: "2026-09-01", dayNumber: 1, count: 2, isFuture: false },
            { date: "2026-09-02", dayNumber: 2, count: 0, isFuture: true },
          ],
        }}
      />
    );

    expect(screen.getByText("23 completions · 4 goals")).toBeInTheDocument();
    expect(screen.getByTitle("2026-09-01: 2 completions")).toBeInTheDocument();
  });
});
