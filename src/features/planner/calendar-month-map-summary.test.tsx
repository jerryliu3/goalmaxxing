import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CalendarMonthMapSummary } from "./calendar-month-map-summary";
import type { CalendarMonthCellEntryBase } from "./calendar-month-day-cell";

afterEach(cleanup);
const entry: CalendarMonthCellEntryBase = {
  key: "run:cadence:0",
  originalGoalId: "run",
  goalTitle: "Run",
  unitKey: "cadence:0",
  label: null,
  classification: "open",
  creditState: "uncredited",
  activeGoal: null,
  activeItem: null,
  draftDiffKind: null,
  draftDiffFromDate: null,
  draftDiffToDate: null,
  draftGhost: false,
};

describe("portrait month summary", () => {
  it("counts all placements, not just the three rendered marks", () => {
    const entries = Array.from({ length: 6 }, (_, index) => ({
      ...entry,
      key: `run:${index}`,
    }));
    const { container } = render(
      <CalendarMonthMapSummary
        entries={entries}
        recordedCount={0}
        isEntryCredited={() => false}
      />,
    );
    const summary = container.querySelector("[data-month-map-summary]")!;
    expect(summary).toHaveTextContent("6");
    expect(summary.firstElementChild?.children).toHaveLength(3);
    // The owning date announces full labels; summary marks do not add duplicate controls.
    expect(summary).toHaveAttribute("aria-hidden", "true");
  });

  it("excludes moved-from ghosts and does not count a pending placement as completed", () => {
    const { container } = render(
      <CalendarMonthMapSummary
        entries={[
          {
            ...entry,
            key: "ghost",
            draftGhost: true,
            draftDiffKind: "moved_from",
          },
          { ...entry, key: "new", draftDiffKind: "moved_to" },
          { ...entry, key: "done" },
        ]}
        recordedCount={2}
        isEntryCredited={() => true}
      />,
    );
    const counts = container.querySelector(
      "[data-month-map-summary]",
    )!.lastElementChild!;
    expect(counts.children[0]).toHaveTextContent("2");
    expect(counts.children[1]).toHaveTextContent("3");
  });

  it("reflects completion overlays supplied by the canonical calendar cell", () => {
    const { container, rerender } = render(
      <CalendarMonthMapSummary
        entries={[entry]}
        recordedCount={0}
        isEntryCredited={() => false}
      />,
    );
    const summary = () =>
      container.querySelector("[data-month-map-summary]")!.lastElementChild!;
    expect(summary().children).toHaveLength(1);
    rerender(
      <CalendarMonthMapSummary
        entries={[entry]}
        recordedCount={0}
        isEntryCredited={() => true}
      />,
    );
    expect(summary().children).toHaveLength(2);
  });
});
