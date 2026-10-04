import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildGoal } from "@/lib/goals/goal-test-fixtures";
import type { GoalViewSession } from "@/features/planner/goal-view/goal-view-model";
import { PlannerTimeWeave, type PlannerTimeWeaveProps } from "./planner-time-weave";

const mocks = vi.hoisted(() => ({ axis: vi.fn(), scrollToDate: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/calendar" }));
vi.mock("@/lib/ui/use-media-query", () => ({ useMediaQuery: () => true }));
vi.mock("./use-timeline-axis", () => ({ useTimelineAxis: (...args: unknown[]) => {
  mocks.axis(...args);
  return { ref: { current: null }, span: { start: "2026-09-28", days: 731 }, range: { first: 0, last: 6, firstVisible: 0 }, scrollToDate: mocks.scrollToDate };
} }));
vi.mock("@/features/planner/calendar-dnd", () => ({ PlannerDroppableDay: ({ children }: { children: (args: { setNodeRef: (node: HTMLElement | null) => void; isOver: boolean }) => import("react").ReactNode }) => children({ setNodeRef: vi.fn(), isOver: false }) }));
vi.mock("./timeline-session", () => ({ TimelineSession: ({ session, onOpen, onMove, onToggle, editable }: {
  session: GoalViewSession; onOpen: () => void; onMove: (date: string) => void; onToggle: (source: HTMLButtonElement) => void; editable: boolean;
}) => <div><button onClick={onOpen}>Open {session.label}</button><button disabled={!editable} onClick={() => onMove("2026-10-02")}>Move session</button><button onClick={(event) => onToggle(event.currentTarget)}>Complete session</button></div> }));
const goal = buildGoal({ id: "goal-a", title: "Run regularly" });
const session: GoalViewSession = {
  key: "goal-a:cadence:1", goalId: goal.id, date: "2026-09-30", time: "07:00", label: "Morning run", milestone: null, locked: false, done: false, draft: false,
  entry: { key: "goal-a:cadence:1", originalGoalId: goal.id, goalTitle: goal.title, unitKey: "cadence:1", label: "Morning run", classification: "open", creditState: "uncredited", activeGoal: null, activeItem: null, draftDiffKind: null, draftDiffFromDate: null, draftDiffToDate: null, draftGhost: false },
};
function props(): PlannerTimeWeaveProps {
  return { goals: [goal], sessions: [session], today: "2026-09-30", weekStartsOn: 1, loading: false, showCompletedGoals: false, completedGoalIds: new Set(), progressSummaries: [], canMutatePlanItems: true, optimisticCompletionFacts: new Map(), mutationLoadingKey: null, canOpenEntry: () => true, canMutateEntryOnDay: () => true, onMoveEntry: vi.fn(), onToggleEntry: vi.fn(), onVisibleDate: vi.fn(), onInspectDate: vi.fn(), onOpenEntry: vi.fn() };
}
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe("Agenda Goal View bindings", () => {
  it("opens at the user's current week and inspects days through the existing inspector", () => {
    const input = props();
    render(<PlannerTimeWeave {...input} />);
    expect(mocks.axis.mock.calls[0]?.[0]).toBe("2026-09-28");
    fireEvent.click(screen.getByRole("button", { name: "Inspect Wednesday, September 30, 2026" }));
    expect(input.onInspectDate).toHaveBeenCalledWith("2026-09-30");
  });
  it("routes edits and completions through the supplied canonical actions", () => {
    const input = props();
    render(<PlannerTimeWeave {...input} />);
    fireEvent.click(screen.getByRole("button", { name: "Open Morning run" }));
    expect(input.onOpenEntry).toHaveBeenCalledWith(session.entry, session.date);
    fireEvent.click(screen.getByRole("button", { name: "Move session" }));
    expect(input.onMoveEntry).toHaveBeenCalledWith(session.entry, "2026-10-02");
    fireEvent.click(screen.getByRole("button", { name: "Complete session" }));
    expect(input.onToggleEntry).toHaveBeenCalledWith(session.entry, session.date, expect.any(HTMLButtonElement));
  });
  it("retains the partner lane's read-only mutation restrictions", () => {
    const input = { ...props(), canMutatePlanItems: false, canMutateEntryOnDay: () => false };
    render(<PlannerTimeWeave {...input} />);
    expect(screen.getByRole("button", { name: "Move session" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Complete session" }));
    expect(input.onToggleEntry).not.toHaveBeenCalled();
  });
});
