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
const goal = buildGoal({ id: "goal-a", title: "Run regularly" });
const session: GoalViewSession = {
  key: "goal-a:cadence:1", goalId: goal.id, date: "2026-09-30", time: "07:00", label: "Morning run", milestone: null, locked: false, done: false, draft: false,
  entry: { key: "goal-a:cadence:1", originalGoalId: goal.id, goalTitle: goal.title, unitKey: "cadence:1", label: "Morning run", classification: "open", creditState: "uncredited", activeGoal: null, activeItem: null, draftDiffKind: null, draftDiffFromDate: null, draftDiffToDate: null, draftGhost: false },
};
function props(): PlannerTimeWeaveProps {
  return { goals: [goal], sessions: [session], today: "2026-09-30", weekStartsOn: 1, loading: false,
    showCompletedGoals: false, completedGoalIds: new Set(), onVisibleDate: vi.fn(), onInspectDate: vi.fn() };
}
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe("Time Weave overview", () => {
  it("opens at the user's current week and uses the day inspector", () => {
    const input = props();
    render(<PlannerTimeWeave {...input} />);
    expect(mocks.axis.mock.calls[0]?.[0]).toBe("2026-09-28");
    fireEvent.click(screen.getByRole("button", { name: "Inspect Wednesday, September 30, 2026" }));
    expect(input.onInspectDate).toHaveBeenCalledWith("2026-09-30");
  });
  it("inspects a session's day without exposing editing, completion or dragging", () => {
    const input = props();
    render(<PlannerTimeWeave {...input} />);
    fireEvent.click(screen.getByRole("button", { name: "Inspect Morning run, Wed, Sep 30" }));
    expect(input.onInspectDate).toHaveBeenCalledWith(session.date);
    expect(screen.queryByRole("button", { name: /mark .*done|move session/i })).toBeNull();
    expect(screen.queryByLabelText(/change date/i)).toBeNull();
    expect(document.querySelector("[aria-roledescription='sortable']")).toBeNull();
  });
});
