import { describe, expect, it } from "vitest";
import {
  partitionDayEntriesByCompletion,
  partitionUnplannedGoalsByCompletion,
} from "@/features/planner/plan-day-completed";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";
import type { Goal } from "@/lib/goals/types";
import { optimisticCompletionFactKey } from "@/lib/planner/optimistic-completion-facts";

const DAY = "2026-08-06";

function entry(overrides: Partial<PlannerDayDetailEntry>): PlannerDayDetailEntry {
  return {
    key: "goal-1:cadence:0",
    originalGoalId: "goal-1",
    goalTitle: "Run",
    unitKey: "cadence:0",
    label: "Easy run",
    classification: "open",
    creditState: "uncredited",
    draftDiffKind: null,
    ...overrides,
  } as PlannerDayDetailEntry;
}

function goal(id: string): Goal {
  return { id, title: id } as Goal;
}

describe("partitionDayEntriesByCompletion", () => {
  it("keeps uncredited sessions open and files credited ones under completed", () => {
    const open = entry({ key: "open", originalGoalId: "goal-open" });
    const credited = entry({
      key: "credited",
      originalGoalId: "goal-credited",
      creditState: "credited",
    });

    const result = partitionDayEntriesByCompletion({
      entries: [open, credited],
      day: DAY,
    });

    expect(result.open).toEqual([open]);
    expect(result.completed).toEqual([credited]);
  });

  it("follows the optimistic overlay in both directions", () => {
    const pendingDone = entry({ key: "a", originalGoalId: "goal-a" });
    const pendingUndone = entry({
      key: "b",
      originalGoalId: "goal-b",
      creditState: "credited",
    });

    const result = partitionDayEntriesByCompletion({
      entries: [pendingDone, pendingUndone],
      day: DAY,
      optimisticCompletionFacts: new Map([
        [optimisticCompletionFactKey("goal-a", DAY), true],
        [optimisticCompletionFactKey("goal-b", DAY), false],
      ]),
    });

    expect(result.completed).toEqual([pendingDone]);
    expect(result.open).toEqual([pendingUndone]);
  });

  it("ignores overlay entries recorded against another day", () => {
    const credited = entry({ originalGoalId: "goal-a", creditState: "credited" });

    const result = partitionDayEntriesByCompletion({
      entries: [credited],
      day: DAY,
      optimisticCompletionFacts: new Map([
        [optimisticCompletionFactKey("goal-a", "2026-08-07"), false],
      ]),
    });

    expect(result.completed).toEqual([credited]);
  });

  it("holds a credited draft move open so the pending change stays visible", () => {
    const draft = entry({
      creditState: "credited",
      draftDiffKind: "moved_to",
    });

    const result = partitionDayEntriesByCompletion({
      entries: [draft],
      day: DAY,
    });

    expect(result.open).toEqual([draft]);
    expect(result.completed).toEqual([]);
  });
});

describe("partitionUnplannedGoalsByCompletion", () => {
  it("splits on credit earned for the viewed day", () => {
    const done = goal("goal-done");
    const todo = goal("goal-todo");

    const result = partitionUnplannedGoalsByCompletion({
      goals: [done, todo],
      presentationByGoalId: new Map([
        ["goal-done", { exactDateCompleted: true }],
        ["goal-todo", { exactDateCompleted: false }],
      ]) as never,
    });

    expect(result.completed).toEqual([done]);
    expect(result.open).toEqual([todo]);
  });

  it("treats a goal with no presentation as open", () => {
    const todo = goal("goal-todo");

    const result = partitionUnplannedGoalsByCompletion({
      goals: [todo],
      presentationByGoalId: new Map() as never,
    });

    expect(result.open).toEqual([todo]);
    expect(result.completed).toEqual([]);
  });
});
