import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlannerTasksPanel } from "@/features/tasks/planner-tasks-panel";

const rpcMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    rpc: rpcMock,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock("@/lib/dates/day", () => ({
  toLocalDateString: () => "2026-09-05",
}));

describe("PlannerTasksPanel", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("hides the panel when configured and no tasks are scheduled", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });

    render(
      <PlannerTasksPanel
        title="Tasks"
        description={null}
        scheduledDate="2026-08-22"
        allowCreate={false}
        hideWhenEmpty
      />
    );

    await waitFor(() => {
      expect(rpcMock).toHaveBeenCalledWith("list_planner_tasks", {
        p_for_date: "2026-08-22",
      });
    });
    await waitFor(() => {
      expect(screen.queryByText("Tasks")).toBeNull();
    });
  });

  it("shows tasks without rendering a subtitle when description is omitted", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          task_id: "task-1",
          title: "Ship release notes",
          scheduled_date: "2026-08-22",
          scheduled_time: "09:30",
          completed_at: null,
          created_at: "2026-08-21T12:00:00.000Z",
          updated_at: "2026-08-21T12:00:00.000Z",
        },
      ],
      error: null,
    });

    render(
      <PlannerTasksPanel
        title="Tasks"
        description={null}
        scheduledDate="2026-08-22"
        allowCreate={false}
        hideWhenEmpty
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Tasks")).toBeInTheDocument();
      expect(screen.getByText("Ship release notes")).toBeInTheDocument();
      expect(screen.getByText("09:30")).toBeInTheDocument();
    });
    expect(
      screen.queryByText("Track simple one-time tasks separately from recurring goals.")
    ).toBeNull();
  });

  it("stays hidden while the initial load is in flight when hideWhenEmpty is enabled", async () => {
    let resolveRpc: (value: { data: unknown[]; error: null }) => void = () => {};
    rpcMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRpc = resolve;
        })
    );

    render(
      <PlannerTasksPanel
        title="Tasks"
        description={null}
        scheduledDate="2026-08-22"
        allowCreate={false}
        hideWhenEmpty
      />
    );

    expect(screen.queryByText("Tasks")).toBeNull();

    resolveRpc({ data: [], error: null });

    await waitFor(() => {
      expect(screen.queryByText("Tasks")).toBeNull();
    });
  });

  it("keeps the panel visible while toggling completion", async () => {
    const task = {
      task_id: "task-1",
      title: "Ship release notes",
      scheduled_date: "2026-08-22",
      scheduled_time: null,
      completed_at: null,
      created_at: "2026-08-21T12:00:00.000Z",
      updated_at: "2026-08-21T12:00:00.000Z",
    };

    rpcMock.mockImplementation(async (name: string) => {
      if (name === "list_planner_tasks") {
        return { data: [task], error: null };
      }
      if (name === "set_planner_task_completion") {
        return { data: null, error: null };
      }
      return { data: null, error: null };
    });

    const user = userEvent.setup();

    render(
      <PlannerTasksPanel
        title="Tasks"
        description={null}
        scheduledDate="2026-08-22"
        allowCreate={false}
        hideWhenEmpty
      />
    );

    const toggleButton = await screen.findByRole("button", { name: /ship release notes/i });
    expect(screen.getByText("Tasks")).toBeInTheDocument();

    await user.click(toggleButton);

    await waitFor(() => {
      expect(rpcMock).toHaveBeenCalledWith("set_planner_task_completion", {
        p_task_id: "task-1",
        p_completed: true,
      });
    });

    expect(screen.getByText("Tasks")).toBeInTheDocument();
    expect(screen.getByText("Ship release notes")).toHaveClass("line-through");
    expect(rpcMock).toHaveBeenCalledTimes(2);
    expect(rpcMock).toHaveBeenNthCalledWith(2, "set_planner_task_completion", {
      p_task_id: "task-1",
      p_completed: true,
    });
  });

  it("creates tasks from the panel without sending a scheduled time", async () => {
    rpcMock.mockImplementation(async (name: string) => {
      if (name === "list_planner_tasks") {
        return { data: [], error: null };
      }
      if (name === "create_planner_task") {
        return { data: [], error: null };
      }
      return { data: null, error: null };
    });

    const user = userEvent.setup();

    render(<PlannerTasksPanel allowCreate allowDelete={false} />);

    await waitFor(() => {
      expect(rpcMock).toHaveBeenCalledWith("list_planner_tasks", {
        p_for_date: undefined,
      });
    });

    const addButton = screen.getByRole("button", { name: /add/i });
    expect(addButton).toBeDisabled();
    expect(screen.getByLabelText("Task date")).toHaveValue("2026-09-05");

    await user.type(screen.getByPlaceholderText("Add a task..."), "Quick inbox task");
    expect(addButton).toBeEnabled();
    await user.click(addButton);

    await waitFor(() => {
      expect(rpcMock).toHaveBeenCalledWith("create_planner_task", {
        p_title: "Quick inbox task",
        p_scheduled_date: "2026-09-05",
      });
    });
  });

  it("creates tasks on the date chosen beside the add button", async () => {
    rpcMock.mockImplementation(async (name: string) => {
      if (name === "list_planner_tasks") {
        return { data: [], error: null };
      }
      if (name === "create_planner_task") {
        return { data: [], error: null };
      }
      return { data: null, error: null };
    });

    const user = userEvent.setup();

    render(<PlannerTasksPanel allowCreate allowDelete={false} />);

    await waitFor(() => {
      expect(rpcMock).toHaveBeenCalledWith("list_planner_tasks", {
        p_for_date: undefined,
      });
    });

    await user.type(screen.getByPlaceholderText("Add a task..."), "Later inbox task");
    fireEvent.change(screen.getByLabelText("Task date"), {
      target: { value: "2026-09-12" },
    });
    await user.click(screen.getByRole("button", { name: /add/i }));

    await waitFor(() => {
      expect(rpcMock).toHaveBeenCalledWith("create_planner_task", {
        p_title: "Later inbox task",
        p_scheduled_date: "2026-09-12",
      });
    });
  });
});
