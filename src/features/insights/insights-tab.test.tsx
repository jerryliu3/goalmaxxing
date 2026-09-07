import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Goal } from "@/lib/goals/types";
import { InsightsTab } from "@/features/insights/insights-tab";

const loadDataMock = vi.fn();
const runCompletionMutationMock = vi.fn();

vi.mock("@/features/insights/use-insights-data", () => ({
  useInsightsData: () => ({
    state: {
      userId: "me",
      goals: [
        goal({ id: "run", owner_id: "me", title: "Tempo run" }),
        goal({ id: "lift", owner_id: "me", title: "Lift" }),
        goal({ id: "yoga", owner_id: "me", title: "Yoga" }),
        goal({
          id: "thesis",
          owner_id: "me",
          title: "Thesis",
          frequency_type: "fixed_milestones",
          target_count: 3,
          milestone_names: ["Proposal", "Draft", "Defense"],
        }),
      ],
      completions: [
        { goal_id: "run", completed_on: "2026-09-01", source: "manual" },
        { goal_id: "lift", completed_on: "2026-09-01", source: "manual" },
      ],
      memberTeamIds: [],
      progress: null,
      insightsStats: null,
    },
    loading: false,
    laneError: null,
    loadData: loadDataMock,
    redirectToLogin: vi.fn(),
  }),
}));

vi.mock("@/features/planner/use-completion-mutation", () => ({
  useCompletionMutation: () => runCompletionMutationMock,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    rpc: vi.fn(),
  }),
}));

vi.mock("@/lib/dates/day", async () => {
  const actual = await vi.importActual<typeof import("@/lib/dates/day")>(
    "@/lib/dates/day"
  );
  return {
    ...actual,
    toLocalDateString: () => "2026-09-06",
  };
});

function goal(overrides: Partial<Goal> & Pick<Goal, "id" | "owner_id" | "title">): Goal {
  return {
    description: null,
    category: "health",
    color: "#22c55e",
    frequency_type: "recurring",
    recurrence_interval: "daily",
    target_count: null,
    milestone_names: null,
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    photo_path: null,
    team_id: null,
    is_deleted: false,
    archived_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    target_basis: "period",
    ...overrides,
  };
}

describe("InsightsTab goal ledger", () => {
  beforeEach(() => {
    loadDataMock.mockReset();
    loadDataMock.mockResolvedValue(undefined);
    runCompletionMutationMock.mockReset();
    runCompletionMutationMock.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    cleanup();
  });

  it("starts on the aggregate heatmap and makes a single goal editable", async () => {
    const user = userEvent.setup();
    render(
      <InsightsTab
        sharedPeriod={{
          monthCursor: new Date(2026, 8, 6),
          onMonthCursorChange: () => {},
          perGoalViewMode: "month",
          onPerGoalViewModeChange: () => {},
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "Goal ledger" })).toBeInTheDocument();
    expect(
      screen.getByText(/Aggregate of selected goals/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Aggregate of selected goals/).closest(".flex")).toHaveClass(
      "flex-col-reverse",
      "md:grid",
      "md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]"
    );
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Lift/ }));
    await user.click(screen.getByRole("button", { name: /Yoga/ }));
    await user.click(screen.getByRole("button", { name: /Thesis/ }));

    expect(
      screen.getByText(/Tap a past or today cell to log or remove a completion/)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Yoga/ }));

    expect(screen.getByText(/Read-only overlap of 2 goals/)).toBeInTheDocument();
  });

  it("logs or removes a completion from the selected goal heatmap", async () => {
    const user = userEvent.setup();
    render(
      <InsightsTab
        sharedPeriod={{
          monthCursor: new Date(2026, 8, 6),
          onMonthCursorChange: () => {},
          perGoalViewMode: "month",
          onPerGoalViewModeChange: () => {},
        }}
      />
    );

    await user.click(screen.getByRole("button", { name: /Lift/ }));
    await user.click(screen.getByRole("button", { name: /Yoga/ }));
    await user.click(screen.getByRole("button", { name: /Thesis/ }));
    await user.click(screen.getByTitle(/2026-09-01/));

    expect(runCompletionMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        goalId: "run",
        date: "2026-09-01",
      })
    );
  });

  it("lists milestones under the heatmap for a selected milestone goal", async () => {
    const user = userEvent.setup();
    render(
      <InsightsTab
        sharedPeriod={{
          monthCursor: new Date(2026, 8, 6),
          onMonthCursorChange: () => {},
          perGoalViewMode: "month",
          onPerGoalViewModeChange: () => {},
        }}
      />
    );

    expect(screen.getByText("0/3 milestones")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Tempo run/ }));
    await user.click(screen.getByRole("button", { name: /Lift/ }));
    await user.click(screen.getByRole("button", { name: /Yoga/ }));

    expect(
      screen.getByText(/Tap a past or today cell to log or remove a milestone/)
    ).toBeInTheDocument();
    expect(screen.getByText("Milestones")).toBeInTheDocument();
    expect(screen.getByText("Proposal")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("Defense")).toBeInTheDocument();
  });
});
