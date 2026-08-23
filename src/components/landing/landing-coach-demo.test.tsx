import { cleanup, render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LandingCoachDemo } from "@/components/landing/landing-coach-demo";

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return {
    ...actual,
    useReducedMotion: () => false,
  };
});

class ImmediateIntersectionObserver {
  callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe(element: Element) {
    this.callback(
      [
        {
          isIntersecting: true,
          target: element,
        } as IntersectionObserverEntry,
      ],
      this as unknown as IntersectionObserver
    );
  }

  disconnect() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
}

describe("LandingCoachDemo", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", ImmediateIntersectionObserver);
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("sends a message, then reveals the coach reply", () => {
    render(<LandingCoachDemo />);

    expect(screen.queryByTestId("landing-coach-user")).not.toBeInTheDocument();
    expect(screen.queryByTestId("landing-coach-reply")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(screen.getByTestId("landing-coach-user")).toBeInTheDocument();
    expect(screen.queryByTestId("landing-coach-reply")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(screen.getByTestId("landing-coach-reply")).toBeInTheDocument();
  });

  it("does not play the conversation until the card intersects", () => {
    let observer: DeferredIntersectionObserver | undefined;
    class DeferredIntersectionObserver {
      callback: IntersectionObserverCallback;

      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
        observer = this;
      }

      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return [];
      }

      trigger() {
        this.callback(
          [
            {
              isIntersecting: true,
              target: document.createElement("div"),
            } as IntersectionObserverEntry,
          ],
          this as unknown as IntersectionObserver
        );
      }
    }

    vi.stubGlobal("IntersectionObserver", DeferredIntersectionObserver);
    render(<LandingCoachDemo />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByTestId("landing-coach-user")).not.toBeInTheDocument();
    expect(screen.queryByTestId("landing-coach-reply")).not.toBeInTheDocument();

    act(() => {
      observer?.trigger();
    });
    expect(screen.queryByTestId("landing-coach-user")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(screen.getByTestId("landing-coach-user")).toBeInTheDocument();
    expect(screen.queryByTestId("landing-coach-reply")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1300);
    });
    expect(screen.getByTestId("landing-coach-reply")).toBeInTheDocument();
  });
});
