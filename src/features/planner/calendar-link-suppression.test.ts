import { describe, expect, it } from "vitest";
import { isPlannerLinkedTargetSuppressedOnDate } from "./calendar-link-suppression";

describe("isPlannerLinkedTargetSuppressedOnDate", () => {
  const links = [
    {
      sourceGoalId: "source-a",
      targetGoalId: "target-b",
      targetSuppressionKind: "until" as const,
      targetResumesOn: "2026-10-01",
    },
  ];

  it("returns false for goals without inbound links", () => {
    expect(
      isPlannerLinkedTargetSuppressedOnDate({
        goalId: "other-goal",
        date: "2026-09-04",
        links,
      })
    ).toBe(false);
  });

  it("returns true on and before the resume date", () => {
    expect(
      isPlannerLinkedTargetSuppressedOnDate({
        goalId: "target-b",
        date: "2026-09-30",
        links,
      })
    ).toBe(true);
    expect(
      isPlannerLinkedTargetSuppressedOnDate({
        goalId: "target-b",
        date: "2026-10-01",
        links,
      })
    ).toBe(false);
  });
});
