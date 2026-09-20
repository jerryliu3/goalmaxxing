import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildGoal } from "@/lib/goals/goal-test-fixtures";
import { summary } from "./folio-test-fixtures";
import { GoalLibraryPage } from "./goal-library-page";

const mocks = vi.hoisted(() => ({ push: vi.fn(), data: vi.fn() }));
vi.mock("@/lib/navigation/use-app-router", () => ({ useAppRouter: () => ({ push: mocks.push }) }));
vi.mock("@/features/insights/use-insights-data", () => ({ useInsightsData: () => mocks.data() }));
vi.mock("@/components/layout/app-boot-ready", () => ({ useReportAppSurfaceReady: vi.fn() }));
vi.mock("./folio-shelf", () => ({ FolioShelf: () => <p>Past volumes</p> }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

function loadCollection() {
  const goal = buildGoal({ title: "Write six chapters", target_basis: "lifetime", target_count: 6, reward_text: "A weekend away" });
  mocks.data.mockReturnValue({ loading: false, loadError: null, reload: vi.fn(), state: { userId: "user-1", goals: [goal], progress: { summaries: [summary(goal.id, { creditedUnitCount: 2, expectedUnitCount: 6, placementTerminal: false, lifecycle: "active", outcome: "in_progress" })] } } });
}

describe("goal library journey", () => {
  it("opens Current from Plan with live progress and reward text", () => {
    loadCollection();
    render(<GoalLibraryPage fromPlan />);
    expect(screen.getByRole("status")).toHaveTextContent("2 / 6 completions");
    expect(screen.getByText("A weekend away", { exact: false })).toBeInTheDocument();
    expect(document.querySelector(".tempo-card-surface")).toHaveAttribute("data-rotatable", "false");
    expect(document.querySelector(".tempo-card-surface")).toHaveAttribute("data-still", "true");
    expect(document.querySelector("[data-reassembly]")).toHaveAttribute("data-flat", "true");
    expect(document.querySelector("[data-ghost]")).not.toBeNull();
    expect(document.querySelectorAll("[data-reward-piece]")).toHaveLength(2);
    expect(document.querySelector("[data-card-solid]")).toBeNull();
    expect(screen.getAllByRole("article")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Past" }));
    expect(mocks.push).toHaveBeenCalledWith("/insights/folios?view=past&from=plan");
    fireEvent.click(screen.getByRole("button", { name: "Back to Plan" }));
    expect(mocks.push).toHaveBeenCalledWith("/calendar");
  });
  it("allows returning to Current when Past has no volumes", () => {
    loadCollection();
    render(<GoalLibraryPage view="past" />);
    expect(screen.getByText("No past goals yet.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Current" }));
    expect(mocks.push).toHaveBeenCalledWith("/insights/folios?view=current");
  });
});
