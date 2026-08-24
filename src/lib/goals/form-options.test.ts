import { describe, expect, it } from "vitest";
import {
  GOAL_CREATE_KIND_HELP,
  GOAL_TYPE_OPTIONS,
  PLANNER_TASK_TYPE_OPTION,
  isPlannerTaskCreateKind,
} from "@/lib/goals/form-options";

describe("goal create kinds", () => {
  it("labels cadence and milestone types for the create form", () => {
    expect(GOAL_TYPE_OPTIONS).toEqual([
      { value: "recurring", label: "Recurring" },
      { value: "fixed_milestones", label: "Milestones" },
    ]);
    expect(PLANNER_TASK_TYPE_OPTION).toEqual({
      value: "planner_task",
      label: "Task",
    });
  });

  it("explains each create kind in plain language", () => {
    expect(GOAL_CREATE_KIND_HELP.recurring).toMatch(/not rigid/i);
    expect(GOAL_CREATE_KIND_HELP.fixed_milestones).toMatch(/unique steps/i);
    expect(GOAL_CREATE_KIND_HELP.planner_task).toMatch(/Planner → Tasks/i);
    expect(isPlannerTaskCreateKind("planner_task")).toBe(true);
    expect(isPlannerTaskCreateKind("recurring")).toBe(false);
  });
});
