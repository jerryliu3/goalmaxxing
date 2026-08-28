import { describe, expect, it } from "vitest";
import { pickCadenceCreditUnit } from "@/lib/planner/cadence-credit-matching";
import type { PlannerWorkUnit } from "@/lib/planner/work-units";

function unit(
  overrides: Partial<PlannerWorkUnit> & Pick<PlannerWorkUnit, "unitKey" | "ordinal">
): PlannerWorkUnit {
  return {
    originalGoalId: "goal-id",
    requirementSchemaVersion: "1",
    requirementFingerprint: "fp",
    kind: "cadence",
    periodKey: "2026-08",
    label: null,
    creditWindow: { start: "2026-08-01", end: "2026-08-31" },
    placementWindow: { start: "2026-08-01", end: "2026-08-31" },
    draftMoveWindow: { start: "2026-08-01", end: "2026-08-31" },
    classification: "open",
    missPolicy: "remain_missed",
    restEligible: true,
    maxPerDay: 1,
    creditedCompletionId: null,
    creditedCompletionDate: null,
    creditState: "uncredited",
    scheduledDate: null,
    locked: false,
    ...overrides,
  };
}

describe("pickCadenceCreditUnit", () => {
  it("prefers the latest past-or-same scheduled session over a future one", () => {
    const past = unit({
      unitKey: "cadence:2026-08:4",
      ordinal: 4,
      scheduledDate: "2026-08-20",
    });
    const future = unit({
      unitKey: "cadence:2026-08:3",
      ordinal: 3,
      scheduledDate: "2026-08-28",
    });

    expect(pickCadenceCreditUnit([future, past], "2026-08-27")).toBe(past);
  });

  it("prefers the latest among multiple past-or-same scheduled sessions", () => {
    const earlierPast = unit({
      unitKey: "cadence:2026-08:2",
      ordinal: 2,
      scheduledDate: "2026-08-14",
    });
    const laterPast = unit({
      unitKey: "cadence:2026-08:4",
      ordinal: 4,
      scheduledDate: "2026-08-20",
    });
    const future = unit({
      unitKey: "cadence:2026-08:3",
      ordinal: 3,
      scheduledDate: "2026-08-28",
    });

    expect(
      pickCadenceCreditUnit([future, earlierPast, laterPast], "2026-08-27")
    ).toBe(laterPast);
  });

  it("uses the nearest future session when completion is before all schedules", () => {
    const earlier = unit({
      unitKey: "cadence:2026-08:1",
      ordinal: 1,
      scheduledDate: "2026-08-10",
    });
    const later = unit({
      unitKey: "cadence:2026-08:2",
      ordinal: 2,
      scheduledDate: "2026-08-20",
    });

    expect(pickCadenceCreditUnit([later, earlier], "2026-08-05")).toBe(earlier);
  });

  it("uses the nearest future session when only future sessions remain", () => {
    const match = unit({
      unitKey: "cadence:2026-08:3",
      ordinal: 3,
      scheduledDate: "2026-08-28",
    });

    expect(pickCadenceCreditUnit([match], "2026-08-25")).toBe(match);
  });

  it("falls back to the lowest ordinal when candidates are unscheduled", () => {
    const lower = unit({ unitKey: "cadence:2026-08:1", ordinal: 1 });
    const higher = unit({ unitKey: "cadence:2026-08:2", ordinal: 2 });

    expect(pickCadenceCreditUnit([higher, lower], "2026-08-12")).toBe(lower);
  });

  it("returns null when there are no candidates", () => {
    expect(pickCadenceCreditUnit([], "2026-08-12")).toBeNull();
  });
});
