import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TabOnboardingOverlay } from "@/features/onboarding/tab-onboarding-overlay";

describe("TabOnboardingOverlay", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("walks through in-page targets without blurring the background", async () => {
    render(
      <>
        <div data-onboarding="planner.surfaces">Planner tabs</div>
        <div data-onboarding="planner.calendar.controls">Calendar controls</div>
        <div data-onboarding="planner.calendar.board">Calendar board</div>
        <TabOnboardingOverlay onboardingKey="planner.calendar" />
      </>
    );

    expect(await screen.findByRole("dialog", { name: "Planner views" })).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-highlight")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Planner views" }).parentElement).toHaveClass(
      "z-[80]"
    );
    expect(screen.queryByRole("dialog", { name: "Planner views" })).not.toHaveClass(
      "backdrop-blur-sm"
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("dialog", { name: "Plan your sessions" })).toBeInTheDocument();
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
    expect(screen.queryByRole("dialog", { name: "Planner views" })).toBeNull();

    rerender(
      <TabOnboardingOverlay onboardingKey="planner.calendar" forceOpen />
    );
    expect(await screen.findByRole("dialog", { name: "Planner views" })).toBeInTheDocument();
  });

  it("walks through community tabs without including Team on the first step", async () => {
    render(
      <>
        <div data-onboarding="social.feed">Feed</div>
        <div data-onboarding="social.compete">Challenges</div>
        <div data-onboarding="social.compete">Leaderboards</div>
        <div data-onboarding="social.team">Team</div>
        <TabOnboardingOverlay onboardingKey="social.main" />
      </>
    );

    expect(await screen.findByRole("dialog", { name: "Feed" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(
      await screen.findByRole("dialog", { name: "Challenges and leaderboards" })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("dialog", { name: "Partner up" })).toBeInTheDocument();
  });

  it("prefers today's calendar cell over the full board on the last step", async () => {
    render(
      <>
        <div data-onboarding="planner.surfaces">Planner tabs</div>
        <div data-onboarding="planner.calendar.controls">Calendar controls</div>
        <div data-onboarding="planner.calendar.today">Today</div>
        <div data-onboarding="planner.calendar.board">Calendar board</div>
        <TabOnboardingOverlay onboardingKey="planner.calendar" />
      </>
    );

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
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        bottom: 0,
        right: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect;
    };
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function mockClientRect(this: HTMLElement) {
        return rectFor(this.getAttribute("data-onboarding") ?? "");
      }
    );

    fireEvent.click(await screen.findByRole("button", { name: "Next" }));
    fireEvent.click(await screen.findByRole("button", { name: "Next" }));
    expect(await screen.findByRole("dialog", { name: "Try the board" })).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-highlight")).toHaveStyle({
      top: "6px",
      left: "6px",
      width: "48px",
      height: "48px",
    });
  });

  it("walks through insights including the missed-day goal step", async () => {
    render(
      <>
        <div data-onboarding="insights.overall">Overall</div>
        <div data-onboarding="insights.goal-stats">Goal stats</div>
        <div data-onboarding="insights.goal">First goal</div>
        <TabOnboardingOverlay onboardingKey="insights.main" />
      </>
    );

    expect(await screen.findByRole("dialog", { name: "Overall stats" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("dialog", { name: "Goal stats" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("dialog", { name: "Edit a missed day" })).toBeInTheDocument();
  });
});
