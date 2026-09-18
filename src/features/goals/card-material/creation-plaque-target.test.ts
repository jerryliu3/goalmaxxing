import { describe, expect, it } from "vitest";
import { createDefaultGoalCreationFields } from "../goal-creation-model";
import {
  clampPlaqueTarget,
  creationPlaqueTarget,
} from "./creation-plaque-target";

describe("creation plaque target", () => {
  it("seeds lifetime and milestone goals from their target count", () => {
    expect(
      creationPlaqueTarget({
        ...createDefaultGoalCreationFields(),
        frequency_type: "fixed_milestones",
        target_count: "5",
        target_basis: "lifetime",
      }),
    ).toBe(5);
    expect(
      creationPlaqueTarget({
        ...createDefaultGoalCreationFields(),
        frequency_type: "recurring",
        target_basis: "lifetime",
        target_count: "12",
      }),
    ).toBe(12);
  });

  it("seeds period cadence goals from the soft-horizon formula", () => {
    const target = creationPlaqueTarget({
      ...createDefaultGoalCreationFields(),
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_basis: "period",
      target_count: "3",
      start_date: "2026-01-01",
      end_date: "",
    });
    expect(target).toBeGreaterThanOrEqual(1);
    expect(target).toBeLessThanOrEqual(20);
  });

  it("clamps editable plaque targets to the presentation range", () => {
    expect(clampPlaqueTarget(0)).toBe(1);
    expect(clampPlaqueTarget(21)).toBe(20);
    expect(clampPlaqueTarget(7.6)).toBe(8);
  });
});
