import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PlannerCalendarSplit } from "@/features/planner/planner-calendar-split";
import { PLAN_CALENDAR_SPLIT_MAX } from "@/features/planner/planner-calendar-split-model";

function mockSplitWidth(element: HTMLElement, width: number) {
  element.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: width,
      bottom: 0,
      width,
      height: 0,
      toJSON: () => ({}),
    }) as DOMRect;
}

describe("PlannerCalendarSplit", () => {
  afterEach(() => {
    cleanup();
  });

  it("keeps the drag mapped to the start width so the calendar cannot jump back", () => {
    render(
      <PlannerCalendarSplit
        calendar={<div>Calendar</div>}
        pane={<div>Checklist</div>}
      />
    );

    const split = screen.getByTestId("plan-calendar-split");
    const separator = screen.getByRole("separator", {
      name: "Resize calendar and checklist",
    });
    mockSplitWidth(split, 1000);
    fireEvent.pointerDown(separator, { clientX: 720, pointerId: 1 });
    mockSplitWidth(split, 1400);
    fireEvent.pointerMove(separator, { clientX: 920, pointerId: 1 });

    expect(separator).toHaveAttribute(
      "aria-valuenow",
      String(Math.round(PLAN_CALENDAR_SPLIT_MAX * 100))
    );
    expect(split.style.getPropertyValue("--plan-split-calendar")).toBe(
      `${PLAN_CALENDAR_SPLIT_MAX}fr`
    );
  });

  it("nests the splitter with the calendar so its height follows the calendar", () => {
    render(
      <PlannerCalendarSplit
        calendar={<div>Calendar</div>}
        pane={<div>Checklist</div>}
      />
    );

    const calendarColumn = screen.getByTestId("plan-calendar-split-calendar");
    const separator = screen.getByRole("separator", {
      name: "Resize calendar and checklist",
    });
    expect(calendarColumn).toContainElement(separator);
    expect(calendarColumn).toHaveClass("items-stretch");
    expect(separator).not.toHaveClass("h-full");
  });
});
