import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TabOnboardingOverlay } from "@/features/onboarding/tab-onboarding-overlay";

function mockOnboardingTargetRects(
  rect: DOMRect = new DOMRect(20, 20, 80, 24)
) {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function mockClientRect(this: HTMLElement) {
      if (this.hasAttribute("data-onboarding")) {
        return rect;
      }
      return new DOMRect(0, 0, 0, 0);
    }
  );
}

describe("TabOnboardingOverlay", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("walks through in-page targets without blurring the background", async () => {
    mockOnboardingTargetRects();
    render(
      <>
        <div data-onboarding="planner.calendar.controls">Calendar controls</div>
        <div data-onboarding="planner.calendar.board">Calendar board</div>
        <TabOnboardingOverlay onboardingKey="planner.calendar" />
      </>
    );

    expect(await screen.findByRole("dialog", { name: "Plan views" })).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-highlight")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Plan views" }).parentElement).toHaveClass(
      "z-[80]"
    );
    expect(screen.queryByRole("dialog", { name: "Plan views" })).not.toHaveClass(
      "backdrop-blur-sm"
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("dialog", { name: "Try the board" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Got it" }));

    expect(screen.queryByRole("dialog", { name: "Try the board" })).toBeNull();
    expect(
      window.localStorage.getItem(
        "cadence.tab_onboarding_completed.v1:planner.calendar"
      )
    ).toBe("done");
  });

  it("stays hidden after completion unless force-opened", async () => {
    window.localStorage.setItem(
      "cadence.tab_onboarding_completed.v1:planner.calendar",
      "done"
    );

    const { rerender } = render(
      <TabOnboardingOverlay onboardingKey="planner.calendar" />
    );
    expect(screen.queryByRole("dialog", { name: "Plan views" })).toBeNull();

    rerender(
      <TabOnboardingOverlay onboardingKey="planner.calendar" forceOpen />
    );
    expect(await screen.findByRole("dialog", { name: "Plan views" })).toBeInTheDocument();
  });

  it("walks through community sections starting on Leaderboards", async () => {
    render(
      <>
        <div data-onboarding="social.leaderboards">Leaderboards</div>
        <div data-onboarding="social.team">Team</div>
        <TabOnboardingOverlay onboardingKey="social.main" />
      </>
    );

    expect(await screen.findByRole("dialog", { name: "Leaderboards" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("dialog", { name: "Team" })).toBeInTheDocument();
  });

  it("prefers today's calendar cell over the full board on the last step", async () => {
    const rectFor = (target: string): DOMRect => {
      if (target === "planner.calendar.today") {
        return {
          top: 10,
          left: 10,
          width: 40,
          height: 40,
          bottom: 50,
          right: 50,
          x: 10,
          y: 10,
          toJSON: () => ({}),
        } as DOMRect;
      }
      if (target === "planner.calendar.board") {
        return {
          top: 100,
          left: 100,
          width: 400,
          height: 400,
          bottom: 500,
          right: 500,
          x: 100,
          y: 100,
          toJSON: () => ({}),
        } as DOMRect;
      }
      return {
        top: 20,
        left: 20,
        width: 80,
        height: 24,
        bottom: 44,
        right: 100,
        x: 20,
        y: 20,
        toJSON: () => ({}),
      } as DOMRect;
    };
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function mockClientRect(this: HTMLElement) {
        return rectFor(this.getAttribute("data-onboarding") ?? "");
      }
    );

    render(
      <>
        <div data-onboarding="planner.calendar.controls">Calendar controls</div>
        <div data-onboarding="planner.calendar.today">Today</div>
        <div data-onboarding="planner.calendar.board">Calendar board</div>
        <TabOnboardingOverlay onboardingKey="planner.calendar" />
      </>
    );

    fireEvent.click(await screen.findByRole("button", { name: "Next" }));
    expect(await screen.findByRole("dialog", { name: "Try the board" })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("onboarding-highlight")).toHaveStyle({
        top: "6px",
        left: "6px",
        width: "48px",
        height: "48px",
      });
    });
  });

  it("walks through insights including the missed-day history step", async () => {
    render(
      <>
        <div data-onboarding="insights.score">Score</div>
        <div data-onboarding="insights.views">Views</div>
        <div data-onboarding="insights.history">History</div>
        <TabOnboardingOverlay onboardingKey="insights.main" />
      </>
    );

    expect(
      await screen.findByRole("dialog", { name: "Goalmaxxing score" })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("dialog", { name: "Current and Past" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("dialog", { name: "Log a missed day" })).toBeInTheDocument();
  });
});
