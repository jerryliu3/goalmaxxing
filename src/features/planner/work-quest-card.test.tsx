import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WorkQuestCard } from "@/features/planner/work-quest-card";
import { projectWorkQuestModel } from "@/features/planner/work-quest-model";
import { buildGoal } from "@/lib/goals/goal-test-fixtures";

afterEach(() => {
  cleanup();
});

const quest = projectWorkQuestModel({
  id: "tempo-run",
  title: "Tempo run",
  goal: buildGoal({
    id: "tempo-run",
    title: "Tempo run",
    description: "Easy outdoor miles",
    category: "Health",
    category_key: "health",
    frequency_type: "recurring",
    recurrence_interval: "weekly",
    target_count: 3,
    target_basis: "period",
    difficulty: "medium",
    end_date: "2026-12-31",
    default_local_time: "07:30",
  }),
  sittingTime: "07:30",
  completed: false,
  presentation: {
    exactDateCompleted: false,
    completionSourceForSelectedDate: null,
    periodCompletionCount: 1,
    periodTarget: 3,
    periodSatisfied: false,
    lifetimeCompletionCount: 1,
    lifetimeAchieved: false,
    isGreen: false,
    displayCompletionCount: 1,
    shouldHideWhenCompletedFilterOff: false,
  },
});

describe("WorkQuestCard", () => {
  it("keeps rhythm, horizon, and effort in the expanded state", () => {
    const onOpen = vi.fn();
    const { rerender } = render(
      <WorkQuestCard
        quest={quest}
        open={false}
        onOpen={onOpen}
        completeControl={<button type="button">Mark Tempo run complete</button>}
      >
        <p>Session editor</p>
      </WorkQuestCard>
    );

    expect(screen.getByRole("heading", { name: "Tempo run" })).toBeInTheDocument();
    expect(screen.getByText("7:30 AM")).toBeInTheDocument();
    expect(screen.getByText("1 of 3 this week")).toBeInTheDocument();
    expect(screen.queryByText("Rhythm")).not.toBeInTheDocument();
    expect(screen.queryByText("Easy outdoor miles")).not.toBeInTheDocument();
    expect(screen.queryByText("Session editor")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Details" }));
    expect(onOpen).toHaveBeenCalledTimes(1);

    rerender(
      <WorkQuestCard
        quest={quest}
        open
        onOpen={onOpen}
        completeControl={<button type="button">Mark Tempo run complete</button>}
      >
        <p>Session editor</p>
      </WorkQuestCard>
    );

    expect(screen.getByText("Rhythm")).toBeInTheDocument();
    expect(screen.getByText("3 days a week")).toBeInTheDocument();
    expect(screen.getByText("Until Dec 31")).toBeInTheDocument();
    expect(screen.getByText("steady")).toBeInTheDocument();
    expect(screen.getByText("Easy outdoor miles")).toBeInTheDocument();
    expect(screen.getByText("Session editor")).toBeInTheDocument();
  });
});
