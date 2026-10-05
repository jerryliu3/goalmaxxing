import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlannerTasksPanel, clearPlannerTasksCacheForTests } from "./planner-tasks-panel";
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), create: vi.fn(), complete: vi.fn(), edit: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ rpc: mocks.rpc }) }));
vi.mock("@/lib/tasks/client", () => ({ createPlannerTask: mocks.create, completePlannerTask: mocks.complete, editPlannerTask: mocks.edit }));
vi.mock("@/lib/api/client", () => ({ getApiErrorMessage: (_: unknown, fallback: string) => fallback }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
vi.mock("@/lib/dates/day", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/dates/day")>();
  return { ...actual, toLocalDateString: () => "2026-10-04" };
});
const row = { task_id: "11111111-1111-4111-8111-111111111111", title: "Call dentist", scheduled_date: "2026-10-03", scheduled_time: null,
  completed_at: null, created_at: "2026-10-01T12:00:00Z", updated_at: "2026-10-01T12:00:00Z" };
const task = { taskId: row.task_id, title: row.title, scheduledDate: row.scheduled_date, scheduledTime: null,
  completedAt: null, createdAt: row.created_at, updatedAt: row.updated_at };
beforeEach(() => { vi.clearAllMocks(); mocks.rpc.mockResolvedValue({ data: [row], error: null }); });
afterEach(() => { cleanup(); clearPlannerTasksCacheForTests(); });
describe("one time task checklist", () => {
  it("expands a card without completing the task and shows overdue state", async () => {
    render(<PlannerTasksPanel scheduledDate="2026-10-04" />);
    fireEvent.click(await screen.findByRole("button", { name: "Call dentist" }));
    expect(screen.getByLabelText("Task name")).toHaveValue("Call dentist");
    expect(screen.getByLabelText("Scheduled date")).toHaveValue("2026-10-03");
    expect(screen.getByText("Overdue · 2026-10-03")).toBeInTheDocument();
    expect(mocks.complete).not.toHaveBeenCalled();
  });
  it("completes using its own control and the reviewed row version", async () => {
    mocks.complete.mockResolvedValue({ ...task, completedAt: "2026-10-04T12:00:00Z", updatedAt: "2026-10-04T12:00:00Z" });
    render(<PlannerTasksPanel scheduledDate="2026-10-04" />);
    fireEvent.click(await screen.findByRole("button", { name: "Complete Call dentist" }));
    await waitFor(() => expect(mocks.complete).toHaveBeenCalledWith(row.task_id, row.updated_at, true));
    expect(await screen.findByRole("button", { name: "Undo completion for Call dentist" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Task name")).not.toBeInTheDocument();
  });
  it("restores the task when completion fails", async () => {
    mocks.complete.mockRejectedValue(new Error("stale"));
    render(<PlannerTasksPanel scheduledDate="2026-10-04" />);
    fireEvent.click(await screen.findByRole("button", { name: "Complete Call dentist" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Complete Call dentist" })).not.toBeDisabled());
  });
  it("opens the selected task when selected from the calendar", async () => {
    render(<PlannerTasksPanel scheduledDate="2026-10-04" selectedTaskId={row.task_id} />);
    expect(await screen.findByLabelText("Task name")).toHaveValue("Call dentist");
  });
  it("persists name, date, and time together with the original version", async () => {
    mocks.edit.mockResolvedValue({ ...task, title: "Call office", scheduledDate: "2026-10-05", scheduledTime: "09:30", updatedAt: "2026-10-04T12:00:00Z" });
    render(<PlannerTasksPanel scheduledDate="2026-10-04" />);
    fireEvent.click(await screen.findByRole("button", { name: "Call dentist" }));
    fireEvent.change(screen.getByLabelText("Task name"), { target: { value: "Call office" } });
    fireEvent.change(screen.getByLabelText("Scheduled date"), { target: { value: "2026-10-05" } });
    fireEvent.change(screen.getByLabelText("Task time"), { target: { value: "09:30" } });
    fireEvent.click(screen.getByRole("button", { name: "Save task" }));
    await waitFor(() => expect(mocks.edit).toHaveBeenCalledWith(row.task_id, row.updated_at, { title: "Call office", scheduledDate: "2026-10-05", scheduledTime: "09:30" }));
    await waitFor(() => expect(screen.queryByText("Call dentist")).not.toBeInTheDocument());
  });
  it("keeps a completed card editable but disables rescheduling", async () => {
    mocks.rpc.mockResolvedValue({ data: [{ ...row, completed_at: "2026-10-04T12:00:00Z" }], error: null });
    render(<PlannerTasksPanel scheduledDate="2026-10-04" />);
    fireEvent.click(await screen.findByRole("button", { name: "Call dentist" }));
    expect(screen.getByLabelText("Scheduled date")).toBeDisabled();
    expect(screen.getByLabelText("Task name")).not.toBeDisabled();
  });
  it("uses today for new captures when viewing a past day", async () => {
    render(<PlannerTasksPanel scheduledDate="2026-10-02" />);
    fireEvent.click(await screen.findByRole("button", { name: "+ Add new" }));
    expect(screen.getByLabelText("Task date")).toHaveValue("2026-10-04");
    expect(screen.getByLabelText("Task date")).toHaveAttribute("min", "2026-10-04");
  });
  it("reopens cached tasks without a loading flash", async () => {
    const first = render(<PlannerTasksPanel scheduledDate="2026-10-04" />);
    await screen.findByText("Call dentist"); first.unmount();
    mocks.rpc.mockReturnValue(new Promise(() => {}));
    render(<PlannerTasksPanel scheduledDate="2026-10-04" />);
    expect(screen.getByText("Call dentist")).toBeInTheDocument();
    expect(screen.queryByText("Loading tasks...")).not.toBeInTheDocument();
  });
});
