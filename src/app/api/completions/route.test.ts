// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetEnvCacheForTests } from "@/lib/env";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  goalMaybeSingle: vi.fn(),
  profileMaybeSingle: vi.fn(),
  rpc: vi.fn(),
  applyPlannerItemDateFact: vi.fn(),
  applyPlannerGoalDateFact: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => {
    const goalQuery = {
      select: vi.fn(() => goalQuery),
      eq: vi.fn(() => goalQuery),
      maybeSingle: mocks.goalMaybeSingle,
    };
    const profileQuery = {
      select: vi.fn(() => profileQuery),
      eq: vi.fn(() => profileQuery),
      maybeSingle: mocks.profileMaybeSingle,
    };
    return {
      auth: { getUser: mocks.getUser },
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return profileQuery;
        }
        return goalQuery;
      }),
      rpc: mocks.rpc,
    };
  },
}));

vi.mock("@/lib/planner/exact-date-dispatch", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/planner/exact-date-dispatch")
  >("@/lib/planner/exact-date-dispatch");
  return {
    ...actual,
    applyPlannerItemDateFact: mocks.applyPlannerItemDateFact,
    applyPlannerGoalDateFact: mocks.applyPlannerGoalDateFact,
  };
});

import { POST } from "./route";

const goalId = "10000000-0000-4000-8000-000000000011";

function request(
  date: string,
  desiredFactState: "present" | "absent",
  timezone = "UTC",
  extra: Record<string, unknown> = {}
) {
  return new Request("http://localhost/api/completions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      goalId,
      date,
      desiredFactState,
      timezone,
      ...extra,
    }),
  });
}

describe("completions route", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-05T13:00:00.000Z"));
    resetEnvCacheForTests();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "11111111-1111-4111-8111-111111111111" } },
      error: null,
    });
    mocks.goalMaybeSingle.mockResolvedValue({
      data: {
        id: goalId,
        frequency_type: "recurring",
        target_count: 12,
        start_date: "2026-08-01",
        end_date: "2026-08-31",
      },
      error: null,
    });
    mocks.profileMaybeSingle.mockResolvedValue({
      data: { timezone: "UTC" },
      error: null,
    });
    mocks.rpc.mockImplementation(async (fn: string) => {
      if (fn === "preview_queued_xp_delta") {
        return { data: 20, error: null };
      }
      return { data: null, error: null };
    });
    mocks.applyPlannerItemDateFact.mockReset();
    mocks.applyPlannerGoalDateFact.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetEnvCacheForTests();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("rejects future creation in the profile timezone", async () => {
    const response = await POST(request("2026-08-06", "present"));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: "future_completion_not_allowed",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("uses the profile timezone, not the request timezone, for creation bounds", async () => {
    mocks.profileMaybeSingle.mockResolvedValue({
      data: { timezone: "Pacific/Auckland" },
      error: null,
    });
    const response = await POST(
      request("2026-08-06", "present", "UTC")
    );

    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("mark_goal_complete", {
      p_goal_id: goalId,
      p_date: "2026-08-06",
    });
    await expect(response.json()).resolves.toMatchObject({ xpDelta: 20 });
  });

  it("allows profile-local today even when the request timezone is still yesterday", async () => {
    vi.setSystemTime(new Date("2026-09-08T03:50:00.000Z"));
    mocks.goalMaybeSingle.mockResolvedValue({
      data: {
        id: goalId,
        start_date: "2026-09-01",
        end_date: "2026-09-30",
      },
      error: null,
    });
    mocks.profileMaybeSingle.mockResolvedValue({
      data: { timezone: "UTC" },
      error: null,
    });

    const response = await POST(
      request("2026-09-08", "present", "America/New_York")
    );

    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("mark_goal_complete", {
      p_goal_id: goalId,
      p_date: "2026-09-08",
    });
  });

  it("rejects a date after profile today even if the request timezone is ahead", async () => {
    const response = await POST(
      request("2026-08-06", "present", "Pacific/Auckland")
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: "future_completion_not_allowed",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("allows omitting the request timezone and still uses the profile timezone", async () => {
    const response = await POST(
      new Request("http://localhost/api/completions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          goalId,
          date: "2026-08-05",
          desiredFactState: "present",
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("mark_goal_complete", {
      p_goal_id: goalId,
      p_date: "2026-08-05",
    });
  });

  it("rejects creation outside the goal lifetime", async () => {
    const response = await POST(request("2026-07-31", "present"));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: "completion_outside_goal_lifetime",
    });
  });

  it("allows exact deletion of a future repair fact", async () => {
    const response = await POST(request("2026-08-31", "absent"));

    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("unmark_goal_complete", {
      p_goal_id: goalId,
      p_date: "2026-08-31",
    });
  });

  it("supports exact-date completion for non-targeted goals", async () => {
    mocks.goalMaybeSingle.mockResolvedValueOnce({
      data: {
        id: goalId,
        start_date: "2026-08-01",
        end_date: "2026-08-31",
      },
      error: null,
    });

    const response = await POST(request("2026-08-05", "present"));

    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("mark_goal_complete", {
      p_goal_id: goalId,
      p_date: "2026-08-05",
    });
  });

  it("routes planner item expectation payloads through planner item dispatch", async () => {
    mocks.applyPlannerItemDateFact.mockResolvedValue({
      ok: true,
      payload: {
        goalId,
        date: "2026-08-05",
        factState: "present",
      },
    });

    const response = await POST(
      request("2026-08-05", "present", "UTC", {
        plannerItemExpectation: {
          itemId: "22000000-0000-4000-8000-000000000001",
          expectedDigest:
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        },
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.applyPlannerItemDateFact).toHaveBeenCalledWith(
      expect.objectContaining({
        goalId,
        desiredFactState: "present",
        timezone: "UTC",
        expectation: {
          itemId: "22000000-0000-4000-8000-000000000001",
          expectedDigest:
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        },
      })
    );
    expect(mocks.rpc).toHaveBeenCalledWith("preview_queued_xp_delta");
    expect(mocks.rpc).toHaveBeenCalledWith("drain_xp_recompute_outbox", {
      p_limit: 50,
    });
    await expect(response.json()).resolves.toMatchObject({ xpDelta: 20 });
  });

  it("routes planner goal expectation payloads through planner goal dispatch", async () => {
    mocks.applyPlannerGoalDateFact.mockResolvedValue({
      ok: true,
      payload: {
        goalId,
        date: "2026-08-05",
        factState: "absent",
      },
    });

    const response = await POST(
      request("2026-08-05", "absent", "UTC", {
        plannerGoalExpectation: {
          expectedDigest:
            "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        },
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.applyPlannerGoalDateFact).toHaveBeenCalledWith(
      expect.objectContaining({
        goalId,
        desiredFactState: "absent",
        timezone: "UTC",
        expectation: {
          expectedDigest:
            "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        },
      })
    );
    expect(mocks.rpc).toHaveBeenCalledWith("preview_queued_xp_delta");
    expect(mocks.rpc).toHaveBeenCalledWith("drain_xp_recompute_outbox", {
      p_limit: 50,
    });
    await expect(response.json()).resolves.toMatchObject({ xpDelta: 20 });
  });

});
