import { describe, expect, it } from "vitest";
import type { Completion, Goal } from "@/lib/goals/types";
import type { PlannerItemRow } from "@/lib/planner/context-loader";
import { selectPlannerCompletionMoveCandidate } from "@/lib/planner/completion-move-candidate";

const goal: Goal = {
  id: "10000000-0000-4000-8000-000000000001",
  owner_id: "10000000-0000-4000-8000-000000000002",
  title: "Goal",
  description: null,
  category: "general",
  color: null,
  frequency_type: "fixed_milestones",
  recurrence_interval: null,
  target_count: 3,
  target_basis: "lifetime",
  milestone_names: ["One", "Two", "Three"],
  start_date: "2026-09-01",
  end_date: "2026-09-30",
  photo_path: null,
  team_id: null,
  is_deleted: false,
  archived_at: null,
  created_at: "2026-09-01T00:00:00Z",
  updated_at: "2026-09-01T00:00:00Z",
};

function item(unitKey: string, date: string): PlannerItemRow {
  return {
    id: `20000000-0000-4000-8000-00000000000${unitKey.at(-1)}`,
    owner_id: goal.owner_id,
    goal_id: goal.id,
    unit_key: unitKey,
    scheduled_date: date,
    original_scheduled_date: date,
    scheduled_time: null,
    locked: false,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  };
}

const completion: Completion = {
  id: "30000000-0000-4000-8000-000000000001",
  goal_id: goal.id,
  user_id: goal.owner_id,
  completed_on: "2026-09-10",
  source: "manual",
  created_at: "2026-09-10T00:00:00Z",
};

describe("selectPlannerCompletionMoveCandidate", () => {
  it("completes an existing exact-date session in place", () => {
    const candidate = selectPlannerCompletionMoveCandidate({
      goal,
      plannerItems: [item("milestone:1", "2026-09-26")],
      completions: [],
      completionDate: "2026-09-26",
      asOfDate: "2026-09-26",
    });

    expect(candidate).toMatchObject({
      unitKey: "milestone:1",
      sourceDate: "2026-09-26",
    });
  });

  it("chooses the earliest incomplete ordinal even when its date is in the past", () => {
    const candidate = selectPlannerCompletionMoveCandidate({
      goal,
      plannerItems: [
        item("milestone:1", "2026-09-10"),
        item("milestone:2", "2026-09-12"),
        item("milestone:3", "2026-09-28"),
      ],
      completions: [completion],
      completionDate: "2026-09-26",
      asOfDate: "2026-09-26",
    });

    expect(candidate).toMatchObject({
      unitKey: "milestone:2",
      sourceDate: "2026-09-12",
    });
  });

  it("fills the lowest durable allocation gap before a later ordinal", () => {
    const candidate = selectPlannerCompletionMoveCandidate({
      goal,
      plannerItems: [
        item("milestone:1", "2026-09-10"),
        item("milestone:2", "2026-09-26"),
        item("milestone:3", "2026-09-28"),
      ],
      completions: [
        {
          ...completion,
          planner_unit_key: "milestone:2",
        },
      ],
      completionDate: "2026-09-26",
      asOfDate: "2026-09-26",
    });

    expect(candidate).toMatchObject({
      unitKey: "milestone:1",
      sourceDate: "2026-09-10",
    });
  });

  it("does not skip a locked earliest incomplete ordinal", () => {
    const locked = { ...item("milestone:2", "2026-09-12"), locked: true };
    const candidate = selectPlannerCompletionMoveCandidate({
      goal,
      plannerItems: [locked, item("milestone:3", "2026-09-28")],
      completions: [completion],
      completionDate: "2026-09-26",
      asOfDate: "2026-09-26",
    });

    expect(candidate).toBeNull();
    expect(
      selectPlannerCompletionMoveCandidate({
        goal,
        plannerItems: [locked, item("milestone:3", "2026-09-28")],
        completions: [completion],
        completionDate: "2026-09-26",
        asOfDate: "2026-09-26",
        allowLocked: true,
      })
    ).toMatchObject({ unitKey: "milestone:2" });
  });
});
