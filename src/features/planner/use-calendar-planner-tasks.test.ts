import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getJson: vi.fn(),
  postJson: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({
  getJson: mocks.getJson,
  postJson: mocks.postJson,
  getApiErrorMessage: (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback,
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

import { useCalendarPlannerTasks } from "@/features/planner/use-calendar-planner-tasks";
import { plannerTaskCalendarEntryKey } from "@/features/planner/calendar-task-entries";

describe("useCalendarPlannerTasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getJson.mockResolvedValue({
      tasks: [
        {
          taskId: "11111111-1111-4111-8111-111111111111",
          title: "Buy groceries",
          scheduledDate: "2026-09-02",
          scheduledTime: "09:00",
          completedAt: null,
        updatedAt: "2026-09-01T00:00:00.000Z",
        },
      ],
    });
    mocks.postJson.mockResolvedValue({
      task: {
        taskId: "11111111-1111-4111-8111-111111111111",
        title: "Buy groceries",
        scheduledDate: "2026-09-02",
        scheduledTime: "09:00",
        completedAt: "2026-09-02T12:00:00.000Z",
        updatedAt: "2026-09-01T00:00:00.000Z",
      },
    });
  });

  it("does not fetch until enabled", async () => {
    renderHook(() =>
      useCalendarPlannerTasks({
        enabled: false,
        from: "2026-09-01",
        to: "2026-09-30",
      })
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(mocks.getJson).not.toHaveBeenCalled();
  });

  it("loads tasks for the visible window and can mark them complete", async () => {
    const { result } = renderHook(() =>
      useCalendarPlannerTasks({
        enabled: true,
        from: "2026-09-01",
        to: "2026-09-30",
      })
    );

    await waitFor(() => {
      expect(
        result.current.taskEntriesByDate.get("2026-09-02")?.[0]?.goalTitle
      ).toBe("Buy groceries");
    });
    expect(mocks.getJson).toHaveBeenCalledWith("/api/planner/tasks", {
      query: { from: "2026-09-01", to: "2026-09-30" },
    });

    await act(async () => {
      await result.current.completeTask(
        "11111111-1111-4111-8111-111111111111",
        true
      );
    });

    expect(mocks.postJson).toHaveBeenCalledWith(
      "/api/planner/tasks/11111111-1111-4111-8111-111111111111/completion",
      { completed: true, expectedUpdatedAt: "2026-09-01T00:00:00.000Z" }
    );
    expect(
      result.current.taskEntriesByDate.get("2026-09-02")?.[0]
    ).toMatchObject({
      key: plannerTaskCalendarEntryKey(
        "11111111-1111-4111-8111-111111111111"
      ),
      creditState: "credited",
    });
  });

  it("moves a task to a new scheduled date immediately", async () => {
    mocks.postJson.mockResolvedValue({
      task: {
        taskId: "11111111-1111-4111-8111-111111111111",
        title: "Buy groceries",
        scheduledDate: "2026-09-08",
        scheduledTime: "09:00",
        completedAt: null,
        updatedAt: "2026-09-01T00:00:00.000Z",
      },
    });
    const { result } = renderHook(() =>
      useCalendarPlannerTasks({
        enabled: true,
        from: "2026-09-01",
        to: "2026-09-30",
      })
    );

    await waitFor(() => {
      expect(
        result.current.taskEntriesByDate.get("2026-09-02")?.[0]?.goalTitle
      ).toBe("Buy groceries");
    });

    await act(async () => {
      await result.current.rescheduleTask(
        "11111111-1111-4111-8111-111111111111",
        "2026-09-08"
      );
    });

    expect(mocks.postJson).toHaveBeenCalledWith(
      "/api/planner/tasks/11111111-1111-4111-8111-111111111111/schedule",
      { scheduledDate: "2026-09-08", expectedUpdatedAt: "2026-09-01T00:00:00.000Z" }
    );
    expect(
      result.current.taskEntriesByDate.get("2026-09-08")?.[0]
    ).toMatchObject({
      key: plannerTaskCalendarEntryKey(
        "11111111-1111-4111-8111-111111111111"
      ),
      goalTitle: "Buy groceries",
    });
    expect(result.current.taskEntriesByDate.get("2026-09-02")).toBeUndefined();
  });
});
