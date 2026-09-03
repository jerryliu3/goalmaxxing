import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { toPlannerTaskCalendarEntry } from "@/features/planner/calendar-task-entries";
import { buildPlannerDayEntry } from "@/features/planner/test-fixtures";
import { usePlannerCalendarDnd } from "@/features/planner/use-planner-calendar-dnd";

describe("usePlannerCalendarDnd", () => {
  it("persists task date changes immediately and leaves goals on the draft path", () => {
    const task = toPlannerTaskCalendarEntry({
      taskId: "11111111-1111-4111-8111-111111111111",
      title: "Buy groceries",
      scheduledDate: "2026-09-02",
      scheduledTime: null,
      completedAt: null,
    });
    const goal = buildPlannerDayEntry({ key: "goal-1:unit-1" });
    const queueDraftMoveCommand = vi.fn(() => true);
    const rescheduleCalendarTask = vi.fn();
    const { result } = renderHook(() =>
      usePlannerCalendarDnd({
        entryByKey: new Map([
          [task.key, task],
          [goal.key, goal],
        ]),
        entryDayByKey: new Map([
          [task.key, "2026-09-02"],
          [goal.key, "2026-09-02"],
        ]),
        getEntriesForDay: () => [],
        getEntryGoalFirstTitleWithTime: (entry) => entry.goalTitle,
        setPreviewEntryOrderByDay: vi.fn(),
        queueDraftMoveCommand,
        rescheduleCalendarTask,
        clearHoverPreviewTimer: vi.fn(),
        pointerPressActiveRef: { current: false },
      })
    );

    act(() => {
      result.current.handleDndEntryDragEnd(task.key, {
        type: "day",
        day: "2026-09-08",
      });
    });
    expect(rescheduleCalendarTask).toHaveBeenCalledWith(task, "2026-09-08");
    expect(queueDraftMoveCommand).not.toHaveBeenCalled();

    act(() => {
      result.current.handleDndEntryDragEnd(goal.key, {
        type: "day",
        day: "2026-09-08",
      });
    });
    expect(queueDraftMoveCommand).toHaveBeenCalledWith({
      entry: goal,
      nextDate: "2026-09-08",
      source: "drag_drop",
    });
  });

  it("does not persist a task drop onto its current day", () => {
    const task = toPlannerTaskCalendarEntry({
      taskId: "11111111-1111-4111-8111-111111111111",
      title: "Buy groceries",
      scheduledDate: "2026-09-02",
      scheduledTime: null,
      completedAt: null,
    });
    const rescheduleCalendarTask = vi.fn();
    const { result } = renderHook(() =>
      usePlannerCalendarDnd({
        entryByKey: new Map([[task.key, task]]),
        entryDayByKey: new Map([[task.key, "2026-09-02"]]),
        getEntriesForDay: () => [],
        getEntryGoalFirstTitleWithTime: (entry) => entry.goalTitle,
        setPreviewEntryOrderByDay: vi.fn(),
        queueDraftMoveCommand: vi.fn(() => true),
        rescheduleCalendarTask,
        clearHoverPreviewTimer: vi.fn(),
        pointerPressActiveRef: { current: false },
      })
    );

    act(() => {
      result.current.handleDndEntryDragEnd(task.key, {
        type: "day",
        day: "2026-09-02",
      });
    });
    expect(rescheduleCalendarTask).not.toHaveBeenCalled();
  });
});
