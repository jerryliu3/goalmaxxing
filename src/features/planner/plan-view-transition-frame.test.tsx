import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PlanViewTransitionFrame } from "@/features/planner/plan-view-transition-frame";

describe("PlanViewTransitionFrame", () => {
  afterEach(() => {
    cleanup();
  });

  it("tags the active plan view", () => {
    render(
      <PlanViewTransitionFrame viewMode="week">
        <p>Week board</p>
      </PlanViewTransitionFrame>
    );

    expect(screen.getByText("Week board").parentElement).toHaveAttribute(
      "data-plan-view",
      "week"
    );
  });
});
