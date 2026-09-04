// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  parseBoundedJsonBody: vi.fn(),
  requirePlannerRouteContext: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({}),
}));

vi.mock("@/lib/planner/api", async () => {
  const { NextResponse } = await import("next/server");
  class PlannerRouteError extends Error {
    status: number;
    code: string;
    details?: Record<string, unknown>;

    constructor(
      status: number,
      code: string,
      message: string,
      options?: { details?: Record<string, unknown> }
    ) {
      super(message);
      this.status = status;
      this.code = code;
      this.details = options?.details;
    }
  }

  return {
    parseBoundedJsonBody: mocks.parseBoundedJsonBody,
    PlannerRouteError,
    requirePlannerRouteContext: mocks.requirePlannerRouteContext,
    withPlannerRoute: async (
      handler: (context: { correlationId: string }) => Promise<Response>
    ) => {
      const correlationId = "corr-id";
      try {
        return await handler({ correlationId });
      } catch (error) {
        if (error instanceof PlannerRouteError) {
          return NextResponse.json(
            { code: error.code, message: error.message, correlationId },
            { status: error.status }
          );
        }
        return NextResponse.json(
          { code: "internal_error", correlationId },
          { status: 500 }
        );
      }
    },
  };
});

import { POST } from "./route";

const GOAL_A = "91700000-0000-4000-8000-000000000001";
const GOAL_B = "91700000-0000-4000-8000-000000000002";

function createRequest() {
  return new Request("http://localhost/api/planner/reset-goal", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  });
}

describe("planner goal reset route", () => {
  beforeEach(() => {
    mocks.rpc.mockReset();
    mocks.parseBoundedJsonBody.mockResolvedValue({
      goalIds: [GOAL_A],
      expectedDigest: "a".repeat(64),
      scopeMonths: ["2026-08", "2026-09"],
    });
    mocks.requirePlannerRouteContext.mockResolvedValue({
      supabase: {
        rpc: mocks.rpc,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("clears requested months for one goal through the goal-scoped delete RPC", async () => {
    mocks.rpc.mockResolvedValue({
      data: [{ schedule_digest: "b".repeat(64), deleted_count: 3, window_count: 2 }],
      error: null,
    });

    const response = await POST(createRequest());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      schemaVersion: "1",
      goalIds: [GOAL_A],
      goalCount: 1,
      requestedScopeCount: 2,
      scopeCount: 2,
      deletedCount: 3,
      scheduleDigest: "b".repeat(64),
    });
    expect(mocks.rpc).toHaveBeenCalledWith("clear_planner_schedule_for_goal", {
      p_goal_id: GOAL_A,
      p_windows: [
        { start_date: "2026-08-01", end_date: "2026-08-31" },
        { start_date: "2026-09-01", end_date: "2026-09-30" },
      ],
      p_expected_digest: "a".repeat(64),
    });
  });

  it("chains digest updates when resetting multiple goals in one request", async () => {
    mocks.parseBoundedJsonBody.mockResolvedValue({
      goalIds: [GOAL_A, GOAL_B],
      expectedDigest: "a".repeat(64),
      scopeMonths: ["2026-08"],
    });
    mocks.rpc
      .mockResolvedValueOnce({
        data: [{ schedule_digest: "b".repeat(64), deleted_count: 2, window_count: 1 }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ schedule_digest: "c".repeat(64), deleted_count: 1, window_count: 1 }],
        error: null,
      });

    const response = await POST(createRequest());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      goalCount: 2,
      deletedCount: 3,
      scheduleDigest: "c".repeat(64),
    });
    expect(mocks.rpc).toHaveBeenNthCalledWith(
      1,
      "clear_planner_schedule_for_goal",
      expect.objectContaining({
        p_goal_id: GOAL_A,
        p_expected_digest: "a".repeat(64),
      })
    );
    expect(mocks.rpc).toHaveBeenNthCalledWith(
      2,
      "clear_planner_schedule_for_goal",
      expect.objectContaining({
        p_goal_id: GOAL_B,
        p_expected_digest: "b".repeat(64),
      })
    );
  });
});
