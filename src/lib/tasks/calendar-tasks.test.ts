import { describe, expect, it } from "vitest";
import {
  calendarTasksQuerySchema,
  mapPlannerCalendarTaskRows,
  plannerTaskCompletionRequestSchema,
} from "@/lib/tasks/calendar-tasks";

describe("calendar task query schema", () => {
  it("accepts an inclusive window within the planner bound", () => {
    expect(
      calendarTasksQuerySchema.parse({
        from: "2026-08-01",
        to: "2026-08-31",
      })
    ).toEqual({
      from: "2026-08-01",
      to: "2026-08-31",
    });
  });

  it("rejects inverted and oversized windows", () => {
    expect(
      calendarTasksQuerySchema.safeParse({
        from: "2026-08-31",
        to: "2026-08-01",
      }).success
    ).toBe(false);
    expect(
      calendarTasksQuerySchema.safeParse({
        from: "2026-01-01",
        to: "2027-01-03",
      }).success
    ).toBe(false);
    expect(
      calendarTasksQuerySchema.safeParse({
        from: "2026-01-01",
        to: "2026-12-31",
      }).success
    ).toBe(true);
  });
});

describe("planner task completion request schema", () => {
  it("requires a boolean completed flag", () => {
    expect(plannerTaskCompletionRequestSchema.parse({ completed: true })).toEqual({
      completed: true,
    });
    expect(plannerTaskCompletionRequestSchema.safeParse({}).success).toBe(false);
    expect(
      plannerTaskCompletionRequestSchema.safeParse({ completed: true, extra: 1 })
        .success
    ).toBe(false);
  });
});

describe("mapPlannerCalendarTaskRows", () => {
  it("maps table and rpc row shapes and skips invalid rows", () => {
    expect(
      mapPlannerCalendarTaskRows([
        {
          id: "11111111-1111-4111-8111-111111111111",
          title: "Buy groceries",
          scheduled_date: "2026-09-02",
          scheduled_time: "09:30",
          completed_at: null,
        },
        {
          task_id: "22222222-2222-4222-8222-222222222222",
          title: "Ship patch",
          scheduled_date: "2026-09-03",
          scheduled_time: null,
          completed_at: "2026-09-03T18:00:00.000Z",
        },
        { title: "missing-id" },
      ])
    ).toEqual([
      {
        taskId: "11111111-1111-4111-8111-111111111111",
        title: "Buy groceries",
        scheduledDate: "2026-09-02",
        scheduledTime: "09:30",
        completedAt: null,
      },
      {
        taskId: "22222222-2222-4222-8222-222222222222",
        title: "Ship patch",
        scheduledDate: "2026-09-03",
        scheduledTime: null,
        completedAt: "2026-09-03T18:00:00.000Z",
      },
    ]);
  });

  it("ignores non-array payloads", () => {
    expect(mapPlannerCalendarTaskRows(null)).toEqual([]);
    expect(mapPlannerCalendarTaskRows({ task_id: "x" })).toEqual([]);
  });
});
