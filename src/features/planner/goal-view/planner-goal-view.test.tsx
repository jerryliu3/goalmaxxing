import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";
import type { GoalViewProps } from "./goal-view";
import type { GoalViewSession } from "./goal-view-model";
import { PlannerGoalView, type PlannerGoalViewProps } from "./planner-goal-view";

let captured: GoalViewProps;
vi.mock("./goal-view", () => ({
  GoalView: (props: GoalViewProps) => {
    captured = props;
    return null;
  },
}));

const entry = { key: "run:2026-10-09", originalGoalId: "run" } as PlannerDayDetailEntry;
const session = {
  key: entry.key,
  goalId: "run",
  date: "2026-10-09",
  entry,
} as GoalViewSession;

function mount(overrides: Partial<PlannerGoalViewProps> = {}) {
  const props: PlannerGoalViewProps = {
    goals: [{ id: "run" }, { id: "done" }] as never,
    completedGoalIds: new Set(["done"]),
    showCompletedGoals: false,
    progressSummaries: [{ goalId: "run" } as never],
    sessions: [session],
    today: "2026-10-02",
    weekStartsOn: undefined,
    selectedEntryKey: null,
    canMutatePlanItems: true,
    optimisticCompletionFacts: {} as never,
    mutationLoadingKey: null,
    canOpenEntry: () => true,
    canMutateEntryOnDay: () => true,
    onOpenEntry: vi.fn(),
    onMoveEntry: vi.fn(),
    onToggleEntry: vi.fn(),
    ...overrides,
  };
  render(<PlannerGoalView {...props} />);
  return props;
}

describe("PlannerGoalView", () => {
  afterEach(cleanup);

  it("indexes progress by goal and normalizes the week start", () => {
    mount();
    expect(captured.progressByGoalId.get("run")).toBeDefined();
    expect(captured.weekStartsOn).toBe(1);
  });

  it("hides completed goals unless the Filters toggle shows them", () => {
    mount();
    expect(captured.goals.map((goal) => goal.id)).toEqual(["run"]);
    cleanup();
    mount({ showCompletedGoals: true });
    expect(captured.goals.map((goal) => goal.id)).toEqual(["run", "done"]);
  });

  it("opens, moves and toggles through the planner commands", () => {
    const props = mount();
    const source = document.createElement("button");
    captured.onOpenSession(session);
    captured.onMoveSession(session, "2026-10-10");
    captured.onToggleSession(session, source);
    expect(props.onOpenEntry).toHaveBeenCalledWith(entry, "2026-10-09");
    expect(props.onMoveEntry).toHaveBeenCalledWith(entry, "2026-10-10");
    expect(props.onToggleEntry).toHaveBeenCalledWith(entry, "2026-10-09", source);
  });

  it("does nothing for sessions the planner cannot mutate", () => {
    const props = mount({ canMutateEntryOnDay: () => false });
    expect(captured.isEditable(session)).toBe(false);
    captured.onOpenSession(session);
    captured.onToggleSession(session, document.createElement("button"));
    expect(props.onOpenEntry).not.toHaveBeenCalled();
    expect(props.onToggleEntry).not.toHaveBeenCalled();
  });
});
