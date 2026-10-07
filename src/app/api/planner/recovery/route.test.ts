// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { z } from "zod";

const GOAL_ID = "11111111-1111-4111-8111-111111111111";
const SNAPSHOT = {
  today: "2026-10-07",
  horizonEnd: "2026-11-17",
  blackoutRanges: [],
  goals: [],
  sessions: [],
};

const mocks = vi.hoisted(() => ({
  body: null as unknown,
  rpc: vi.fn(),
  requirePlannerRouteContext: vi.fn(),
  loadRecoveryContext: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: vi.fn() } }),
}));

vi.mock("@/lib/planner/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/planner/api")>("@/lib/planner/api");
  return {
    ...actual,
    createCorrelationId: () => "test-correlation-id",
    requirePlannerRouteContext: mocks.requirePlannerRouteContext,
    parseBoundedJsonBody: async (_request: Request, _max: number, schema: z.ZodType) =>
      schema.parse(mocks.body),
  };
});

vi.mock("@/lib/planner/recovery/snapshot", () => ({
  loadRecoveryContext: mocks.loadRecoveryContext,
}));

import { recoveryDismissRequestSchema } from "@/lib/planner/recovery/contract";
import { GET, POST } from "./route";

function post(body: unknown) {
  mocks.body = body;
  return POST(new Request("http://localhost/api/planner/recovery", { method: "POST" }));
}

describe("/api/planner/recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rpc.mockResolvedValue({ data: null, error: null });
    mocks.requirePlannerRouteContext.mockResolvedValue({
      userId: "user-1",
      supabase: { rpc: mocks.rpc },
    });
    mocks.loadRecoveryContext.mockResolvedValue({ recovery: SNAPSHOT });
  });

  it("returns the recovery snapshot", async () => {
    const response = await GET(new Request("http://localhost/api/planner/recovery"));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ snapshot: SNAPSHOT });
  });

  it("saves every let-go in one call and returns the fresh snapshot", async () => {
    const response = await post({
      dismissals: [
        { goalId: GOAL_ID, date: "2026-10-05" },
        { goalId: GOAL_ID, date: "2026-10-06" },
      ],
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ snapshot: SNAPSHOT });
    expect(mocks.rpc.mock.calls).toEqual([
      [
        "dismiss_planner_recovery_sessions",
        {
          p_dismissals: [
            { goal_id: GOAL_ID, missed_on: "2026-10-05" },
            { goal_id: GOAL_ID, missed_on: "2026-10-06" },
          ],
        },
      ],
    ]);
  });

  it("rejects an empty save", () => {
    expect(recoveryDismissRequestSchema.safeParse({ dismissals: [] }).success).toBe(false);
  });

  it("maps a foreign goal to a typed 404", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "P0001", message: "goal_not_found" } });

    const response = await post({ dismissals: [{ goalId: GOAL_ID, date: "2026-10-05" }] });

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ code: "goal_not_found" });
  });
});
