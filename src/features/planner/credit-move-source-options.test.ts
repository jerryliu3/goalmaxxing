import { describe, expect, it } from "vitest";
import {
  buildCreditMoveSourceOptions,
  defaultCreditMoveSourceEntryKey,
} from "@/features/planner/credit-move-source-options";

describe("credit move source options", () => {
  const workUnits = [
    {
      originalGoalId: "goal-a",
      unitKey: "cadence:2026-08-01:1",
      kind: "cadence" as const,
      scheduledDate: "2026-08-10",
      creditState: "uncredited",
      classification: "open",
      locked: false,
      creditWindow: { start: "2026-08-01", end: "2026-08-31" },
      draftMoveWindow: { start: "2026-08-06", end: "2026-08-31" },
    },
    {
      originalGoalId: "goal-a",
      unitKey: "cadence:2026-08-01:2",
      kind: "cadence" as const,
      scheduledDate: "2026-08-20",
      creditState: "uncredited",
      classification: "open",
      locked: false,
      creditWindow: { start: "2026-08-01", end: "2026-08-31" },
      draftMoveWindow: { start: "2026-08-06", end: "2026-08-31" },
    },
    {
      originalGoalId: "goal-a",
      unitKey: "cadence:2026-08-01:0",
      kind: "cadence" as const,
      scheduledDate: "2026-08-04",
      creditState: "completed_as_scheduled",
      classification: "fulfilled",
      locked: false,
    },
  ];

  it("lists only movable uncredited sessions for the goal", () => {
    const options = buildCreditMoveSourceOptions({
      goalId: "goal-a",
      goalTitle: "Run",
      workUnits,
      targetDate: "2026-08-12",
    });
    expect(options.map((option) => option.unitKey)).toEqual([
      "cadence:2026-08-01:1",
      "cadence:2026-08-01:2",
    ]);
  });

  it("defaults to the kernel credit target", () => {
    const options = buildCreditMoveSourceOptions({
      goalId: "goal-a",
      goalTitle: "Run",
      workUnits,
      targetDate: "2026-08-12",
    });
    expect(
      defaultCreditMoveSourceEntryKey({
        goalId: "goal-a",
        workUnits,
        targetDate: "2026-08-12",
        options,
      })
    ).toBe("goal-a:cadence:2026-08-01:1");
  });
});
