import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import type { GoalCreationFields } from "@/features/goals/goal-creation-model";

const baseFields: GoalCreationFields = {
  title: "Build momentum",
  description: "",
  category_selection: "career",
  custom_category: "",
  color: "#6366f1",
  frequency_type: "recurring",
  recurrence_interval: "weekly",
  target_count: "3",
  target_basis: "period",
  milestone_names: [],
  start_date: "2026-01-01",
  end_date: "2026-12-31",
  default_local_time: "",
  difficulty: "medium",
  is_private: false,
  linked_target_goal_id: "none",
};

const fullVisibility = {
  category: true,
  rhythm: true,
  interval: true,
  count: true,
  schedule: true,
  difficulty: true,
};

function renderCard(props: Partial<Parameters<typeof TempoGoalCard>[0]> = {}) {
  render(<TempoGoalCard fields={baseFields} {...props} />);
  return screen.getByRole("article", { name: "Goal card preview" });
}

describe("TempoGoalCard materials", () => {
  afterEach(() => {
    cleanup();
  });

  it("maps easy goals to liquid glass", () => {
    expect(
      renderCard({ fields: { ...baseFields, difficulty: "easy" } })
    ).toHaveAttribute("data-material", "glass");
  });

  it("maps medium goals to anodized alloy", () => {
    expect(
      renderCard({ fields: { ...baseFields, difficulty: "medium" } })
    ).toHaveAttribute("data-material", "alloy");
  });

  it("maps hard goals to chromatic foil", () => {
    expect(
      renderCard({ fields: { ...baseFields, difficulty: "hard" } })
    ).toHaveAttribute("data-material", "foil");
  });

  it("falls back to liquid glass when a goal has no difficulty", () => {
    expect(
      renderCard({
        fields: {
          ...baseFields,
          difficulty: undefined,
        } as unknown as GoalCreationFields,
      })
    ).toHaveAttribute("data-material", "glass");
  });

  it("keeps planner tasks on the neutral glass finish", () => {
    expect(
      renderCard({
        fields: { ...baseFields, difficulty: "hard" },
        isTask: true,
        taskSchedule: { date: "Jan 1", time: "08:00" },
      })
    ).toHaveAttribute("data-material", "glass");
  });

  it("withholds the material until difficulty is disclosed", () => {
    expect(
      renderCard({ visibility: { ...fullVisibility, difficulty: false } })
    ).not.toHaveAttribute("data-material");
  });

  it("renders no material when a study opts out of the production surface", () => {
    expect(renderCard({ surface: "plain" })).not.toHaveAttribute(
      "data-material"
    );
  });

  it("gives a material card a posed surface carrying the goal color", () => {
    const surface = renderCard().closest(".tempo-card-surface");

    expect(surface).toHaveAttribute("data-material", "alloy");
    expect(surface).toHaveStyle({ "--goal-color": baseFields.color });
  });

  it("does not wrap a card that has no material", () => {
    expect(
      renderCard({ surface: "plain" }).closest(".tempo-card-surface")
    ).toBeNull();
  });
});
