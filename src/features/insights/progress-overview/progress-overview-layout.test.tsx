import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ProgressOverviewLayout,
  type ProgressOverviewSectionContent,
} from "@/features/insights/progress-overview/progress-overview-layout";

function sections(): ProgressOverviewSectionContent[] {
  return [
    { id: "history", content: <p>Completion ledger</p> },
    { id: "score", content: <p>Score trend</p> },
    { id: "week", content: <p>Week rhythm</p> },
    { id: "achievements", content: <p>Medal collection</p> },
    { id: "past-goals", content: <p>Goal library</p> },
  ];
}

describe("ProgressOverviewLayout", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/insights");
  });

  afterEach(cleanup);

  it("shows current sections in score, history, week order", () => {
    render(<ProgressOverviewLayout sections={sections()} />);

    const headings = screen
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
    expect(headings).toEqual([
      "Goalmaxxing score",
      "Completion history",
      "This week",
    ]);
    expect(screen.queryByText("Medal collection")).not.toBeInTheDocument();
  });

  it("leaves the heading to the content when a section renders its own", () => {
    render(
      <ProgressOverviewLayout
        sections={[{ id: "score", hideTitle: true, content: <p>Score trend</p> }]}
      />
    );

    expect(screen.queryByRole("heading", { level: 3 })).toBeNull();
    expect(
      screen.getByRole("region", { name: "Goalmaxxing score" })
    ).toBeInTheDocument();
  });

  it("renders each section fully expanded without an inspect control", () => {
    render(<ProgressOverviewLayout sections={sections()} />);

    expect(screen.getByText("Score trend")).toBeInTheDocument();
    expect(screen.getByText("Week rhythm")).toBeInTheDocument();
    expect(screen.getByText("Completion ledger")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Inspect/ })).toBeNull();
  });

  it("switches to the past sections from the mobile tabs and mirrors the view in the url", async () => {
    const user = userEvent.setup();
    render(<ProgressOverviewLayout sections={sections()} />);

    await user.click(screen.getByRole("tab", { name: "Past" }));

    expect(
      screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)
    ).toEqual(["Past goals", "Achievements"]);
    expect(screen.getByText("Medal collection")).toBeInTheDocument();
    expect(window.location.search).toBe("?view=past");

    await user.click(screen.getByRole("tab", { name: "Current" }));
    expect(window.location.search).toBe("");
  });

  it("jumps to a past section from the side index", async () => {
    const user = userEvent.setup();
    render(<ProgressOverviewLayout sections={sections()} />);

    const index = screen.getByTestId("progress-section-index");
    await user.click(within(index).getByRole("button", { name: "Achievements" }));

    expect(screen.getByText("Medal collection")).toBeInTheDocument();
    expect(within(index).getByRole("button", { name: "Achievements" })).toHaveAttribute(
      "aria-current",
      "true"
    );
  });

  it("opens the past view for legacy achievement hash links", () => {
    window.history.replaceState(null, "", "/insights#progress-achievements");
    render(<ProgressOverviewLayout sections={sections()} />);

    expect(screen.getByText("Medal collection")).toBeInTheDocument();
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
    expect(screen.getByText("Week rhythm")).toBeInTheDocument();
  });
});
