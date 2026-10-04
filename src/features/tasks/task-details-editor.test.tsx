import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TaskDetailsEditor } from "./task-details-editor";
const mocks = vi.hoisted(() => ({ edit: vi.fn() }));
vi.mock("@/lib/tasks/client", () => ({ editPlannerTask: mocks.edit }));
vi.mock("@/lib/api/client", () => ({ getApiErrorMessage: (_: unknown, fallback: string) => fallback }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const task = { taskId: "11111111-1111-4111-8111-111111111111", title: "Task", scheduledDate: "2026-10-03", scheduledTime: "09:00", completedAt: null, updatedAt: "2026-10-01T12:00:00Z" };
describe("task editor", () => {
  it("can clear a clock time and edit an overdue task without moving its date", async () => {
    const onSaved = vi.fn(); mocks.edit.mockResolvedValue({ ...task, scheduledTime: null });
    render(<TaskDetailsEditor task={task} today="2026-10-04" onSaved={onSaved} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Task time"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save task" }));
    await waitFor(() => expect(mocks.edit).toHaveBeenCalledWith(task.taskId, task.updatedAt, { title: "Task", scheduledDate: "2026-10-03", scheduledTime: null }));
    expect(onSaved).toHaveBeenCalled();
  });
  it("keeps edits when a stale write is rejected", async () => {
    mocks.edit.mockRejectedValue(new Error("stale"));
    const onSaved = vi.fn();
    render(<TaskDetailsEditor task={task} today="2026-10-04" onSaved={onSaved} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Task name"), { target: { value: "Renamed" } });
    fireEvent.click(screen.getByRole("button", { name: "Save task" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Save task" })).not.toBeDisabled());
    expect(screen.getByLabelText("Task name")).toHaveValue("Renamed");
    expect(onSaved).not.toHaveBeenCalled();
  });
});
