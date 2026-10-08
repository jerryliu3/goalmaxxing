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

const account = vi.hoisted(() => ({
  progress: { completed_at: "2026-09-01T12:00:00Z" as string | null, tours: { "app.tabs": "complete" } as Record<string, string> },
  save: vi.fn(),
}));
vi.mock("./onboarding-progress-provider", () => ({ useOnboardingProgress: () => account }));

describe("TabOnboardingOverlay", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
    account.progress = { completed_at: "2026-09-01T12:00:00Z", tours: { "app.tabs": "complete" } };
    account.save.mockResolvedValue({});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
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

    expect(await screen.findByRole("dialog", { name: "Agenda views" })).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-highlight")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Agenda views" }).parentElement).toHaveClass(
      "z-[80]"
    );
    expect(screen.queryByRole("dialog", { name: "Agenda views" })).not.toHaveClass(
      "backdrop-blur-sm"
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("dialog", { name: "Try the board" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Finish tour" }));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Try the board" })).toBeNull());
    expect(account.save).toHaveBeenCalledWith({ action: "tour", key: "planner.calendar", status: "complete" });
  });

  it("stays hidden after completion unless force-opened", async () => {
    account.progress.tours["planner.calendar"] = "complete";
    const { rerender } = render(
      <TabOnboardingOverlay onboardingKey="planner.calendar" />
    );
    expect(screen.queryByRole("dialog", { name: "Agenda views" })).toBeNull();

    rerender(
      <TabOnboardingOverlay onboardingKey="planner.calendar" forceOpen />
    );
    expect(await screen.findByRole("dialog", { name: "Agenda views" })).toBeInTheDocument();
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

  it("walks through achievements and the goal library", async () => {
    render(
      <>
        <div data-onboarding="insights.achievements">Medals</div>
        <div data-onboarding="insights.history">Progress tracker</div>
        <TabOnboardingOverlay onboardingKey="insights.main" />
      </>
    );

    expect(await screen.findByRole("dialog", { name: "Achievements" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("dialog", { name: "Progress tracker" })).toBeInTheDocument();
  });
});
