import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import { CurrentGoalGrid, hydratePublicCurrentGoal } from "./current-goal-grid";
import { buildGoal } from "@/lib/goals/goal-test-fixtures";
import { summary } from "./folio-test-fixtures";

vi.mock("@/features/goals/goal-progress-card", () => ({
  GoalProgressCard: ({ goal }: { goal: { title: string } }) => <p>{goal.title}</p>,
}));

afterEach(cleanup);

const progress: ProgressContextSummary = summary("goal-1", {
  lifecycle: "active",
  placementTerminal: false,
  outcome: "in_progress",
});

describe("CurrentGoalGrid", () => {
  it("renders five-up current goals and optional details", () => {
    const onDetails = vi.fn();
    render(
      <CurrentGoalGrid
        entries={[{ goal: buildGoal({ title: "Daily walk" }), progress }]}
        onDetails={onDetails}
      />
    );

    expect(screen.getByText("Daily walk")).toBeInTheDocument();
    expect(screen.getByLabelText("Daily walk")).toBeInTheDocument();
    screen.getByRole("button", { name: /goal details/i }).click();
    expect(onDetails).toHaveBeenCalledWith("goal-1");
  });

  it("hydrates a public current-goal payload for the library cards", () => {
    const goal = buildGoal({ title: "Public walk", description: "Outdoors" });
    const dto = {
      id: goal.id,
      ownerId: goal.owner_id,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      color: goal.color,
      frequencyType: goal.frequency_type,
      recurrenceInterval: goal.recurrence_interval,
      difficulty: goal.difficulty ?? null,
      targetCount: goal.target_count,
      targetBasis: goal.target_basis,
      milestoneNames: goal.milestone_names,
      startDate: goal.start_date,
      endDate: goal.end_date,
      rewardText: goal.reward_text ?? null,
      defaultLocalTime: goal.default_local_time ?? null,
      createdAt: goal.created_at,
      progress,
    };

    expect(hydratePublicCurrentGoal(dto).goal.title).toBe("Public walk");
  });
});
