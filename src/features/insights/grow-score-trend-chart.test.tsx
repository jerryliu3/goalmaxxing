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
      screen.getByRole("img", { name: "Goal score over the last 4 weeks" }),
    ).toBeInTheDocument();
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
});
