import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildGoal } from "@/lib/goals/goal-test-fixtures";
import { summary } from "./folio-test-fixtures";
import { GoalLibraryPage } from "./goal-library-page";

vi.mock("next/navigation", () => ({ usePathname: () => "/goals/library", useSearchParams: () => new URLSearchParams() }));
const mocks = vi.hoisted(() => ({ push: vi.fn(), data: vi.fn(), tracker: vi.fn() }));
vi.mock("@/lib/navigation/use-app-router", () => ({ useAppRouter: () => ({ push: mocks.push }) }));
vi.mock("@/features/insights/use-insights-data", () => ({ useInsightsData: () => mocks.data() }));
vi.mock("@/components/layout/app-boot-ready", () => ({ useReportAppSurfaceReady: vi.fn() }));
vi.mock("@/features/insights/insights-tab", () => ({ InsightsTab: (props: unknown) => { mocks.tracker(props); return <section data-testid="progress-tracker">Progress tracker</section>; } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

function loadCollection() {
  const goal = buildGoal({ title: "Write six chapters", target_basis: "lifetime", target_count: 6, reward_text: "A weekend away" });
  mocks.data.mockReturnValue({ loading: false, loadError: null, reload: vi.fn(), state: { userId: "user-1", goals: [goal], progress: { summaries: [summary(goal.id, { creditedUnitCount: 2, expectedUnitCount: 6, placementTerminal: false, lifecycle: "active", outcome: "in_progress" })] } } });
}

describe("goal library journey", () => {
  it("opens Current from Goals with live progress and reward text", () => {
    loadCollection();
    render(<GoalLibraryPage />);
    expect(screen.getByRole("status")).toHaveTextContent("2 / 6 completions");
    expect(screen.getByText("A weekend away", { exact: false })).toBeInTheDocument();
    expect(document.querySelector(".tempo-card-surface")).toHaveAttribute("data-rotatable", "false");
    expect(document.querySelector(".tempo-card-surface")).toHaveAttribute("data-still", "true");
    expect(document.querySelector("[data-reassembly]")).toHaveAttribute("data-flat", "true");
    expect(document.querySelector("[data-ghost]")).not.toBeNull();
    expect(document.querySelector("[data-flat-shards]")).toHaveAttribute("data-piece-count", "2");
    expect(document.querySelectorAll("[data-reward-piece]")).toHaveLength(0);
    expect(document.querySelector("[data-card-solid]")).toBeNull();
    expect(screen.getAllByRole("article")).toHaveLength(2);
    const current = screen.getByRole("heading", { name: "Current Goals" });
    const tracker = screen.getByTestId("progress-tracker");
    const past = screen.getByRole("heading", { name: "Past Goals" });
    expect(current.compareDocumentPosition(tracker) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(tracker.compareDocumentPosition(past) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(mocks.tracker).toHaveBeenCalledWith(expect.objectContaining({ subjectUserId: "user-1", sectionIds: ["history"] }));
    expect(screen.getByRole("link", { name: "New Goal" })).toHaveAttribute("href", expect.stringContaining("/goals/new?returnTo="));
    expect(screen.queryByRole("navigation", { name: "Goal library collections" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Back to Goals" }));
    expect(mocks.push).toHaveBeenLastCalledWith("/goals");
  });

  it("keeps creation available with no current goals and displays the past collection below the tracker", () => {
    const ended = buildGoal({ owner_id: "user-1", end_date: "2026-09-30" });
    mocks.data.mockReturnValue({ loading: false, loadError: null, reload: vi.fn(), state: {
      userId: "user-1", goals: [ended], progress: { summaries: [summary(ended.id)] },
    } });
    render(<GoalLibraryPage showBack={false} />);
    expect(screen.getByRole("link", { name: "New Goal" })).toBeInTheDocument();
    const pastCard = screen.getByRole("article", { name: `${ended.title} goal card` });
    expect(screen.getByTestId("progress-tracker").compareDocumentPosition(pastCard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Goal details/ }));
    expect(mocks.push).toHaveBeenCalledWith(`/goals/${ended.id}`);
  });

  it("lets a fused current goal stay a draggable 3D card", () => {
    const goal = buildGoal({ title: "Write six chapters", target_basis: "lifetime", target_count: 6, reward_text: "A weekend away" });
    mocks.data.mockReturnValue({
      loading: false,
      loadError: null,
      reload: vi.fn(),
      state: {
        userId: "user-1",
        goals: [goal],
        progress: {
          summaries: [summary(goal.id, {
            creditedUnitCount: 6,
            expectedUnitCount: 6,
            placementTerminal: false,
            lifecycle: "active",
            outcome: "in_progress",
          })],
        },
      },
    });
    render(<GoalLibraryPage />);
    expect(screen.getByRole("status")).toHaveTextContent("6 / 6 completions");
    expect(document.querySelector(".tempo-card-surface")).toHaveAttribute("data-rotatable", "true");
    expect(document.querySelector("[data-reassembly]")).toHaveAttribute("data-fused", "true");
    expect(document.querySelector("[data-reassembly]")).not.toHaveAttribute("data-flat");
    expect(document.querySelector("[data-card-solid]")).not.toBeNull();
    expect(document.querySelector("[data-ghost]")).toBeNull();
  });
});
