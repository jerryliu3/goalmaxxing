import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlannerGoalPresentation } from "./planner-goal-presentation";
import type { PlannerGoalViewProps } from "./planner-goal-view";
const mocks = vi.hoisted(() => ({ cards: vi.fn(), calendar: vi.fn() }));
vi.mock("./planner-goal-view", () => ({ PlannerGoalView: (props: unknown) => { mocks.cards(props); return <div data-testid="session-cards" />; } }));
vi.mock("@/features/planner/time-weave/planner-time-weave", () => ({ PlannerTimeWeave: (props: unknown) => { mocks.calendar(props); return <div data-testid="calendar-overview" />; } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function cards(): PlannerGoalViewProps {
  return { goals: [], sessions: [], progressSummaries: [], window: { start: "2026-09-09", end: "2026-12-07" },
    today: "2026-09-30", weekStartsOn: 1, showPast: false, completedGoalIds: new Set(), showCompletedGoals: false,
    canMutatePlanItems: true, optimisticCompletionFacts: new Map(), mutationLoadingKey: null,
    canOpenEntry: () => true, canMutateEntryOnDay: () => true, onMoveEntry: vi.fn(), onToggleEntry: vi.fn() };
}
describe("Goal View presentations", () => {
  it("defaults to session cards, switches to a read-only overview, and returns to the same cards", () => {
    const input = cards();
    render(<PlannerGoalPresentation {...input} loading={false} onVisibleDate={vi.fn()} onInspectDate={vi.fn()} />);
    expect(screen.getByTestId("session-cards")).toBeInTheDocument();
    expect(mocks.cards).toHaveBeenCalledWith(expect.objectContaining({ sessions: input.sessions, onMoveEntry: input.onMoveEntry, onToggleEntry: input.onToggleEntry }));
    fireEvent.click(screen.getByRole("button", { name: "See in calendar" }));
    expect(screen.getByTestId("calendar-overview")).toBeInTheDocument();
    expect(screen.queryByTestId("session-cards")).toBeNull();
    const overview = mocks.calendar.mock.calls.at(-1)?.[0];
    expect(overview.sessions).toBe(input.sessions);
    expect(overview).not.toHaveProperty("onMoveEntry");
    expect(overview).not.toHaveProperty("onToggleEntry");
    fireEvent.click(screen.getByRole("button", { name: "Back to goal cards" }));
    expect(screen.getByTestId("session-cards")).toBeInTheDocument();
    expect(input.onMoveEntry).not.toHaveBeenCalled();
    expect(input.onToggleEntry).not.toHaveBeenCalled();
  });
});
