// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const TASK_ID = "22222222-2222-4222-8222-222222222222";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/route", () => ({
  createRouteClient: async (request: Request) => {
    const authHeader = request.headers.get("authorization");
    const accessToken =
      authHeader && authHeader.toLowerCase().startsWith("bearer ")
        ? authHeader.slice(7).trim()
        : undefined;

    return {
      accessToken,
      supabase: {
        auth: {
          getUser: mocks.getUser,
        },
        rpc: mocks.rpc,
      },
    };
  },
}));

vi.mock("@/lib/observability/report-error", () => ({
  reportError: vi.fn(),
}));

import { POST } from "./route";

function request(body: unknown, taskId = TASK_ID) {
  return new Request(`http://localhost/api/planner/tasks/${taskId}/completion`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/planner/tasks/[taskId]/completion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "11111111-1111-4111-8111-111111111111" } },
      error: null,
    });
    mocks.rpc.mockResolvedValue({
      data: [
        {
          task_id: TASK_ID,
          title: "File taxes",
          scheduled_date: "2026-09-02",
          scheduled_time: "08:00",
          completed_at: "2026-09-02T12:00:00.000Z",
          created_at: "2026-09-01T00:00:00.000Z",
          updated_at: "2026-09-02T12:00:00.000Z",
        },
      ],
      error: null,
    });
  });

  it("returns authentication_required for unauthenticated requests", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const response = await POST(request({ completed: true }), {
      params: Promise.resolve({ taskId: TASK_ID }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      code: "authentication_required",
    });
  });

  it("rejects invalid task ids and bodies", async () => {
    const invalidId = await POST(request({ completed: true }, "not-a-uuid"), {
      params: Promise.resolve({ taskId: "not-a-uuid" }),
    });
    expect(invalidId.status).toBe(400);

    const invalidBody = await POST(request({}), {
      params: Promise.resolve({ taskId: TASK_ID }),
    });
    expect(invalidBody.status).toBe(400);
  });

  it("marks a task complete through the existing write boundary", async () => {
    const response = await POST(request({ completed: true }), {
      params: Promise.resolve({ taskId: TASK_ID }),
    });

    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("set_planner_task_completion", {
      p_task_id: TASK_ID,
      p_completed: true,
    });
    await expect(response.json()).resolves.toMatchObject({
      schemaVersion: "1",
      task: {
        taskId: TASK_ID,
        title: "File taxes",
        completedAt: "2026-09-02T12:00:00.000Z",
      },
    });
  });

  it("returns planner_task_not_found when the rpc cannot update the row", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "P0001", message: "planner_task_not_found" },
    });

    const response = await POST(request({ completed: false }), {
      params: Promise.resolve({ taskId: TASK_ID }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      code: "planner_task_not_found",
    });
  });
});
