import { describe, expect, it, vi } from "vitest";
import {
  applyPlannerGoalDateFact,
  applyPlannerItemDateFact,
  mapCompletionRpcError,
  targetedExactDateRequestSchema,
} from "./exact-date-dispatch";

const goalId = "10000000-0000-4000-8000-000000000011";
const goalDispatchDigest =
  "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

describe("exact-date dispatch schema", () => {
  it("rejects payloads that provide both planner expectations", () => {
    const parsed = targetedExactDateRequestSchema.safeParse({
      goalId,
      date: "2026-08-05",
      desiredFactState: "present",
      timezone: "UTC",
      plannerItemExpectation: {
        itemId: "22000000-0000-4000-8000-000000000001",
        expectedDigest:
          "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      },
      plannerGoalExpectation: {
        expectedDigest:
          "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      },
    });

    expect(parsed.success).toBe(false);
  });

  it("allows omitting timezone because the route loads the profile timezone", () => {
    const parsed = targetedExactDateRequestSchema.safeParse({
      goalId,
      date: "2026-08-05",
      desiredFactState: "present",
    });

    expect(parsed.success).toBe(true);
  });
});

describe("mapCompletionRpcError", () => {
  it("maps known completion invariant failures to stable 422 route errors", () => {
    expect(
      mapCompletionRpcError({
        code: "23514",
        message: "future_completion_not_allowed",
      })
    ).toMatchObject({
      status: 422,
      code: "future_completion_not_allowed",
    });
    expect(
      mapCompletionRpcError({
        code: "23514",
        message: "completion_outside_goal_lifetime",
      })
    ).toMatchObject({
      status: 422,
      code: "completion_outside_goal_lifetime",
    });
  });

  it("leaves unknown RPC failures unmapped", () => {
    expect(
      mapCompletionRpcError({
        code: "42501",
        message: "not_authorized_for_goal",
      })
    ).toBeNull();
    expect(mapCompletionRpcError(null)).toBeNull();
  });
});

describe("exact-date dispatch helpers", () => {
  it("maps stale digest mismatch to stale revision for item dispatch", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        error: null,
      }),
      from: vi.fn(),
    } as unknown as Parameters<typeof applyPlannerItemDateFact>[0]["supabase"];

    const result = await applyPlannerItemDateFact({
      supabase,
      goalId,
      desiredFactState: "present",
      timezone: "UTC",
      goalLifetime: { startDate: "2026-08-01", endDate: "2026-08-31" },
      expectation: {
        itemId: "22000000-0000-4000-8000-000000000001",
        expectedDigest:
          "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      },
    });

    expect(result).toEqual({
      ok: false,
      status: 409,
      code: "stale_revision",
      message: "Planner completion state is stale. Refresh and try again.",
    });
  });

  it("uses planner item scheduled date for completion RPC writes", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: null });
    const plannerItemQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(),
    };
    plannerItemQuery.select.mockReturnValue(plannerItemQuery);
    plannerItemQuery.eq.mockReturnValue(plannerItemQuery);
    plannerItemQuery.maybeSingle.mockResolvedValue({
      data: {
        id: "22000000-0000-4000-8000-000000000001",
        goal_id: goalId,
        unit_key: "total:1",
        scheduled_date: "2026-08-03",
      },
      error: null,
    });
    const supabase = {
      rpc,
      from: vi.fn((table: string) => {
        if (table === "planner_items") {
          return plannerItemQuery;
        }
        throw new Error(`unexpected table: ${table}`);
      }),
    } as unknown as Parameters<typeof applyPlannerItemDateFact>[0]["supabase"];

    const result = await applyPlannerItemDateFact({
      supabase,
      goalId,
      desiredFactState: "present",
      timezone: "UTC",
      goalLifetime: { startDate: "2026-08-01", endDate: "2026-08-31" },
      expectation: {
        itemId: "22000000-0000-4000-8000-000000000001",
        expectedDigest:
          "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      },
    });

    expect(result).toEqual({
      ok: true,
      payload: {
        goalId,
        date: "2026-08-03",
        factState: "present",
      },
    });
    expect(rpc).toHaveBeenLastCalledWith(
      "complete_planner_item_on_date_service",
      {
        p_goal_id: goalId,
        p_unit_key: "total:1",
        p_date: "2026-08-03",
        p_expected_digest:
          "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      }
    );
  });

  it("atomically removes a planner completion so its move can be restored", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        error: null,
      })
      .mockResolvedValueOnce({
        data: [
          {
            unit_key: "total:1",
            restored_from: "2026-08-05",
            restored_to: "2026-08-03",
            schedule_digest:
              "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          },
        ],
        error: null,
      });
    const plannerItemQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(),
    };
    plannerItemQuery.select.mockReturnValue(plannerItemQuery);
    plannerItemQuery.eq.mockReturnValue(plannerItemQuery);
    plannerItemQuery.maybeSingle.mockResolvedValue({
      data: {
        id: "22000000-0000-4000-8000-000000000001",
        goal_id: goalId,
        unit_key: "total:1",
        scheduled_date: "2026-08-05",
      },
      error: null,
    });
    const supabase = {
      rpc,
      from: vi.fn(() => plannerItemQuery),
    } as unknown as Parameters<typeof applyPlannerItemDateFact>[0]["supabase"];

    const result = await applyPlannerItemDateFact({
      supabase,
      goalId,
      desiredFactState: "absent",
      timezone: "UTC",
      goalLifetime: { startDate: "2026-08-01", endDate: "2026-08-31" },
      expectation: {
        itemId: "22000000-0000-4000-8000-000000000001",
        expectedDigest:
          "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      },
    });

    expect(result.ok).toBe(true);
    expect(rpc).toHaveBeenLastCalledWith(
      "uncomplete_planner_item_on_date_service",
      {
        p_goal_id: goalId,
        p_date: "2026-08-05",
        p_expected_digest:
          "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      }
    );
  });

  it("allows planner goal dispatch without linked-suppression prechecks", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: goalDispatchDigest,
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: null });
    const supabase = {
      rpc,
      from: vi.fn(() => {
        throw new Error("linked suppression lookup should not run");
      }),
    } as unknown as Parameters<typeof applyPlannerGoalDateFact>[0]["supabase"];

    const result = await applyPlannerGoalDateFact({
      supabase,
      goalId,
      date: "2026-08-05",
      desiredFactState: "present",
      timezone: "UTC",
      goalLifetime: { startDate: "2026-08-01", endDate: "2026-08-31" },
      expectation: {
        expectedDigest: goalDispatchDigest,
      },
    });

    expect(result).toEqual({
      ok: true,
      payload: {
        goalId,
        date: "2026-08-05",
        factState: "present",
      },
    });
    expect(rpc).toHaveBeenLastCalledWith("mark_goal_complete", {
      p_goal_id: goalId,
      p_date: "2026-08-05",
    });
  });
});
