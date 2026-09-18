import { describe, expect, it } from "vitest";
import {
  buildCreditedGoalDateKeys,
  buildWeekRhythmRows,
} from "@/features/insights/week-rhythm-model";
import type { Goal } from "@/lib/goals/types";

const goal: Goal = {
  id: "goal-a",
  title: "Tempo run",
  color: "#2563eb",
} as Goal;

describe("week rhythm model", () => {
  it("marks empty, planned, and complete knots for the current week", () => {
    const rows = buildWeekRhythmRows({
      goals: [goal],
      workUnits: [
        {
          originalGoalId: "goal-a",
          scheduledDate: "2026-09-08",
          creditState: "uncredited",
        },
        {
          originalGoalId: "goal-a",
          scheduledDate: "2026-09-10",
          creditState: "credited",
        },
      ] as never[],
      creditedGoalDates: buildCreditedGoalDateKeys([
        { goal_id: "goal-a", completed_on: "2026-09-10" },
      ]),
      asOfDate: "2026-09-09",
      weekStartsOn: 1,
      visibleGoalIds: null,
    });

    expect(rows).toHaveLength(1);
    const states = Object.fromEntries(rows[0].days.map((day) => [day.date, day.state]));
    expect(states["2026-09-08"]).toBe("planned");
    expect(states["2026-09-10"]).toBe("complete");
    expect(states["2026-09-07"]).toBe("empty");
  });

  it("marks a completion with no planned session complete", () => {
    const rows = buildWeekRhythmRows({
      goals: [goal],
      workUnits: [],
      creditedGoalDates: buildCreditedGoalDateKeys([
        { goal_id: "goal-a", completed_on: "2026-09-08" },
      ]),
      asOfDate: "2026-09-09",
      weekStartsOn: 1,
      visibleGoalIds: null,
    });

    expect(rows).toHaveLength(1);
    const states = Object.fromEntries(rows[0].days.map((day) => [day.date, day.state]));
    expect(states["2026-09-08"]).toBe("complete");
    expect(states["2026-09-09"]).toBe("empty");
  });

  it("omits goals with no planned or completed sessions in the week", () => {
    const rows = buildWeekRhythmRows({
      goals: [
        goal,
        { id: "goal-b", title: "Stretch", color: null } as Goal,
      ],
      workUnits: [
        {
          originalGoalId: "goal-a",
          scheduledDate: "2026-09-08",
          creditState: "uncredited",
        },
      ] as never[],
      creditedGoalDates: new Set<string>(),
      asOfDate: "2026-09-09",
      weekStartsOn: 1,
      visibleGoalIds: null,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.goalId).toBe("goal-a");
  });
});
