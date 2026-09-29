import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COMPLETION_HOLD_MS } from "@/components/ui/completion-toggle";
import { PlanDayUnplannedPanel } from "@/features/planner/plan-day-unplanned-panel";
import { buildGoal } from "@/lib/goals/goal-test-fixtures";
import type { PlanDayChecklistModel } from "@/features/planner/use-plan-day-checklist-model";
import { UnscheduledDraftMoveProvider } from "@/features/planner/unscheduled-draft-move";

const checklistDataMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/today/use-checklist-data", () => ({
  useChecklistData: () => checklistDataMock(),
}));

vi.mock("@/features/today/use-checklist-completion-actions", () => ({
  useChecklistCompletionActions: () => ({
    savingGoalId: null,
    recentlyCompletedGoalId: null,
    toggleCompletion: vi.fn(),
    optimisticFacts: new Map(),
  }),
}));

describe("PlanDayUnplannedPanel", () => {
  beforeEach(() => {
    checklistDataMock.mockReset();
    checklistDataMock.mockReturnValue({
      data: {
        userId: "user-1",
        goals: [],
        completions: [],
        memberTeamIds: [],
        links: [],
        photoUrls: {},
        progress: null,
      },
      loading: false,
      loadData: vi.fn(),
      redirectToLogin: vi.fn(),
      todayLocalDate: "2026-09-06",
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("shows active goals that are not already planned for the day", () => {
    render(
      <PlanDayUnplannedPanel day="2026-09-06" placedEntries={[]} />
    );

    expect(screen.getByText("Nothing unscheduled for this day.")).toBeInTheDocument();
  });

  it("hides the completion checkbox for unplanned goals on a future day", () => {
    const goal = buildGoal({ id: "goal-run", title: "Run" });
    render(
      <PlanDayUnplannedPanel
        day="2026-09-10"
        placedEntries={[]}
        checklist={
          {
            loading: false,
            todayLocalDate: "2026-09-06",
            visibleGoalIds: null,
            data: { goals: [goal] },
            listModel: {
              completableGoals: [goal],
              presentationByGoalId: new Map([
                ["goal-run", { exactDateCompleted: false }],
              ]),
            },
            savingGoalId: null,
            toggleCompletion: vi.fn(),
          } as unknown as PlanDayChecklistModel
        }
      />
    );

    expect(screen.getByText("Run")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Run" })).toHaveAttribute("href", "/goals/goal-run");
    expect(
      screen.queryByRole("button", { name: /mark run done/i })
    ).not.toBeInTheDocument();
  });

  it("offers cross-month discovery for an unscheduled future-day goal", async () => {
    const goal = buildGoal({ id: "goal-run", title: "Run" });
    const onDraftMove = vi.fn().mockResolvedValue(true);
    const toggleCompletion = vi.fn();
    render(
      <UnscheduledDraftMoveProvider
        workUnits={[]}
        asOfDate="2026-09-06"
        onDraftMove={onDraftMove}
      >
        <PlanDayUnplannedPanel
          day="2026-09-10"
          placedEntries={[]}
          checklist={
            {
              loading: false,
              todayLocalDate: "2026-09-06",
              visibleGoalIds: null,
              data: { goals: [goal] },
              listModel: {
                completableGoals: [goal],
                presentationByGoalId: new Map([
                  ["goal-run", { exactDateCompleted: false }],
                ]),
              },
              savingGoalId: null,
              toggleCompletion,
            } as unknown as PlanDayChecklistModel
          }
        />
      </UnscheduledDraftMoveProvider>
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Move a planned session for Run to this day",
      })
    );

    await waitFor(() =>
      expect(onDraftMove).toHaveBeenCalledWith({
        goalId: "goal-run",
        targetDate: "2026-09-10",
        goalStartDate: goal.start_date,
        goalEndDate: goal.end_date,
        localMove: null,
      })
    );
    expect(toggleCompletion).not.toHaveBeenCalled();
  });

  it("keeps the completion checkbox for unplanned goals on today and past days", () => {
    const goal = buildGoal({ id: "goal-run", title: "Run" });
    const checklist = {
      loading: false,
      todayLocalDate: "2026-09-06",
      visibleGoalIds: null,
      data: { goals: [goal] },
      listModel: {
        completableGoals: [goal],
        presentationByGoalId: new Map([
          ["goal-run", { exactDateCompleted: false }],
        ]),
      },
      savingGoalId: null,
      toggleCompletion: vi.fn(),
    } as unknown as PlanDayChecklistModel;

    const { rerender } = render(
      <PlanDayUnplannedPanel
        day="2026-09-06"
        placedEntries={[]}
        checklist={checklist}
      />
    );
    expect(screen.getByRole("button", { name: "Mark Run done" })).toBeInTheDocument();

    rerender(
      <PlanDayUnplannedPanel
        day="2026-09-01"
        placedEntries={[]}
        checklist={checklist}
      />
    );
    expect(screen.getByRole("button", { name: "Mark Run done" })).toBeInTheDocument();
  });

  it("uses the Plan Day checklist facets to hide filtered unplanned goals", () => {
    const visibleGoal = buildGoal({ id: "goal-visible", title: "Visible goal" });
    const filteredGoal = buildGoal({ id: "goal-filtered", title: "Filtered goal" });
    render(
      <PlanDayUnplannedPanel
        day="2026-09-06"
        placedEntries={[]}
        checklist={
          {
            loading: false,
            todayLocalDate: "2026-09-06",
            visibleGoalIds: new Set(["goal-visible"]),
            data: { goals: [visibleGoal, filteredGoal] },
            listModel: {
              completableGoals: [visibleGoal, filteredGoal],
              presentationByGoalId: new Map(),
            },
            savingGoalId: null,
            toggleCompletion: vi.fn(),
          } as unknown as PlanDayChecklistModel
        }
      />
    );

    expect(screen.getByText("Visible goal")).toBeInTheDocument();
    expect(screen.queryByText("Filtered goal")).not.toBeInTheDocument();
  });

  it("keeps the Plan Day loading state local to unplanned work", () => {
    render(
      <PlanDayUnplannedPanel
        day="2026-09-06"
        placedEntries={[]}
        checklist={
          {
            loading: true,
            todayLocalDate: "2026-09-06",
            visibleGoalIds: null,
            data: { goals: [] },
            listModel: {
              completableGoals: [],
              presentationByGoalId: new Map(),
            },
            savingGoalId: null,
            toggleCompletion: vi.fn(),
          } as unknown as PlanDayChecklistModel
        }
      />
    );

    expect(screen.getByText("Loading unscheduled work...")).toBeInTheDocument();
  });

  it("commits a current-day unplanned goal only after a hold", () => {
    vi.useFakeTimers();
    const goal = buildGoal({ id: "goal-run", title: "Run" });
    const toggleCompletion = vi.fn();
    render(
      <PlanDayUnplannedPanel
        day="2026-09-06"
        placedEntries={[]}
        checklist={
          {
            loading: false,
            todayLocalDate: "2026-09-06",
            visibleGoalIds: null,
            data: { goals: [goal] },
            listModel: {
              completableGoals: [goal],
              presentationByGoalId: new Map(),
            },
            savingGoalId: null,
            toggleCompletion,
          } as unknown as PlanDayChecklistModel
        }
      />
    );

    const toggle = screen.getByRole("button", { name: "Mark Run done" });
    fireEvent.pointerDown(toggle);
    act(() => {
      vi.advanceTimersByTime(COMPLETION_HOLD_MS);
    });

    expect(toggleCompletion).toHaveBeenCalledWith(goal, toggle);
  });

  it("uses the fallback checklist loader while the Plan Day model is unavailable", () => {
    checklistDataMock.mockReturnValue({
      data: {
        userId: "user-1",
        goals: [],
        completions: [],
        memberTeamIds: [],
        links: [],
        photoUrls: {},
        progress: null,
      },
      loading: true,
      loadData: vi.fn(),
      redirectToLogin: vi.fn(),
      todayLocalDate: "2026-09-06",
    });

    render(<PlanDayUnplannedPanel day="2026-09-06" placedEntries={[]} />);

    expect(screen.getByText("Loading unscheduled work...")).toBeInTheDocument();
  });
});
