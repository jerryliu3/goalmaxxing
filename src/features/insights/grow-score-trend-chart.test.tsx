import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import {
  GROW_SCORE_CHART_HELP,
  GrowScoreTrendChart,
} from "@/features/insights/grow-score-trend-chart";

afterEach(cleanup);

const series = [
  {
    date: "2026-09-01",
    score: 18,
    pace: 16,
    rawCredits: 2,
    earned: 2,
    mode: "earn" as const,
  },
  {
    date: "2026-09-02",
    score: 19.4,
    pace: 16.2,
    rawCredits: 1,
    earned: 1,
    mode: "earn" as const,
  },
];

describe("GrowScoreTrendChart", () => {
  it("renders the score line without measuring a parent container", () => {
    const { container } = render(
      <GrowScoreTrendChart title="Goal score" series={series} />,
    );

    expect(screen.getByRole("heading", { name: "Goal score" })).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Goal score, Sep 1 – Sep 2, 2026" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Sep 1 – Sep 2, 2026")).toBeInTheDocument();
    expect(container.querySelector("path")).not.toBeNull();
  });

  it("labels the latest value and explains the score", async () => {
    const user = userEvent.setup();
    render(<GrowScoreTrendChart title="Goal score" series={series} />);

    expect(screen.getByText("Current score")).toBeInTheDocument();
    expect(screen.getByText("19.4", { selector: "p" })).toBeInTheDocument();
    await user.hover(screen.getByRole("button", { name: "Goal score definition" }));
    expect(await screen.findByRole("tooltip")).toHaveTextContent(GROW_SCORE_CHART_HELP);
  });

  it("narrows the chart and its date label with the range toggles", async () => {
    const user = userEvent.setup();
    const long = ["2025-06-01", "2026-01-01", "2026-08-15", "2026-09-20", "2026-10-07"].map((date, index) => ({
      ...series[0]!,
      date,
      score: 10 + index,
    }));
    render(<GrowScoreTrendChart title="Goal score" series={long} />);

    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Jun 1, 2025 – Oct 7, 2026")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "1M" }));
    expect(screen.getByText("Sep 20 – Oct 7, 2026")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "YTD" }));
    expect(screen.getByText("Jan 1 – Oct 7, 2026")).toBeInTheDocument();
    expect(screen.getByText("14.0", { selector: "p" })).toBeInTheDocument();
  });

  it("shows the percentile under the current score when ranked", () => {
    const { rerender } = render(
      <GrowScoreTrendChart title="Goal score" series={series} topPercent={3} />,
    );
    expect(screen.getByText("Top 3%")).toBeInTheDocument();
    rerender(<GrowScoreTrendChart title="Goal score" series={series} />);
    expect(screen.queryByText(/^Top \d+%$/)).toBeNull();
  });
});
