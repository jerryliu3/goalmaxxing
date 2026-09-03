import { describe, expect, it } from "vitest";
import {
  CALENDAR_TASKS_MAX_WINDOW_DAYS,
  calendarTasksQuerySchema,
  inclusiveDayCount,
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
    expect(inclusiveDayCount("2026-01-01", "2026-01-01")).toBe(1);
    expect(inclusiveDayCount("2026-01-01", "2026-12-31")).toBeLessThanOrEqual(
      CALENDAR_TASKS_MAX_WINDOW_DAYS
    );
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
          created_at: "2026-09-01T12:00:00.000Z",
          updated_at: "2026-09-01T12:00:00.000Z",
        },
        {
          task_id: "22222222-2222-4222-8222-222222222222",
          title: "Ship patch",
          scheduled_date: "2026-09-03",
          scheduled_time: null,
          completed_at: "2026-09-03T18:00:00.000Z",
          created_at: "2026-09-01T12:00:00.000Z",
          updated_at: "2026-09-03T18:00:00.000Z",
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
        createdAt: "2026-09-01T12:00:00.000Z",
        updatedAt: "2026-09-01T12:00:00.000Z",
      },
      {
        taskId: "22222222-2222-4222-8222-222222222222",
        title: "Ship patch",
        scheduledDate: "2026-09-03",
        scheduledTime: null,
        completedAt: "2026-09-03T18:00:00.000Z",
        createdAt: "2026-09-01T12:00:00.000Z",
        updatedAt: "2026-09-03T18:00:00.000Z",
      },
    ]);
  });
});
