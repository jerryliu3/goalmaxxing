import { describe, expect, it } from "vitest";
import { preferNestedPlannerEntryCollisions, excludeActivePlannerEntryCollisions } from "./planner-dnd-collision";

describe("preferNestedPlannerEntryCollisions", () => {
  it("prefers in-day entry droppables over wrapping day droppables", () => {
    expect(
      preferNestedPlannerEntryCollisions([
        { id: "planner-day:2026-09-02" },
        { id: "planner-preview-entry:2026-09-02::goal-1:unit-1" },
      ])
    ).toEqual([{ id: "planner-preview-entry:2026-09-02::goal-1:unit-1" }]);
  });

  it("keeps day collisions when no entry droppable is hit", () => {
    const dayHits = [{ id: "planner-day:2026-09-02" }];
    expect(preferNestedPlannerEntryCollisions(dayHits)).toEqual(dayHits);
  });

  it("drops the dragged entry so a sibling can be the reorder target", () => {
    expect(
      excludeActivePlannerEntryCollisions(
        [
          { id: "planner-preview-entry:2026-09-02::goal-1:unit-1" },
          { id: "planner-preview-entry:2026-09-02::goal-2:unit-1" },
          { id: "planner-day:2026-09-02" },
        ],
        "goal-1:unit-1"
      )
    ).toEqual([
      { id: "planner-preview-entry:2026-09-02::goal-2:unit-1" },
      { id: "planner-day:2026-09-02" },
    ]);
  });
});
