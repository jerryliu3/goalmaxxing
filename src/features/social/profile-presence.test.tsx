import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProfilePresenceSection } from "@/features/social/profile-presence";

vi.mock("@/features/insights/grow-score-trend-chart", () => ({
  GrowScoreTrendChart: ({ title }: { title: string }) => <h3>{title}</h3>,
}));

afterEach(cleanup);

describe("ProfilePresenceSection", () => {
  it("renders the Goalmaxxing score when the series has signal", () => {
    render(
      <ProfilePresenceSection
        selectedYear={2026}
        heatmap={[{ date: "2026-01-02", count: 2 }]}
        growSeries={[
          { date: "2026-09-01", score: 12, pace: 10, rawCredits: 1 },
        ]}
      />
    );

    expect(screen.getByRole("heading", { name: "Goalmaxxing score" })).toBeInTheDocument();
    expect(screen.getByText("2026 activity")).toBeInTheDocument();
  });

  it("keeps the activity heatmap when the score is still flat", () => {
    render(
      <ProfilePresenceSection
        selectedYear={2026}
        heatmap={[{ date: "2026-01-02", count: 0 }]}
        growSeries={[{ date: "2026-09-01", score: 0, pace: 0, rawCredits: 0 }]}
      />
    );

    expect(screen.queryByRole("heading", { name: "Goalmaxxing score" })).toBeNull();
    expect(screen.getByText("2026 activity")).toBeInTheDocument();
  });
});
