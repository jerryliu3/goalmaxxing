import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ProgressOverviewLayout,
  type ProgressOverviewSectionContent,
} from "@/features/insights/progress-overview/progress-overview-layout";

function sections(): ProgressOverviewSectionContent[] {
  return [
    {
      id: "history",
      meta: "September",
      summary: <p>23 completions</p>,
      detail: <p>Completion ledger</p>,
      detailLabel: "history",
    },
    { id: "score", summary: <p>284</p>, detail: <p>Score trend</p>, detailLabel: "score" },
    { id: "week", summary: <p>6 of 12</p> },
    { id: "achievements", summary: <p>Three medals</p> },
    { id: "past-goals", summary: <p>One volume</p> },
  ];
}

describe("ProgressOverviewLayout", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/insights");
  });

  afterEach(cleanup);

  it("shows current sections in score, week, history order", () => {
    render(<ProgressOverviewLayout sections={sections()} />);

    expect(
      screen.getByRole("heading", { name: "Current progress" })
    ).toBeInTheDocument();
    const headings = screen
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
    expect(headings).toEqual([
      "Goalmaxxing score",
      "This week",
      "Completion history",
    ]);
    expect(screen.queryByText("Three medals")).not.toBeInTheDocument();
  });

  it("switches to the past sections from the mobile tabs and mirrors the view in the url", async () => {
    const user = userEvent.setup();
    render(<ProgressOverviewLayout sections={sections()} />);

    await user.click(screen.getByRole("tab", { name: "Past" }));

    expect(screen.getByRole("heading", { name: "Past progress" })).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)
    ).toEqual(["Achievements", "Past goals"]);
    expect(window.location.search).toBe("?view=past");

    await user.click(screen.getByRole("tab", { name: "Current" }));
    expect(window.location.search).toBe("");
  });

  it("expands a section in place instead of navigating away", async () => {
    const user = userEvent.setup();
    render(<ProgressOverviewLayout sections={sections()} />);

    expect(screen.queryByText("Completion ledger")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Inspect history/ }));
    expect(screen.getByText("Completion ledger")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Hide history/ }));
    expect(screen.queryByText("Completion ledger")).not.toBeInTheDocument();
  });

  it("jumps to a past section from the side index", async () => {
    const user = userEvent.setup();
    render(<ProgressOverviewLayout sections={sections()} />);

    const index = screen.getByTestId("progress-section-index");
    await user.click(within(index).getByRole("button", { name: "Achievements" }));

    expect(screen.getByRole("heading", { name: "Past progress" })).toBeInTheDocument();
    expect(screen.getByText("Three medals")).toBeInTheDocument();
    expect(within(index).getByRole("button", { name: "Achievements" })).toHaveAttribute(
      "aria-current",
      "true"
    );
  });

  it("opens the past view with achievements expanded for legacy hash links", () => {
    window.history.replaceState(null, "", "/insights#progress-achievements");
    render(<ProgressOverviewLayout sections={sections()} />);

    expect(screen.getByRole("heading", { name: "Past progress" })).toBeInTheDocument();
    expect(screen.getByText("Three medals")).toBeInTheDocument();
  });

  it("omits sections without content from the index", () => {
    render(
      <ProgressOverviewLayout
        sections={sections().filter((section) => section.id !== "past-goals")}
      />
    );

    const index = screen.getByTestId("progress-section-index");
    expect(within(index).queryByRole("button", { name: "Past goals" })).toBeNull();
    expect(within(index).getByRole("button", { name: "Achievements" })).toBeInTheDocument();
  });

  it("drops the view tabs when only one view has sections", () => {
    window.history.replaceState(null, "", "/insights?view=past");
    render(
      <ProgressOverviewLayout
        sections={sections().filter((section) => section.id === "week")}
      />
    );

    expect(screen.queryByRole("tab")).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Current progress" })
    ).toBeInTheDocument();
    expect(screen.getByText("6 of 12")).toBeInTheDocument();
  });
});
