import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getEntryGoalFirstTitleWithTime } from "@/features/planner/calendar-format";
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
        getEntryGoalFirstTitleWithTime,
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

  it("reorders when dropping onto another same-day entry", () => {
    const goal = buildPlannerDayEntry({ key: "goal-1:unit-1" });
    const other = buildPlannerDayEntry({ key: "goal-2:unit-1" });
    const queueDraftMoveCommand = vi.fn(() => true);
    const setPreviewEntryOrderByDay = vi.fn();
    const { result } = renderHook(() =>
      usePlannerCalendarDnd({
        entryByKey: new Map([
          [goal.key, goal],
          [other.key, other],
        ]),
        entryDayByKey: new Map([
          [goal.key, "2026-09-02"],
          [other.key, "2026-09-02"],
        ]),
        getEntriesForDay: () => [goal, other],
        getEntryGoalFirstTitleWithTime,
        setPreviewEntryOrderByDay,
        queueDraftMoveCommand,
        rescheduleCalendarTask: vi.fn(),
        clearHoverPreviewTimer: vi.fn(),
        pointerPressActiveRef: { current: false },
      })
    );

    act(() => {
      result.current.handleDndEntryDragEnd(goal.key, {
        type: "preview_entry",
        day: "2026-09-02",
        entryKey: other.key,
      });
    });

    expect(setPreviewEntryOrderByDay).toHaveBeenCalled();
    expect(queueDraftMoveCommand).not.toHaveBeenCalled();
  });

  it("does not rewrite list order while dragging over a same-day entry", () => {
    const goal = buildPlannerDayEntry({ key: "goal-1:unit-1" });
    const other = buildPlannerDayEntry({ key: "goal-2:unit-1" });
    const setPreviewEntryOrderByDay = vi.fn();
    const { result } = renderHook(() =>
      usePlannerCalendarDnd({
        entryByKey: new Map([
          [goal.key, goal],
          [other.key, other],
        ]),
        entryDayByKey: new Map([
          [goal.key, "2026-09-02"],
          [other.key, "2026-09-02"],
        ]),
        getEntriesForDay: () => [goal, other],
        getEntryGoalFirstTitleWithTime,
        setPreviewEntryOrderByDay,
        queueDraftMoveCommand: vi.fn(() => true),
        rescheduleCalendarTask: vi.fn(),
        clearHoverPreviewTimer: vi.fn(),
        pointerPressActiveRef: { current: false },
      })
    );

    act(() => {
      result.current.handleDndEntryDragOver(goal.key, {
        type: "preview_entry",
        day: "2026-09-02",
        entryKey: other.key,
      });
    });

    expect(setPreviewEntryOrderByDay).not.toHaveBeenCalled();
  });

  it("reorders when dropping onto the same-day list end", () => {
    const first = buildPlannerDayEntry({ key: "goal-1:unit-1" });
    const second = buildPlannerDayEntry({ key: "goal-2:unit-1" });
    const setPreviewEntryOrderByDay = vi.fn((updater) => {
      if (typeof updater === "function") {
        updater({});
      }
    });
    const { result } = renderHook(() =>
      usePlannerCalendarDnd({
        entryByKey: new Map([
          [first.key, first],
          [second.key, second],
        ]),
        entryDayByKey: new Map([
          [first.key, "2026-09-02"],
          [second.key, "2026-09-02"],
        ]),
        getEntriesForDay: () => [first, second],
        getEntryGoalFirstTitleWithTime,
        setPreviewEntryOrderByDay,
        queueDraftMoveCommand: vi.fn(() => true),
        rescheduleCalendarTask: vi.fn(),
        clearHoverPreviewTimer: vi.fn(),
        pointerPressActiveRef: { current: false },
      })
    );

    act(() => {
      result.current.handleDndEntryDragEnd(first.key, {
        type: "preview_entry",
        day: "2026-09-02",
        entryKey: "__end__",
      });
    });

    expect(setPreviewEntryOrderByDay).toHaveBeenCalled();
  });

  it("does not queue a draft move when a goal is dropped on its current day", () => {
    const goal = buildPlannerDayEntry({ key: "goal-1:unit-1" });
    const queueDraftMoveCommand = vi.fn(() => true);
    const { result } = renderHook(() =>
      usePlannerCalendarDnd({
        entryByKey: new Map([[goal.key, goal]]),
        entryDayByKey: new Map([[goal.key, "2026-09-02"]]),
        getEntriesForDay: () => [goal],
        getEntryGoalFirstTitleWithTime,
        setPreviewEntryOrderByDay: vi.fn(),
        queueDraftMoveCommand,
        rescheduleCalendarTask: vi.fn(),
        clearHoverPreviewTimer: vi.fn(),
        pointerPressActiveRef: { current: false },
      })
    );

    act(() => {
      result.current.handleDndEntryDragEnd(goal.key, {
        type: "day",
        day: "2026-09-02",
      });
    });
    expect(queueDraftMoveCommand).not.toHaveBeenCalled();
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
        getEntryGoalFirstTitleWithTime,
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
