import { describe, expect, it } from "vitest";
import {
  preferNestedPlannerEntryCollisions,
  plannerListItemCollisions,
} from "./planner-dnd-collision";
import { parsePlannerPreviewEntryDropId, plannerPreviewEntryDropId } from "./planner-drag-target";

describe("planner list collisions", () => {
  it("prefers in-day entry droppables over wrapping day droppables", () => {
    expect(
      preferNestedPlannerEntryCollisions([
        { id: "planner-day:2026-09-02" },
        { id: plannerPreviewEntryDropId("2026-09-02", "goal-1:unit-1", "calendar") },
      ])
    ).toEqual([
      { id: plannerPreviewEntryDropId("2026-09-02", "goal-1:unit-1", "calendar") },
    ]);
  });

  it("keeps trailing same-day space on the day droppable", () => {
    expect(
      preferNestedPlannerEntryCollisions([{ id: "planner-day:2026-09-02" }])
    ).toEqual([{ id: "planner-day:2026-09-02" }]);
  });

  it("keeps the lifted item in the same-list collision set so it can return home", () => {
    const activeId = plannerPreviewEntryDropId(
      "2026-09-02",
      "goal-1:unit-1",
      "calendar"
    );
    const siblingId = plannerPreviewEntryDropId(
      "2026-09-02",
      "goal-2:unit-1",
      "calendar"
    );
    expect(
      plannerListItemCollisions(
        [{ id: activeId }, { id: siblingId }, { id: "planner-day:2026-09-02" }],
        "calendar",
        "2026-09-02"
      )
    ).toEqual([{ id: activeId }, { id: siblingId }]);
  });

  it("keeps checklist and calendar items on the same day in separate lists", () => {
    const calendarId = plannerPreviewEntryDropId(
      "2026-09-02",
      "goal-2:unit-1",
      "calendar"
    );
    const checklistId = plannerPreviewEntryDropId(
      "2026-09-02",
      "goal-2:unit-1",
      "checklist"
    );
    expect(calendarId).not.toBe(checklistId);
    expect(
      plannerListItemCollisions(
        [{ id: calendarId }, { id: checklistId }, { id: "planner-day:2026-09-02" }],
        "checklist",
        "2026-09-02"
      )
    ).toEqual([{ id: checklistId }]);
  });

  it("parses surface, day, and entry key from a list item id", () => {
    expect(
      parsePlannerPreviewEntryDropId(
        plannerPreviewEntryDropId("2026-09-02", "goal-1:unit-1", "calendar")
      )
    ).toEqual({
      surface: "calendar",
      day: "2026-09-02",
      entryKey: "goal-1:unit-1",
    });
  });
});
