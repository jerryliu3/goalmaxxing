import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProfilePresenceSection } from "@/features/social/profile-presence";

vi.mock("@/features/insights/grow-score-trend-chart", () => ({
  GrowScoreTrendChart: ({
    title,
    children,
  }: {
    title: string;
    children?: ReactNode;
  }) => (
    <>
      <h3>{title}</h3>
      {children}
    </>
  ),
}));

vi.mock("@/features/insights/insights-overall-stats-card", () => ({
  InsightsOverallStatsTiles: () => <p>Overall stats tiles</p>,
}));

afterEach(cleanup);

const overallStats = {
  totalActivities: 20,
  totalGoalsCompleted: 4,
  todayActivities: 1,
  activeStreakDays: 3,
  currentWeekActivities: { current: 7, previous: 5, delta: 2, deltaPercent: 40 },
  currentMonthActivities: { current: 15, previous: 12, delta: 3, deltaPercent: 25 },
};

describe("ProfilePresenceSection", () => {
  it("renders the Goalmaxxing score and overall stats when the series has signal", () => {
    render(
      <ProfilePresenceSection
        selectedYear={2026}
        heatmap={[{ date: "2026-01-02", count: 2 }]}
        growSeries={[
          { date: "2026-09-01", score: 12, pace: 10, rawCredits: 1 },
        ]}
        overallStats={overallStats}
      />
    );

    expect(screen.getByRole("heading", { name: "Goalmaxxing score" })).toBeInTheDocument();
    expect(screen.getByText("Overall stats")).toBeInTheDocument();
    expect(screen.getByText("Overall stats tiles")).toBeInTheDocument();
    expect(screen.getByText("2026 activity")).toBeInTheDocument();
  });

  it("keeps overall stats and the heatmap when the score is still flat", () => {
    render(
      <ProfilePresenceSection
        selectedYear={2026}
        heatmap={[{ date: "2026-01-02", count: 0 }]}
        growSeries={[{ date: "2026-09-01", score: 0, pace: 0, rawCredits: 0 }]}
        overallStats={overallStats}
      />
    );

    expect(screen.queryByRole("heading", { name: "Goalmaxxing score" })).toBeNull();
    expect(screen.getByText("Overall stats")).toBeInTheDocument();
    expect(screen.getByText("2026 activity")).toBeInTheDocument();
  });
});
