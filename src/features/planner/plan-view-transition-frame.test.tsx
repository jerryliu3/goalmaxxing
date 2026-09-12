import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlanViewTransitionFrame } from "@/features/planner/plan-view-transition-frame";

describe("PlanViewTransitionFrame", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

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

  it("leaves the destination visible once the morph completes", () => {
    // Drive the morph to completion: the frame hides the destination before it can be
    // measured, and only the morph brings it back.
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(performance.now() + 10_000);
      return 1;
    });

    const { rerender } = render(
      <PlanViewTransitionFrame viewMode="week">
        <p>Week board</p>
      </PlanViewTransitionFrame>
    );
    rerender(
      <PlanViewTransitionFrame viewMode="day">
        <p>Day board</p>
      </PlanViewTransitionFrame>
    );

    const view = screen.getByText("Day board").parentElement as HTMLElement;
    expect(view.style.opacity).toBe("");
    expect(view.style.visibility).toBe("");
    expect(view.hasAttribute("inert")).toBe(false);
  });
});
