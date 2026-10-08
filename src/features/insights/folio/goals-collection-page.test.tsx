import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildGoal } from "@/lib/goals/goal-test-fixtures";
import { summary } from "./folio-test-fixtures";
import { GoalsCollectionPage } from "./goals-collection-page";

const navigation = vi.hoisted(() => ({ pathname: "/goals" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname, useSearchParams: () => new URLSearchParams() }));
const mocks = vi.hoisted(() => ({ push: vi.fn(), data: vi.fn(), tracker: vi.fn() }));
vi.mock("@/lib/navigation/use-app-router", () => ({ useAppRouter: () => ({ push: mocks.push }) }));
vi.mock("@/features/insights/use-insights-data", () => ({ useInsightsData: () => mocks.data() }));
vi.mock("@/components/layout/app-boot-ready", () => ({ useReportAppSurfaceReady: vi.fn() }));
vi.mock("@/features/insights/insights-tab", () => ({ InsightsTab: (props: unknown) => { mocks.tracker(props); return <section data-testid="progress-tracker">Progress tracker</section>; } }));
beforeEach(() => { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-10-08T12:00:00")); });
afterEach(() => { cleanup(); navigation.pathname = "/goals"; vi.clearAllMocks(); vi.useRealTimers(); });

/** Opens a book on the past-goals shelf and lands the cover flight. */
function openBook(name: string) {
  fireEvent.click(within(document.getElementById("past-goals")!).getByRole("button", { name }));
  const reader = screen.getByRole("dialog");
  const flight = reader.querySelector("[data-folio-flight]");
  if (flight) fireEvent(flight, new Event("webkitAnimationEnd", { bubbles: true }));
  return reader;
}

function loadCollection() {
  const goal = buildGoal({ title: "Write six chapters", target_basis: "lifetime", target_count: 6, reward_text: "A weekend away" });
  mocks.data.mockReturnValue({ loading: false, loadError: null, reload: vi.fn(), state: { userId: "user-1", goals: [goal], progress: { summaries: [summary(goal.id, { creditedUnitCount: 2, expectedUnitCount: 6, placementTerminal: false, lifecycle: "active", outcome: "in_progress" })] } } });
}

describe("goal library journey", () => {
  it("keeps a partner collection read-only", () => {
    loadCollection();
    render(<GoalsCollectionPage subjectUserId="partner-1" readOnly anchorSections={false} />);
    expect(screen.queryByRole("link", { name: "New Goal" })).toBeNull();
    expect(screen.queryByRole("button", { name: /See details/ })).toBeNull();
    expect(mocks.tracker).not.toHaveBeenCalled();
    expect(document.getElementById("goal-library")).toBeNull();
  });
  it("opens Current from Goals with live progress and reward text", () => {
    loadCollection();
    render(<GoalsCollectionPage />);
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
    const current = screen.getByRole("heading", { name: "Current goals" });
    const past = screen.getByRole("heading", { name: "Past goals" });
    expect(current.compareDocumentPosition(past) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Goal library" })).toBeNull();
    expect(mocks.tracker).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "New Goal" })).toHaveAttribute("href", expect.stringContaining("/goals/new?returnTo="));
    expect(screen.queryByRole("navigation", { name: "Goal library collections" })).toBeNull();
  });

  it("keeps creation available with no current goals and files past goals into books by start date", () => {
    const ended = buildGoal({ owner_id: "user-1", start_date: "2026-08-01", end_date: "2026-09-30" });
    const older = buildGoal({ id: "older-goal", owner_id: "user-1", title: "Read 12 books", start_date: "2025-03-01", end_date: "2026-02-01" });
    mocks.data.mockReturnValue({ loading: false, loadError: null, reload: vi.fn(), state: {
      userId: "user-1", goals: [ended, older], progress: { summaries: [summary(ended.id), summary(older.id)] },
    } });
    render(<GoalsCollectionPage />);
    expect(screen.getByRole("link", { name: "New Goal" })).toBeInTheDocument();
    expect(screen.queryByTestId("progress-tracker")).toBeNull();
    const shelf = within(document.getElementById("past-goals")!);
    expect(shelf.getAllByRole("button", { name: /^Open / }).map(book => book.getAttribute("aria-label")))
      .toEqual(["Open August 2026, 1 goal", "Open 2025, 1 goal"]);
    expect(screen.queryByRole("article", { name: `${ended.title} goal card` })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Archived goals" })).toBeNull();

    const reader = openBook("Open August 2026, 1 goal");
    expect(within(reader).getByRole("article", { name: `${ended.title} goal card` })).toBeInTheDocument();
    fireEvent.click(within(reader).getByRole("button", { name: "See details" }));
    expect(mocks.push).toHaveBeenCalledWith(`/goals/${ended.id}`);
  });

  it("shows archived goals in their own section below past goals", () => {
    const ended = buildGoal({ owner_id: "user-1", title: "Run a 10k", end_date: "2026-09-30" });
    const archived = buildGoal({ id: "archived-goal", owner_id: "user-1", title: "Learn the cello", archived_at: "2026-09-15T00:00:00Z", end_date: "2027-01-01" });
    mocks.data.mockReturnValue({ loading: false, loadError: null, reload: vi.fn(), state: {
      userId: "user-1", goals: [ended, archived],
      progress: { summaries: [summary(ended.id), summary(archived.id, { lifecycle: "archived", outcome: "in_progress" })] },
    } });
    render(<GoalsCollectionPage />);
    const past = screen.getByRole("heading", { name: "Past goals" });
    const archivedHeading = screen.getByRole("heading", { name: "Archived goals" });
    expect(past.compareDocumentPosition(archivedHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const archivedSection = document.getElementById("archived-goals")!;
    expect(within(document.getElementById("past-goals")!).getAllByRole("button", { name: /^Open / })).toHaveLength(1);
    expect(archivedSection).toContainElement(screen.getByRole("article", { name: "Learn the cello goal card" }));
    expect(within(openBook("Open August 2026, 1 goal")).getByRole("article", { name: "Run a 10k goal card" })).toBeInTheDocument();
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
    render(<GoalsCollectionPage />);
    expect(screen.getByRole("status")).toHaveTextContent("6 / 6 completions");
    fireEvent.focus(document.querySelector("[data-goal-progress-card]")!);
    expect(document.querySelector(".tempo-card-surface")).toHaveAttribute("data-rotatable", "true");
    expect(document.querySelector("[data-reassembly]")).toHaveAttribute("data-fused", "true");
    expect(document.querySelector("[data-reassembly]")).not.toHaveAttribute("data-flat");
    expect(document.querySelector("[data-card-solid]")).not.toBeNull();
    expect(document.querySelector("[data-ghost]")).toBeNull();
  });

  it("opens goal details on the demo goal route", () => {
    navigation.pathname = "/demo/goals";
    const ended = buildGoal({ owner_id: "user-1", end_date: "2026-09-30" });
    mocks.data.mockReturnValue({ loading: false, loadError: null, reload: vi.fn(), state: {
      userId: "user-1", goals: [ended], progress: { summaries: [summary(ended.id)] },
    } });
    render(<GoalsCollectionPage />);
    fireEvent.click(within(openBook("Open August 2026, 1 goal")).getByRole("button", { name: "See details" }));
    expect(mocks.push).toHaveBeenCalledWith(`/demo/goals/${ended.id}`);
  });
});
