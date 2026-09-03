import { describe, expect, it } from "vitest";
import { isEntryImmovableForDraft } from "@/features/planner/calendar-format";
import {
  buildCalendarTaskEntriesByDate,
  canOpenPlannerEventDetails,
  isPlannerTaskCalendarEntry,
  plannerTaskCalendarEntryKey,
  toPlannerTaskCalendarEntry,
} from "@/features/planner/calendar-task-entries";
import { buildPlannerDayEntry } from "@/features/planner/test-fixtures";

describe("calendar task entries", () => {
  it("places tasks on their scheduled date only", () => {
    const byDate = buildCalendarTaskEntriesByDate([
      {
        taskId: "11111111-1111-4111-8111-111111111111",
        title: "Buy groceries",
        scheduledDate: "2026-09-02",
        scheduledTime: "09:30",
        completedAt: null,
        createdAt: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-09-01T00:00:00.000Z",
      },
      {
        taskId: "22222222-2222-4222-8222-222222222222",
        title: "Done already",
        scheduledDate: "2026-09-02",
        scheduledTime: null,
        completedAt: "2026-09-02T12:00:00.000Z",
        createdAt: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-09-02T12:00:00.000Z",
      },
    ]);

    expect(Array.from(byDate.keys())).toEqual(["2026-09-02"]);
    expect(byDate.get("2026-09-02")?.map((entry) => entry.goalTitle)).toEqual([
      "Buy groceries",
      "Done already",
    ]);
    expect(byDate.get("2026-09-02")?.[0]).toMatchObject({
      key: plannerTaskCalendarEntryKey("11111111-1111-4111-8111-111111111111"),
      entryKind: "task",
      effectiveScheduledLocalTime: "09:30",
      creditState: "uncredited",
    });
    expect(byDate.get("2026-09-02")?.[1]?.creditState).toBe("credited");
  });

  it("keeps tasks immovable and out of the event-detail dialog", () => {
    const openTask = toPlannerTaskCalendarEntry({
      taskId: "11111111-1111-4111-8111-111111111111",
      title: "Buy groceries",
      scheduledDate: "2026-09-02",
      scheduledTime: null,
      completedAt: null,
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    });
    const goalEntry = buildPlannerDayEntry();

    expect(isPlannerTaskCalendarEntry(openTask)).toBe(true);
    expect(isPlannerTaskCalendarEntry(goalEntry)).toBe(false);
    expect(isEntryImmovableForDraft(openTask)).toBe(true);
    expect(isEntryImmovableForDraft(goalEntry)).toBe(false);
    expect(canOpenPlannerEventDetails(openTask)).toBe(false);
    expect(canOpenPlannerEventDetails(goalEntry)).toBe(true);
  });
});
