import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PlanViewTransitionFrame } from "@/features/planner/plan-view-transition-frame";

describe("PlanViewTransitionFrame", () => {
  afterEach(() => {
    cleanup();
  });

  it("tags the active plan view for shared-element transitions", () => {
    render(
      <PlanViewTransitionFrame viewMode="week">
        <p>Week board</p>
      </PlanViewTransitionFrame>
    );

    expect(screen.getByText("Week board").parentElement).toHaveAttribute(
      "data-plan-view",
      "week"
    );
    expect(screen.getByText("Week board").parentElement).toHaveClass("plan-view-swap");
    expect(screen.getByText("Week board").parentElement).toHaveStyle({
      viewTransitionName: "plan-view-root",
    });
  });

  it("remounts the active view when the mode changes", () => {
    const { rerender } = render(
      <PlanViewTransitionFrame viewMode="week">
        <p>Week board</p>
      </PlanViewTransitionFrame>
    );
    rerender(
      <PlanViewTransitionFrame viewMode="month">
        <p>Month board</p>
      </PlanViewTransitionFrame>
    );

    expect(screen.getByText("Month board").parentElement).toHaveAttribute(
      "data-plan-view",
      "month"
    );
  });
});
