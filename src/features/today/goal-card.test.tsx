import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GoalCard } from "@/features/today/goal-card";
import type { GoalProgressSnapshot } from "@/lib/goals/progress";
import type { Goal } from "@/lib/goals/types";

vi.mock("next/image", () => ({
  default: () => null,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const goal: Goal = {
  id: "10000000-0000-4000-8000-000000000001",
  owner_id: "11111111-1111-4111-8111-111111111111",
  title: "Walk",
  description: null,
  category: "Health",
  category_key: "health",
  color: null,
  frequency_type: "recurring",
  recurrence_interval: "daily",
  target_count: null,
  target_basis: "period",
  milestone_names: null,
  start_date: "2026-01-01",
  end_date: "2026-12-31",
  photo_path: null,
  team_id: null,
  is_deleted: false,
  archived_at: "2026-08-01T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};


describe("GoalCard", () => {
  afterEach(() => {
    cleanup();
  });
  it("keeps archived own goals linked and disables the toggle", () => {
    render(
      <GoalCard
        goal={goal}
        completions={[]}
        linkedCount={0}
        selectedDate="2026-08-13"
        archived
        disabled
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/goals/10000000-0000-4000-8000-000000000001"
    );
    expect(
      screen.getByRole("button", { name: "Complete goal for 2026-08-13" })
    ).toBeDisabled();
  });

  it("does not link partner read-only goals", () => {
    render(
      <GoalCard
        goal={{ ...goal, archived_at: null }}
        completions={[]}
        linkedCount={0}
        selectedDate="2026-08-13"
        readOnly={true}
      />
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Complete goal for 2026-08-13" })
    ).not.toBeInTheDocument();
  });

  it("shows the category badge instead of a color dot and hides the deadline badge", () => {
    render(
      <GoalCard
        goal={{ ...goal, archived_at: null, target_count: 10 }}
        completions={[]}
        linkedCount={0}
        selectedDate="2026-08-13"
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText("Health")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Goal end date/i)).not.toBeInTheDocument();
    expect(
      screen.getByText("0/10 completions by Dec 31, 2026")
    ).toBeInTheDocument();
  });

  it("shows an explicit badge when a goal has no end date", () => {
    render(
      <GoalCard
        goal={{ ...goal, archived_at: null, end_date: null }}
        completions={[]}
        linkedCount={0}
        selectedDate="2026-08-13"
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText("No end date")).toBeInTheDocument();
  });

  it("labels linked-goal relationships explicitly", () => {
    render(
      <GoalCard
        goal={{ ...goal, archived_at: null }}
        completions={[]}
        linkedCount={3}
        selectedDate="2026-08-13"
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText("Linked 3")).toBeInTheDocument();
  });

  it("shows auto-completed when a linked completion was cascaded", () => {
    render(
      <GoalCard
        goal={{ ...goal, archived_at: null }}
        completions={[
          {
            goal_id: goal.id,
            completed_on: "2026-08-13",
            source: "linked_cascade",
          },
        ]}
        linkedCount={0}
        selectedDate="2026-08-13"
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText("Auto-completed")).toBeInTheDocument();
  });

  it("uses a light green tile for achieved goals instead of an Achieved badge", () => {
    const progress: GoalProgressSnapshot = {
      goalId: goal.id,
      admissibleCompletionCount: 10,
      creditedUnitCount: 10,
      expectedUnitCount: 10,
      percent: 100,
      lifecycle: "ended",
      outcome: "achieved",
      placementTerminal: true,
      periodSatisfied: true,
      currentPeriodCompletionCount: 1,
      currentPeriodTarget: 1,
      closedPeriodHitRatePercent: null,
      currentStreak: 0,
      longestStreak: 0,
      milestoneDates: [],
    };

    const { container } = render(
      <GoalCard
        goal={{ ...goal, archived_at: null, target_count: 10 }}
        completions={[]}
        progress={progress}
        linkedCount={0}
        selectedDate="2026-08-13"
        onToggle={vi.fn()}
      />
    );

    expect(screen.queryByText("Achieved")).not.toBeInTheDocument();
    expect(container.firstChild).toHaveClass("border-emerald-200");
    expect(container.firstChild).toHaveClass("bg-emerald-50");
    expect(container.firstChild).not.toHaveClass("dark:border-emerald-800/60");
    expect(container.firstChild).not.toHaveClass("dark:bg-emerald-950/40");
  });

  it("shows period-scoped counts for cadence goals on the selected checklist period", () => {
    const progress: GoalProgressSnapshot = {
      goalId: goal.id,
      admissibleCompletionCount: 14,
      creditedUnitCount: 6,
      expectedUnitCount: 8,
      percent: 75,
      lifecycle: "active",
      outcome: "in_progress",
      placementTerminal: false,
      periodSatisfied: true,
      currentPeriodCompletionCount: 2,
      currentPeriodTarget: 2,
      closedPeriodHitRatePercent: 50,
      currentStreak: 2,
      longestStreak: 3,
      milestoneDates: [],
    };

    render(
      <GoalCard
        goal={{
          ...goal,
          archived_at: null,
          recurrence_interval: "weekly",
          target_basis: "period",
          target_count: 2,
        }}
        completions={[
          { goal_id: goal.id, completed_on: "2026-08-11", source: "manual" },
          { goal_id: goal.id, completed_on: "2026-08-13", source: "manual" },
        ]}
        progress={progress}
        linkedCount={0}
        selectedDate="2026-08-13"
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText("Weekly · 2/2 this period")).toBeInTheDocument();
  });

  it("does not mark cadence goal green solely from as-of-today period summary", () => {
    const progress: GoalProgressSnapshot = {
      goalId: goal.id,
      admissibleCompletionCount: 14,
      creditedUnitCount: 6,
      expectedUnitCount: 8,
      percent: 75,
      lifecycle: "active",
      outcome: "in_progress",
      placementTerminal: false,
      periodSatisfied: true,
      currentPeriodCompletionCount: 2,
      currentPeriodTarget: 2,
      closedPeriodHitRatePercent: 50,
      currentStreak: 2,
      longestStreak: 3,
      milestoneDates: [],
    };

    const { container } = render(
      <GoalCard
        goal={{
          ...goal,
          archived_at: null,
          recurrence_interval: "weekly",
          target_basis: "period",
          target_count: 2,
        }}
        completions={[
          { goal_id: goal.id, completed_on: "2026-08-13", source: "manual" },
        ]}
        progress={progress}
        linkedCount={0}
        selectedDate="2026-08-13"
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText("Weekly · 1/2 this period")).toBeInTheDocument();
    expect(container.firstChild).not.toHaveClass("bg-emerald-50");
  });
});
