import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import {
  GROW_SCORE_CHART_HELP,
  GrowScoreTrendChart,
  scoreTicks,
} from "@/features/insights/grow-score-trend-chart";

afterEach(cleanup);

const base = { pace: 16, rawCredits: 1, earned: 1, mode: "earn" as const };
const series = [
  { ...base, date: "2026-09-01", score: 18 },
  { ...base, date: "2026-09-02", score: 19.4 },
];
const week = ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-05"].map(
  (date, index) => ({ ...base, date, score: [10, 12, 11, 15, 20][index]! })
);

function plot() {
  const svg = screen.getByRole("img").querySelector("svg")!;
  svg.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 640, height: 240, right: 640, bottom: 240, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  return svg;
}

/** Pointer at the day `index` of `count` days across the 640px plot. */
function pointer(svg: SVGSVGElement, type: string, index: number, count: number) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: 6 + (index / (count - 1)) * 598 });
  Object.defineProperty(event, "pointerType", { value: "mouse" });
  fireEvent(svg, event);
  return event;
}

const score = () => screen.getByText(/^\d+\.\d$/, { selector: "p" });

describe("GrowScoreTrendChart", () => {
  it("draws one line over light score and date axes, and explains the score", async () => {
    const user = userEvent.setup();
    render(<GrowScoreTrendChart title="Goal score" series={week} />);

    expect(screen.getByRole("heading", { name: "Goal score" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Goal score, Sep 1 – Sep 5, 2026" })).toBeInTheDocument();
    const chart = screen.getByRole("img");
    expect(chart.querySelectorAll("path")).toHaveLength(1);
    const axis = within(chart.querySelector<HTMLElement>("[data-score-axis]")!);
    for (const label of ["10", "15", "20", "Sep 1", "Sep 3", "Sep 5"]) {
      expect(axis.getByText(label)).toBeInTheDocument();
    }
    expect(chart.querySelector("[data-score-baseline]")).not.toBeNull();
    expect(score()).toHaveTextContent("20.0");
    await user.hover(screen.getByRole("button", { name: "Goal score definition" }));
    expect(await screen.findByRole("tooltip")).toHaveTextContent(GROW_SCORE_CHART_HELP);
  });

  it("labels one day once and draws a flat score on a single gridline", () => {
    const { rerender } = render(
      <GrowScoreTrendChart title="Goal score" series={[{ ...base, date: "2026-09-01", score: 18 }]} />
    );
    const axis = () => within(screen.getByRole("img").querySelector<HTMLElement>("[data-score-axis]")!);
    expect(axis().getAllByText("Sep 1")).toHaveLength(1);
    expect(axis().getByText("18")).toBeInTheDocument();
    expect(axis().queryByText("19")).toBeNull();

    rerender(
      <GrowScoreTrendChart
        title="Goal score"
        series={[
          { ...base, date: "2026-09-01", score: 18 },
          { ...base, date: "2026-09-03", score: 18 },
        ]}
      />
    );
    expect(axis().getAllByText("18")).toHaveLength(1);
    expect(axis().queryByText("19")).toBeNull();
  });

  it("picks round score gridlines inside the range", () => {
    expect(scoreTicks(10, 20)).toEqual([10, 15, 20]);
    expect(scoreTicks(0.4, 81.5)).toEqual([20, 40, 60, 80]);
    expect(scoreTicks(18, 19.4)).toEqual([18, 18.5, 19]);
  });

  it("labels long ranges by month and year", () => {
    const long = ["2025-06-01", "2025-12-01", "2026-10-07"].map((date, index) => ({ ...base, date, score: index }));
    render(<GrowScoreTrendChart title="Goal score" series={long} />);
    const axis = within(screen.getByRole("img").querySelector<HTMLElement>("[data-score-axis]")!);
    expect(axis.getByText("Jun 2025")).toBeInTheDocument();
    expect(axis.getByText("Oct 2026")).toBeInTheDocument();
  });

  it("reports the change over the period in the trend color", () => {
    const { rerender } = render(<GrowScoreTrendChart title="Goal score" series={series} />);
    let change = screen.getByTestId("grow-score-change");
    expect(change).toHaveTextContent("+1.4All time");
    expect(change).toHaveAttribute("data-trend", "up");
    expect(change).toHaveClass("text-gain");

    rerender(<GrowScoreTrendChart title="Goal score" series={[series[1]!, { ...series[0]!, date: "2026-09-03", score: 17 }]} />);
    change = screen.getByTestId("grow-score-change");
    expect(change).toHaveTextContent("−2.4All time");
    expect(change).toHaveAttribute("data-trend", "down");
    expect(change).toHaveClass("text-destructive");
  });

  it("shows the percentile beside the current score only", () => {
    render(<GrowScoreTrendChart title="Goal score" series={week} topPercent={3} />);
    const percentile = screen.getByText("Top 3%");
    expect(score().parentElement).toContainElement(percentile);

    pointer(plot(), "pointermove", 1, week.length);
    expect(screen.queryByText("Top 3%")).toBeNull();
    fireEvent.pointerLeave(plot());
    expect(screen.getByText("Top 3%")).toBeInTheDocument();
  });

  it("scrubs to a day, labels it above the line, and dims the days after it", () => {
    const { container } = render(<GrowScoreTrendChart title="Goal score" series={week} />);
    const svg = plot();

    pointer(svg, "pointermove", 1, week.length);
    expect(score()).toHaveTextContent("12.0");
    expect(screen.getByTestId("grow-score-change")).toHaveTextContent("+2.0All time");
    expect(within(container.querySelector("[data-score-marker='2026-09-02']")!).getByText("Sep 2")).toBeInTheDocument();
    expect(container.querySelector("[data-score-highlight]")).not.toBeNull();
    expect(screen.getByRole("img").querySelector("path")).toHaveAttribute("stroke-opacity", "0.3");
  });

  it("measures the change between two days by dragging, without selecting text", () => {
    const { container } = render(<GrowScoreTrendChart title="Goal score" series={week} />);
    const svg = plot();

    const down = pointer(svg, "pointerdown", 1, week.length);
    expect(down.defaultPrevented).toBe(true);
    pointer(svg, "pointermove", 4, week.length);

    expect(container.querySelector("[data-score-measure]")).not.toBeNull();
    expect(container.querySelectorAll("[data-score-marker]")).toHaveLength(2);
    expect(score()).toHaveTextContent("20.0");
    expect(screen.getByTestId("grow-score-change")).toHaveTextContent("+8.0Sep 2 – Sep 5");

    pointer(svg, "pointerup", 4, week.length);
    expect(container.querySelector("[data-score-measure]")).toBeNull();
    expect(screen.getByTestId("grow-score-change")).toHaveTextContent("+10.0All time");
  });

  it("switches range from the tabs under the chart", async () => {
    const user = userEvent.setup();
    const long = ["2025-06-01", "2026-01-01", "2026-08-15", "2026-09-20", "2026-10-07"].map((date, index) => ({
      ...base,
      date,
      score: 10 + index,
    }));
    render(<GrowScoreTrendChart title="Goal score" series={long} />);
    const ranges = screen.getByRole("group", { name: "Goal score range" });

    expect(screen.getByRole("img").compareDocumentPosition(ranges) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(ranges).getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
    await user.click(within(ranges).getByRole("button", { name: "1M" }));
    expect(screen.getByRole("img", { name: "Goal score, Sep 20 – Oct 7, 2026" })).toBeInTheDocument();
    expect(screen.getByTestId("grow-score-change")).toHaveTextContent("+1.0Past month");
    await user.click(within(ranges).getByRole("button", { name: "YTD" }));
    expect(screen.getByTestId("grow-score-change")).toHaveTextContent("+3.0Year to date");
    expect(score()).toHaveTextContent("14.0");
  });
});
