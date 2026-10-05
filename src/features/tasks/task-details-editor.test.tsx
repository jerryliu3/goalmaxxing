import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TaskDetailsEditor } from "./task-details-editor";
const mocks = vi.hoisted(() => ({ edit: vi.fn() }));
vi.mock("@/lib/tasks/client", () => ({ editPlannerTask: mocks.edit }));
vi.mock("@/lib/api/client", () => ({ getApiErrorMessage: (_: unknown, fallback: string) => fallback }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const task = { taskId: "11111111-1111-4111-8111-111111111111", title: "Task", scheduledDate: "2026-10-03", scheduledTime: "09:00", completedAt: null, updatedAt: "2026-10-01T12:00:00Z" };
function openEditor(onSaved = vi.fn()) {
  render(<TaskDetailsEditor task={task} today="2026-10-04" onSaved={onSaved} />);
  return onSaved;
}
describe("task inline facts", () => {
  it("saves a chosen date immediately without a form submission", async () => {
    mocks.edit.mockResolvedValue({ ...task, scheduledDate: "2026-10-05" });
    const onSaved = openEditor();
    expect(screen.queryByRole("button", { name: "Save task" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit scheduled date" }));
    fireEvent.change(screen.getByLabelText("Scheduled date"), { target: { value: "2026-10-05" } });
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(mocks.edit).toHaveBeenCalledWith(task.taskId, task.updatedAt, { scheduledDate: "2026-10-05" });
  });
  it("clears an optional time without moving an older task", async () => {
    mocks.edit.mockResolvedValue({ ...task, scheduledTime: null });
    const onSaved = openEditor();
    fireEvent.click(screen.getByRole("button", { name: "Edit task time" }));
    fireEvent.change(screen.getByLabelText("Task time"), { target: { value: "" } });
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(mocks.edit).toHaveBeenCalledWith(task.taskId, task.updatedAt, { scheduledDate: task.scheduledDate, scheduledTime: null });
  });
  it("renames from the schedule sentence on Enter", async () => {
    mocks.edit.mockResolvedValue({ ...task, title: "Renamed" });
    const onSaved = openEditor();
    fireEvent.click(screen.getByRole("button", { name: "Edit task name" }));
    const input = screen.getByLabelText("Task name");
    fireEvent.change(input, { target: { value: " Renamed " } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(mocks.edit).toHaveBeenCalledWith(task.taskId, task.updatedAt, { scheduledDate: task.scheduledDate, title: "Renamed" });
  });
  it.each(["Escape", "blur"])("discards an unconfirmed title on %s", (exit) => {
    openEditor();
    fireEvent.click(screen.getByRole("button", { name: "Edit task name" }));
    const input = screen.getByLabelText("Task name");
    fireEvent.change(input, { target: { value: "Unsaved" } });
    if (exit === "blur") fireEvent.blur(input); else fireEvent.keyDown(input, { key: exit });
    expect(screen.queryByLabelText("Task name")).not.toBeInTheDocument();
    expect(mocks.edit).not.toHaveBeenCalled();
  });
  it("keeps the title draft when a stale write is rejected", async () => {
    mocks.edit.mockRejectedValue(new Error("stale"));
    const onSaved = openEditor();
    fireEvent.click(screen.getByRole("button", { name: "Edit task name" }));
    const input = screen.getByLabelText("Task name");
    fireEvent.change(input, { target: { value: "Renamed" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(input).not.toBeDisabled());
    expect(input).toHaveValue("Renamed");
    expect(onSaved).not.toHaveBeenCalled();
  });
});
