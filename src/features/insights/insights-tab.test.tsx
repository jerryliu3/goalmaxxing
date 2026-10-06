vi.mock("@/features/coach/use-coach-page-context", () => ({ useCoachPageContext: vi.fn() }));
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COMPLETION_HOLD_MS } from "@/components/ui/completion-toggle";
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
      asOfDate: "2026-09-06",
      timezone: "UTC",
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

function onlyButtonForGoal(title: string) {
  const row = screen.getByRole("button", { name: new RegExp(title) }).closest("li");
  if (!(row instanceof HTMLElement)) {
    throw new Error(`Could not find the Progress goal row for ${title}`);
  }
  return within(row).getByRole("button", { name: "Only" });
}

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
    vi.useRealTimers();
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

    // The section stack titles the tracker; the header no longer repeats it.
    expect(screen.getByRole("heading", { name: "Progress tracker" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Progress Tracker" })).toBeNull();
    expect(
      screen.getByText("Aggregate of selected goals. This calendar logs completions, including unscheduled days.")
    ).toBeInTheDocument();
    const layout = screen.getByTestId("progress-ledger-layout");
    expect(layout).toHaveClass(
      "flex-col",
      "md:grid",
      "md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]"
    );
    expect(layout).not.toHaveClass("flex-col-reverse");
    const goalsHeading = screen.getByRole("heading", { name: /Goals/ });
    expect(
      layout.compareDocumentPosition(goalsHeading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();

    await user.click(onlyButtonForGoal("Lift"));

    expect(
      screen.getByText(
        "Hold a past or today cell to log or remove a completion. Future days are closed."
      )
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Yoga/ }));

    expect(screen.getByText("Read-only overlap of 2 goals.")).toBeInTheDocument();
    expect(screen.getByTitle(/2026-09-01/)).not.toHaveAttribute("data-motion", "completion-toggle");
  });

  it("logs or removes a completion from the selected goal heatmap", () => {
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

    fireEvent.click(onlyButtonForGoal("Tempo run"));

    vi.useFakeTimers();
    const day = screen.getByTitle(/2026-09-01/);
    fireEvent.pointerDown(day);
    act(() => {
      vi.advanceTimersByTime(COMPLETION_HOLD_MS);
    });
    vi.useRealTimers();

    expect(runCompletionMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        goalId: "run",
        date: "2026-09-01",
        timezone: "UTC",
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

    await user.click(onlyButtonForGoal("Thesis"));

    expect(
      screen.getByText(
        "Hold a past or today cell to log or remove a milestone. Future days are closed."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Thesis" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Proposal")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Draft")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Defense")).toBeInTheDocument();
    expect(screen.getByText("1 / 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Select all" }));
    expect(screen.getByText(/Aggregate of selected goals/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Thesis" })).not.toBeInTheDocument();
  });

  it("renders the requested progress view as full sections", () => {
    const period = {
      monthCursor: new Date(2026, 8, 6),
      onMonthCursorChange: () => {},
      perGoalViewMode: "month" as const,
      onPerGoalViewModeChange: () => {},
    };
    const { rerender } = render(<InsightsTab sharedPeriod={period} />);

    expect(screen.getByTestId("progress-section-history")).toBeInTheDocument();
    expect(screen.getByTestId("progress-ledger-layout")).toBeInTheDocument();
    expect(screen.queryByTestId("progress-section-past-goals")).toBeNull();

    rerender(<InsightsTab sharedPeriod={period} progressView="past" />);

    expect(screen.getByTestId("progress-section-past-goals")).toBeInTheDocument();
    expect(screen.queryByTestId("progress-ledger-layout")).toBeNull();
  });

  it("reports its sections and drops anchors on a secondary lane", () => {
    const onSectionsChange = vi.fn();
    render(
      <InsightsTab
        contentMode="lane"
        anchorSections={false}
        onSectionsChange={onSectionsChange}
        sharedPeriod={{
          monthCursor: new Date(2026, 8, 6),
          onMonthCursorChange: () => {},
          perGoalViewMode: "month",
          onPerGoalViewModeChange: () => {},
        }}
      />
    );

    expect(onSectionsChange).toHaveBeenCalled();
    expect(onSectionsChange.mock.calls.at(-1)?.[0]).toContain("history");
    expect(screen.queryByTestId("progress-section-history")).toBeNull();
    expect(screen.getByTestId("progress-ledger-layout")).toBeInTheDocument();
  });

  it("stacks heatmap then goals in lane mode without the shared tracker", () => {
    render(
      <InsightsTab
        contentMode="lane"
        sharedPeriod={{
          monthCursor: new Date(2026, 8, 6),
          onMonthCursorChange: () => {},
          perGoalViewMode: "month",
          onPerGoalViewModeChange: () => {},
        }}
      />
    );

    const help = screen.getByText(
      "Aggregate of selected goals. This calendar logs completions, including unscheduled days."
    );
    const goalsHeading = screen.getByRole("heading", { name: /Goals/ });
    expect(screen.queryByRole("heading", { name: "Progress Tracker" })).toBeNull();
    expect(screen.queryByText("September 2026")).not.toBeInTheDocument();
    expect(screen.getByTestId("progress-ledger-layout")).toHaveClass("space-y-3");
    expect(screen.getByTestId("progress-ledger-layout")).not.toHaveClass("md:grid");
    expect(
      help.compareDocumentPosition(goalsHeading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
