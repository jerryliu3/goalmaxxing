import { describe, expect, it } from "vitest";
import { orderPlannerTasks } from "./task-order";

describe("task capture order", () => {
  it("keeps completion and scheduling changes in their original positions", () => {
    const older = { task_id: "a", created_at: "2026-09-25T08:00:00Z", completed_at: null, scheduled_date: "2026-09-26" };
    const newer = { ...older, task_id: "b", created_at: "2026-09-25T09:00:00Z" };
    expect(orderPlannerTasks([older, newer]).map(task => task.task_id)).toEqual(["b", "a"]);
    expect(orderPlannerTasks([
      older,
      { ...newer, completed_at: "2026-09-26T10:00:00Z", scheduled_date: "2026-09-30" },
    ]).map(task => task.task_id)).toEqual(["b", "a"]);
  });

  it("breaks creation-time ties deterministically without mutating the input", () => {
    const tasks = [
      { task_id: "b", created_at: "2026-09-25T08:00:00Z" },
      { task_id: "a", created_at: "2026-09-25T08:00:00Z" },
    ];
    expect(orderPlannerTasks(tasks).map(task => task.task_id)).toEqual(["a", "b"]);
    expect(tasks.map(task => task.task_id)).toEqual(["b", "a"]);
  });
});
