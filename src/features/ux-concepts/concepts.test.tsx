import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { COMPLETION_HOLD_MS } from "@/components/ui/completion-toggle";
import { ConceptsIndex } from "@/features/ux-concepts/concepts-index";
import { TodayHomeConcept } from "@/features/ux-concepts/today-home-concept";
import { SpatialPlanConcept } from "@/features/ux-concepts/spatial-plan-concept";
import { SpatialHomeConcept } from "@/features/ux-concepts/spatial-home-concept";
import { ProgressPulseConcept } from "@/features/ux-concepts/progress-pulse-concept";
import { PatternsGallery } from "@/features/ux-concepts/patterns-gallery";
import { APPLICATION_PRINCIPLES } from "@/features/ux-concepts/pattern-library";
import { ProgressPulseDestination, ProgressLedgerDestination, ProgressMapDestination } from "@/features/ux-concepts/progress-destinations";
import { CommunityCompeteDestination, CommunityDuoDestination, CommunityBoardDestination, CommunityQuietDestination } from "@/features/ux-concepts/community-destinations";
import { YouAccountDestination, YouListDestination, YouPersonDestination, YouControlsDestination } from "@/features/ux-concepts/you-destinations";
import { GoalCardConcept } from "@/features/ux-concepts/goal-card-concept";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(cleanup);

describe("ux concept gallery", () => {
  it("locks B and points at destination debates plus Spatial Home", () => {
    render(<ConceptsIndex />);
    expect(
      screen.getByRole("heading", { name: /home is locked/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/leading hybrid/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /open progress/i })).toHaveAttribute(
      "href",
      "/ux/concepts/progress"
    );
    expect(screen.getByRole("link", { name: /open community/i })).toHaveAttribute(
      "href",
      "/ux/concepts/community"
    );
    expect(screen.getByRole("link", { name: /open you/i })).toHaveAttribute(
      "href",
      "/ux/concepts/you"
    );
    expect(screen.getByRole("link", { name: /week pulse/i })).toHaveAttribute(
      "href",
      "/ux/concepts/progress/pulse"
    );
    const ledgerLinks = screen.getAllByRole("link", { name: /goal ledger/i });
    expect(
      ledgerLinks.some((link) => link.getAttribute("href") === "/ux/concepts/progress")
    ).toBe(true);
    expect(
      ledgerLinks.some((link) => link.getAttribute("href") === "/ux/concepts/progress/ledger")
    ).toBe(true);
    expect(screen.getByRole("link", { name: /continuity map/i })).toHaveAttribute(
      "href",
      "/ux/concepts/progress/map"
    );
    expect(screen.getByRole("link", { name: /s1/i })).toHaveAttribute(
      "href",
      "/ux/concepts/community/duo"
    );
    expect(screen.getByRole("link", { name: /shared board/i })).toHaveAttribute(
      "href",
      "/ux/concepts/community/board"
    );
    expect(screen.getByRole("link", { name: /quiet circle/i })).toHaveAttribute(
      "href",
      "/ux/concepts/community/quiet"
    );
    expect(screen.getByRole("link", { name: /settings list/i })).toHaveAttribute(
      "href",
      "/ux/concepts/you/list"
    );
    expect(screen.getByRole("link", { name: /y2/i })).toHaveAttribute(
      "href",
      "/ux/concepts/you/person"
    );
    expect(screen.getByRole("link", { name: /y3/i })).toHaveAttribute(
      "href",
      "/ux/concepts/you/controls"
    );
    expect(screen.getByRole("link", { name: /today home/i })).toHaveAttribute(
      "href",
      "/ux/concepts/today-home"
    );
    expect(screen.getByRole("link", { name: /spatial plan v1/i })).toHaveAttribute(
      "href",
      "/ux/concepts/spatial-plan"
    );
    expect(screen.getByRole("link", { name: /progress pulse/i })).toHaveAttribute(
      "href",
      "/ux/concepts/progress-pulse"
    );
    expect(screen.getByText(/launch notes \(task/i)).toBeInTheDocument();
  });

  it("puts Tempo run in the Today Home first viewport", () => {
    render(<TodayHomeConcept />);
    expect(screen.getByRole("heading", { name: "Thursday" })).toBeInTheDocument();
    expect(screen.getByText("Tempo run")).toBeInTheDocument();
    expect(screen.getByText("Launch notes")).toBeInTheDocument();
    expect(screen.getByText(/3 left/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /adapt strength/i }).length).toBeGreaterThan(
      0
    );
    vi.useFakeTimers();
    try {
      const toggle = screen.getByRole("button", { name: /complete tempo run/i });
      fireEvent.pointerDown(toggle);
      act(() => {
        vi.advanceTimersByTime(COMPLETION_HOLD_MS);
      });
    } finally {
      vi.useRealTimers();
    }
    expect(
      screen.getByRole("button", { name: /remove completion for tempo run/i })
    ).toBeInTheDocument();
  });

  it("makes goal-card detail disclosure explicit and keeps completion separate", async () => {
    const user = userEvent.setup();
    render(<GoalCardConcept />);
    const details = screen.getAllByRole("button", { name: "Details" });
    expect(details).toHaveLength(2);
    expect(details[0]).toHaveAttribute("aria-expanded", "false");
    await user.click(details[0]);
    expect(screen.getByRole("button", { name: "Overview" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    await user.click(details[1]);
    expect(screen.getByRole("button", { name: "Less detail" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    const complete = screen.getAllByRole("button", { name: /mark today’s session done/i });
    await user.click(complete[0]);
    expect(screen.getByRole("button", { name: "Session complete" })).toBeInTheDocument();
  });

  it("treats the calendar grid as Spatial Plan home", () => {
    render(<SpatialPlanConcept />);
    expect(screen.getByRole("heading", { name: "September 2026" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3", current: "date" })).toBeInTheDocument();
    expect(screen.getAllByText("Tempo run").length).toBeGreaterThan(0);
  });

  it("keeps week, month, and day as Plan views with Checklist as a peer", async () => {
    window.matchMedia = ((query: string) =>
      ({
        matches: query.includes("max-width"),
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList);
    const user = userEvent.setup();
    render(<SpatialHomeConcept />);
    expect(screen.getByRole("heading", { name: "This week" })).toBeInTheDocument();
    const agenda = screen.getByRole("list", { name: /week agenda/i });
    expect(within(agenda).getByText("Tempo run")).toBeInTheDocument();
    expect(within(agenda).queryByText("Review offer")).not.toBeInTheDocument();
    expect(within(agenda).getByText("Strength")).toBeInTheDocument();
    const thursday = within(agenda).getByRole("button", {
      name: /thursday, sep 3/i,
      current: "date",
    });
    const navs = screen.getAllByRole("navigation", { name: /concept destinations/i });
    for (const nav of navs) {
      expect(within(nav).queryByRole("button", { name: /^today$/i })).not.toBeInTheDocument();
      expect(within(nav).getByRole("button", { name: /checklist/i })).toBeInTheDocument();
      expect(within(nav).getByRole("button", { name: /community/i })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Day" })).toBeInTheDocument();
    await user.click(thursday);
    expect(screen.getByRole("heading", { name: "Thursday" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText(/3 left/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /complete review offer/i })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /complete tempo run/i })).toBeInTheDocument();
    await user.click(within(navs[0]).getByRole("button", { name: /checklist/i }));
    expect(screen.getByRole("heading", { name: "Checklist" })).toBeInTheDocument();
    expect(screen.getByText("Review offer")).toBeInTheDocument();
    expect(screen.getAllByText("Strength").length).toBeGreaterThan(0);
    await user.click(within(navs[0]).getByRole("button", { name: /^plan$/i }));
    await user.click(screen.getByRole("button", { name: "Month" }));
    expect(screen.queryByRole("list", { name: /week agenda/i })).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "September 2026" })
    ).toBeInTheDocument();
  });

  it("shows the cross-app pattern library as live atoms", () => {
    render(<PatternsGallery />);
    expect(
      screen.getByRole("heading", { name: /patterns that should hold everywhere/i })
    ).toBeInTheDocument();
    expect(screen.getByText(APPLICATION_PRINCIPLES[0].title, { exact: false })).toBeInTheDocument();
    expect(
      screen.getByText(/rows complete\. pills move\. sheets propose/i)
    ).toBeInTheDocument();
    expect(screen.getAllByText("Tempo run").length).toBeGreaterThan(0);
  });

  it("opens Progress Pulse on a week summary, then remaining work", () => {
    render(<ProgressPulseConcept />);
    expect(screen.getByRole("heading", { name: "7 of 10" })).toBeInTheDocument();
    expect(screen.getAllByText("Tempo run").length).toBeGreaterThan(0);
    expect(screen.getByText(/not a streak threat/i)).toBeInTheDocument();
    expect(screen.getAllByText(/maya completed yoga/i).length).toBeGreaterThan(0);
  });

  it("lets a Progress Ledger heatmap add and remove a completion", async () => {
    const user = userEvent.setup();
    render(<ProgressLedgerDestination />);
    expect(screen.getByRole("heading", { name: "Goals" })).toBeInTheDocument();
    expect(screen.getAllByText(/8 of 12/i).length).toBeGreaterThan(0);
    const thursday = screen.getAllByRole("button", {
      name: /thursday, sep 3, not completed/i,
    })[0];
    await user.click(thursday);
    expect(screen.getAllByText(/9 of 12/i).length).toBeGreaterThan(0);
    await user.click(
      screen.getAllByRole("button", { name: /thursday, sep 3, completed/i })[0]
    );
    expect(screen.getAllByText(/8 of 12/i).length).toBeGreaterThan(0);
  });

  it("switches Spatial Home week to a shared board in Duo", async () => {
    const user = userEvent.setup();
    render(<SpatialHomeConcept />);
    expect(screen.getByRole("list", { name: /week agenda/i })).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: /^duo$/i })[0]);
    expect(screen.queryByRole("list", { name: /week agenda/i })).not.toBeInTheDocument();
    const board = screen.getByLabelText(/shared week board/i);
    expect(within(board).getByRole("heading", { name: "Alex" })).toBeInTheDocument();
    expect(within(board).getByRole("heading", { name: "Maya" })).toBeInTheDocument();
  });

  it("offers three Progress destinations: pulse, ledger, and map", () => {
    render(<ProgressPulseDestination />);
    expect(screen.getByRole("heading", { name: "7 of 10" })).toBeInTheDocument();
    expect(screen.getByText(/not a streak threat/i)).toBeInTheDocument();
    cleanup();
    render(<ProgressLedgerDestination />);
    expect(screen.getByRole("heading", { name: "Goals" })).toBeInTheDocument();
    expect(screen.getAllByText(/8 of 12/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/unplaced on plan/i).length).toBeGreaterThan(0);
    cleanup();
    render(<ProgressMapDestination />);
    expect(screen.getByRole("heading", { name: "September 2026" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /thursday, sep 3/i, current: "date" })).toBeInTheDocument();
  });

  it("keeps Team, Challenges, and Leaderboards on Community and cuts the feed", async () => {
    const user = userEvent.setup();
    render(<CommunityCompeteDestination />);
    expect(screen.getByRole("heading", { name: "Community" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Team goals" })).toBeInTheDocument();
    expect(screen.getByText(/weekend hike/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^feed$/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^challenges$/i }));
    expect(screen.getByText(/september movement/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^leaderboards$/i }));
    expect(screen.getByText(/priya/i)).toBeInTheDocument();
  });

  it("offers three Community destinations: duo, board, and quiet circle", () => {
    render(<CommunityDuoDestination />);
    expect(screen.getByRole("heading", { name: "Maya" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /nudge maya/i })).toBeInTheDocument();
    cleanup();
    render(<CommunityBoardDestination />);
    expect(screen.getByRole("heading", { name: "Shared board" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Alex" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Maya" })).toBeInTheDocument();
    cleanup();
    render(<CommunityQuietDestination />);
    expect(screen.getByRole("heading", { name: "Quiet circle" })).toBeInTheDocument();
    expect(screen.queryByText(/level up/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/earned/i)).not.toBeInTheDocument();
    expect(screen.getByText(/completed yoga/i)).toBeInTheDocument();
  });

  it("puts identity on You above grouped controls", () => {
    render(<YouAccountDestination />);
    expect(screen.getByRole("heading", { name: "Alex" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit profile/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Plan" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Connected" })).toBeInTheDocument();
  });

  it("offers three You destinations: list, person, and controls", () => {
    render(<YouListDestination />);
    expect(screen.getByRole("heading", { name: "Alex" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /notifications/i })).toBeInTheDocument();
    cleanup();
    render(<YouPersonDestination />);
    expect(screen.getByText(/partner maya/i)).toBeInTheDocument();
    cleanup();
    render(<YouControlsDestination />);
    expect(screen.getByRole("heading", { name: "Controls" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Plan" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Connected" })).toBeInTheDocument();
  });
});
