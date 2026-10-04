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
  return new Request(`http://localhost/api/planner/tasks/${taskId}/schedule`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/planner/tasks/[taskId]/schedule", () => {
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
          scheduled_date: "2026-09-08",
          scheduled_time: "08:00",
          completed_at: null,
          updated_at: "2026-09-01T00:00:00.000Z",
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

    const response = await POST(request({ scheduledDate: "2026-09-08", expectedUpdatedAt: "2026-09-01T00:00:00.000Z" }), {
      params: Promise.resolve({ taskId: TASK_ID }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      code: "authentication_required",
    });
  });

  it("rejects invalid task ids and bodies", async () => {
    const invalidId = await POST(
      request({ scheduledDate: "2026-09-08", expectedUpdatedAt: "2026-09-01T00:00:00.000Z" }, "not-a-uuid"),
      {
        params: Promise.resolve({ taskId: "not-a-uuid" }),
      }
    );
    expect(invalidId.status).toBe(400);

    const invalidBody = await POST(request({}), {
      params: Promise.resolve({ taskId: TASK_ID }),
    });
    expect(invalidBody.status).toBe(400);
  });

  it("reschedules a task through the existing write boundary", async () => {
    const response = await POST(request({ scheduledDate: "2026-09-08", expectedUpdatedAt: "2026-09-01T00:00:00.000Z" }), {
      params: Promise.resolve({ taskId: TASK_ID }),
    });

    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("set_planner_task_scheduled_date", {
      p_task_id: TASK_ID,
      p_scheduled_date: "2026-09-08",
      p_expected_updated_at: "2026-09-01T00:00:00.000Z",
    });
    await expect(response.json()).resolves.toMatchObject({
      schemaVersion: "1",
      task: {
        taskId: TASK_ID,
        title: "File taxes",
        scheduledDate: "2026-09-08",
        updatedAt: "2026-09-01T00:00:00.000Z",
      },
    });
  });

  it("returns planner_task_not_found when the rpc cannot update the row", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "P0001", message: "planner_task_not_found" },
    });

    const response = await POST(request({ scheduledDate: "2026-09-08", expectedUpdatedAt: "2026-09-01T00:00:00.000Z" }), {
      params: Promise.resolve({ taskId: TASK_ID }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      code: "planner_task_not_found",
    });
  });
});
