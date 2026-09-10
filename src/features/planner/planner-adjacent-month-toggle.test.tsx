import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlannerAdjacentMonthToggle } from "@/features/planner/planner-adjacent-month-toggle";

describe("PlannerAdjacentMonthToggle", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders quiet text instead of an outlined button", () => {
    const onToggle = vi.fn();
    render(
      <PlannerAdjacentMonthToggle
        direction="previous"
        shown={false}
        onToggle={onToggle}
      />
    );

    const control = screen.getByRole("button", { name: "Show previous month" });
    expect(control).toHaveClass("text-muted-foreground/70");
    expect(control).not.toHaveClass("border");
    expect(control.querySelector("svg")).toHaveClass("plan-adjacent-month-nudge-up");
    fireEvent.click(control);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("nudges the next-month chevron downward while hiding", () => {
    render(
      <PlannerAdjacentMonthToggle
        direction="next"
        shown
        onToggle={() => {}}
      />
    );

    const control = screen.getByRole("button", { name: "Hide next month" });
    expect(control).toHaveAttribute("aria-pressed", "true");
    expect(control.querySelector("svg")).toHaveClass("plan-adjacent-month-nudge-down");
  });
});
