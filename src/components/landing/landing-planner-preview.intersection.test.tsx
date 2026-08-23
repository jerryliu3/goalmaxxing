import { cleanup, render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LandingPlannerPreview } from "@/components/landing/landing-planner-preview";

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return {
    ...actual,
    useReducedMotion: () => false,
  };
});

describe("LandingPlannerPreview intersection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("does not start the month choreography until the preview intersects", () => {
    let notify: IntersectionObserverCallback | undefined;
    class DeferredIntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        notify = callback;
      }

      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
    }

    vi.stubGlobal("IntersectionObserver", DeferredIntersectionObserver);
    render(<LandingPlannerPreview />);

    expect(screen.getByText("August overview")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(screen.getByText("August overview")).toBeInTheDocument();
    expect(
      screen.queryByText("Moving missed Tempo run forward")
    ).not.toBeInTheDocument();

    act(() => {
      notify?.(
        [
          {
            isIntersecting: true,
            target: document.createElement("div"),
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      );
    });

    act(() => {
      vi.advanceTimersByTime(1_100);
    });
    expect(
      screen.getByText("Moving missed Tempo run forward")
    ).toBeInTheDocument();
  });

  it("keeps the choreography running after the preview leaves the viewport", () => {
    let notify: IntersectionObserverCallback | undefined;
    class RecordingIntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        notify = callback;
      }

      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
    }

    vi.stubGlobal("IntersectionObserver", RecordingIntersectionObserver);
    render(<LandingPlannerPreview />);

    act(() => {
      notify?.(
        [
          {
            isIntersecting: true,
            target: document.createElement("div"),
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      );
    });
    act(() => {
      notify?.(
        [
          {
            isIntersecting: false,
            target: document.createElement("div"),
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      );
    });
    act(() => {
      vi.advanceTimersByTime(1_100);
    });

    expect(
      screen.getByText("Moving missed Tempo run forward")
    ).toBeInTheDocument();
  });
});
