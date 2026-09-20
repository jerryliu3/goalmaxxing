import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ProgressOverviewLayout } from "@/features/insights/progress-overview/progress-overview-layout";
import {
  ProgressSectionStack,
  type ProgressOverviewSectionContent,
} from "@/features/insights/progress-overview/progress-section-stack";
import type { ProgressSectionId } from "@/features/insights/progress-overview/progress-view-model";

function sections(): ProgressOverviewSectionContent[] {
  return [
    { id: "history", content: <p>Completion ledger</p> },
    { id: "week", content: <p>Week rhythm</p> },
    { id: "achievements", content: <p>Medal collection</p> },
    { id: "past-goals", content: <p>Goal library</p> },
  ];
}

function renderLayout(content = sections()) {
  const ids = content.map((section) => section.id);
  return render(
    <ProgressOverviewLayout availableSectionIds={ids}>
      {(view) => <ProgressSectionStack sections={content} view={view} />}
    </ProgressOverviewLayout>
  );
}

describe("ProgressOverviewLayout", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/insights");
  });

  afterEach(cleanup);

  it("shows current sections in history, week order", () => {
    renderLayout();

    const headings = screen
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
    expect(headings).toEqual([
      "Completion history",
      "This week",
    ]);
    expect(screen.queryByText("Medal collection")).not.toBeInTheDocument();
  });

  it("renders each section fully expanded without an inspect control", () => {
    renderLayout();

    expect(screen.getByText("Week rhythm")).toBeInTheDocument();
    expect(screen.getByText("Completion ledger")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Inspect/ })).toBeNull();
  });

  it("switches to the past sections from the mobile tabs and mirrors the view in the url", async () => {
    const user = userEvent.setup();
    renderLayout();

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
    renderLayout();

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
    renderLayout();

    expect(screen.getByText("Medal collection")).toBeInTheDocument();
  });

  it("omits sections without content from the index", () => {
    renderLayout(sections().filter((section) => section.id !== "past-goals"));

    const index = screen.getByTestId("progress-section-index");
    expect(within(index).queryByRole("button", { name: "Past goals" })).toBeNull();
    expect(within(index).getByRole("button", { name: "Achievements" })).toBeInTheDocument();
  });

  it("drops the view tabs when only one view has sections", () => {
    window.history.replaceState(null, "", "/insights?view=past");
    renderLayout(sections().filter((section) => section.id === "week"));

    expect(screen.queryByRole("tab")).toBeNull();
    expect(screen.getByText("Week rhythm")).toBeInTheDocument();
  });

  it("indexes the union of lane sections and anchors only the first lane", () => {
    const viewerSections = sections().filter((section) => section.id !== "week");
    const partnerSections: ProgressOverviewSectionContent[] = [
      { id: "history", content: <p>Partner ledger</p> },
      { id: "week", content: <p>Partner week</p> },
    ];
    const ids: ProgressSectionId[] = [
      ...viewerSections.map((section) => section.id),
      ...partnerSections.map((section) => section.id),
    ];

    render(
      <ProgressOverviewLayout availableSectionIds={ids}>
        {(view) => (
          <>
            <ProgressSectionStack sections={viewerSections} view={view} />
            <ProgressSectionStack
              sections={partnerSections}
              view={view}
              anchored={false}
            />
          </>
        )}
      </ProgressOverviewLayout>
    );

    const index = screen.getByTestId("progress-section-index");
    expect(
      within(index)
        .getAllByRole("button")
        .map((button) => button.textContent)
    ).toEqual([
      "Completion history",
      "This week",
      "Past goals",
      "Achievements",
    ]);
    expect(screen.getAllByTestId("progress-section-history")).toHaveLength(1);
    expect(screen.getByText("Partner ledger")).toBeInTheDocument();
  });
});
