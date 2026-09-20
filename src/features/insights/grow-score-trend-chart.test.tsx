import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GrowScoreTrendChart } from "@/features/insights/grow-score-trend-chart";

afterEach(cleanup);

describe("GrowScoreTrendChart", () => {
  it("renders the score line without measuring a parent container", () => {
    const { container } = render(
      <GrowScoreTrendChart
        title="Goalmaxxing score"
        series={[
          {
            date: "2026-09-01",
            score: 18,
            pace: 16,
            rawCredits: 2,
            earned: 2,
            mode: "earn",
          },
          {
            date: "2026-09-02",
            score: 19.4,
            pace: 16.2,
            rawCredits: 1,
            earned: 1,
            mode: "earn",
          },
        ]}
      />
    );

    expect(screen.getByRole("heading", { name: "Goalmaxxing score" })).toBeInTheDocument();
    expect(container.querySelector("svg[aria-label='Goalmaxxing score over the last 4 weeks']")).not.toBeNull();
    expect(container.querySelector("path")).not.toBeNull();
  });
});
