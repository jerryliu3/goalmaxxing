import { act, cleanup, render, screen } from "@testing-library/react";
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
    vi.restoreAllMocks();
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

  it.each([["week", "goals"], ["goals", "day"]] as const)(
    "hands %s off to %s through the same morph frame",
    (from, to) => {
      vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
      const { container, rerender } = render(
        <PlanViewTransitionFrame viewMode={from}>
          <p>Outgoing view</p>
        </PlanViewTransitionFrame>
      );
      rerender(
        <PlanViewTransitionFrame viewMode={to}>
          <p>Incoming view</p>
        </PlanViewTransitionFrame>
      );

      expect(container.querySelector("[data-plan-view]")).toHaveAttribute(
        "data-plan-view",
        to
      );
      expect(container.querySelector("[data-plan-view-handoff]")).toHaveTextContent(
        "Outgoing view"
      );
    }
  );

  it.each([["week", "month"], ["month", "week"]] as const)(
    "keeps %s visible until the %s animation has painted its first frame",
    (from, to) => {
      const frames: FrameRequestCallback[] = [];
      vi.spyOn(window, "requestAnimationFrame").mockImplementation(callback => {
        frames.push(callback);
        return frames.length;
      });
      const { container, rerender } = render(
        <PlanViewTransitionFrame viewMode={from}>
          <p>Outgoing calendar</p>
        </PlanViewTransitionFrame>
      );
      rerender(
        <PlanViewTransitionFrame viewMode={to}>
          <p>Incoming calendar</p>
        </PlanViewTransitionFrame>
      );

      const live = container.querySelector<HTMLElement>('[data-plan-view]')!;
      const handoff = container.querySelector<HTMLElement>('[data-plan-view-handoff]')!;
      expect(live.style.opacity).toBe("0");
      expect(handoff).toHaveTextContent("Outgoing calendar");
      expect(handoff.style.opacity).toBe("1");
      expect(handoff.style.visibility).toBe("visible");
      expect(handoff).toHaveAttribute("inert");

      act(() => frames.shift()!(performance.now()));

      expect(container.querySelector('[data-plan-view-handoff]')).toBeNull();
      expect(container.querySelector<HTMLElement>('[data-plan-morph-overlay]')?.style.visibility).toBe("visible");
    }
  );

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
