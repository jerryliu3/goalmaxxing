// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetEnvCacheForTests } from "@/lib/env";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
  createAdminClient: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  in: vi.fn(),
  eq: vi.fn(),
  gte: vi.fn(),
  order: vi.fn(),
  range: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser },
    rpc: mocks.rpc,
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

import { GET } from "./route";

describe("GET /api/social/team", () => {
  beforeEach(() => {
    vi.stubEnv("SOCIAL_ENABLED", "true");
    resetEnvCacheForTests();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "viewer-1" } },
      error: null,
    });
    mocks.rpc.mockResolvedValue({
      data: [
        {
          team_id: "11111111-1111-4111-8111-111111111111",
          status: "pending",
          partner_id: "partner-1",
          partner_username: "partner",
          partner_display_name: "Partner",
          partner_avatar_url: null,
          invite_message: null,
          invited_at: "2026-08-10T00:00:00.000Z",
          accepted_at: null,
          closed_at: null,
          is_incoming: true,
        },
      ],
      error: null,
    });
    const query = {
      select: mocks.select,
      in: mocks.in,
      eq: mocks.eq,
      gte: mocks.gte,
      order: mocks.order,
      range: mocks.range,
    };
    mocks.createAdminClient.mockReturnValue({ from: mocks.from });
    mocks.from.mockReturnValue(query);
    mocks.select.mockReturnValue(query);
    mocks.in.mockReturnValue(query);
    mocks.eq.mockReturnValue(query);
    mocks.gte.mockReturnValue(query);
    mocks.order.mockReturnValue(query);
    mocks.range.mockResolvedValue({ data: [], error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    resetEnvCacheForTests();
  });

  it("returns 503 when social is disabled", async () => {
    vi.stubEnv("SOCIAL_ENABLED", "false");
    resetEnvCacheForTests();
    const response = await GET(new Request("http://localhost/api/social/team"));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      code: "social_disabled",
    });
  });

  it("returns team state envelope", async () => {
    const response = await GET(new Request("http://localhost/api/social/team"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      schemaVersion: "1",
      items: [{ status: "pending", isIncoming: true }],
    });
  });

  it("derives active team XP from both members' signed global ledger rows", async () => {
    vi.stubEnv("XP_ENABLED", "true");
    resetEnvCacheForTests();
    mocks.rpc.mockResolvedValue({
      data: [
        {
          team_id: "11111111-1111-4111-8111-111111111111",
          status: "active",
          partner_id: "partner-1",
          partner_username: "partner",
          partner_display_name: "Partner",
          partner_avatar_url: null,
          invite_message: null,
          invited_at: "2026-08-10T00:00:00.000Z",
          accepted_at: "2026-08-12T14:30:00.000Z",
          closed_at: null,
          is_incoming: true,
        },
      ],
      error: null,
    });
    mocks.range.mockResolvedValue({
      data: [
        { seq: 1, xp_delta: 40 },
        { seq: 2, xp_delta: 25 },
        { seq: 3, xp_delta: -10 },
      ],
      error: null,
    });

    const response = await GET(new Request("http://localhost/api/social/team"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      items: [
        {
          status: "active",
          acceptedAt: "2026-08-12T14:30:00.000Z",
          teamXp: 55,
        },
      ],
    });
    expect(mocks.from).toHaveBeenCalledWith("xp_ledger");
    expect(mocks.in).toHaveBeenCalledWith("user_id", ["viewer-1", "partner-1"]);
    expect(mocks.eq).toHaveBeenCalledWith("track_key", "global");
    expect(mocks.gte).toHaveBeenCalledWith(
      "created_at",
      "2026-08-12T14:30:00.000Z"
    );
  });

  it("paginates ledger reads so large team totals are not truncated", async () => {
    vi.stubEnv("XP_ENABLED", "true");
    resetEnvCacheForTests();
    mocks.rpc.mockResolvedValue({
      data: [
        {
          team_id: "11111111-1111-4111-8111-111111111111",
          status: "active",
          partner_id: "partner-1",
          partner_username: "partner",
          partner_display_name: "Partner",
          partner_avatar_url: null,
          invite_message: null,
          invited_at: "2026-08-10T00:00:00.000Z",
          accepted_at: "2026-08-12T14:30:00.000Z",
          closed_at: null,
          is_incoming: true,
        },
      ],
      error: null,
    });
    mocks.range
      .mockResolvedValueOnce({
        data: Array.from({ length: 1_000 }, (_, index) => ({
          seq: index + 1,
          xp_delta: 1,
        })),
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ seq: 1_001, xp_delta: 5 }],
        error: null,
      });

    const response = await GET(new Request("http://localhost/api/social/team"));

    await expect(response.json()).resolves.toMatchObject({
      items: [{ teamXp: 1_005 }],
    });
    expect(mocks.range).toHaveBeenNthCalledWith(1, 0, 999);
    expect(mocks.range).toHaveBeenNthCalledWith(2, 1_000, 1_999);
  });

  it("skips team XP ledger reads when XP is disabled", async () => {
    vi.stubEnv("XP_ENABLED", "false");
    resetEnvCacheForTests();
    mocks.rpc.mockResolvedValue({
      data: [
        {
          team_id: "11111111-1111-4111-8111-111111111111",
          status: "active",
          partner_id: "partner-1",
          partner_username: "partner",
          partner_display_name: "Partner",
          partner_avatar_url: null,
          invite_message: null,
          invited_at: "2026-08-10T00:00:00.000Z",
          accepted_at: "2026-08-12T14:30:00.000Z",
          closed_at: null,
          is_incoming: true,
        },
      ],
      error: null,
    });

    const response = await GET(new Request("http://localhost/api/social/team"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      items: [{ status: "active", acceptedAt: "2026-08-12T14:30:00.000Z" }],
    });
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("returns team state without team XP when the admin ledger client fails", async () => {
    vi.stubEnv("XP_ENABLED", "true");
    resetEnvCacheForTests();
    mocks.rpc.mockResolvedValue({
      data: [
        {
          team_id: "11111111-1111-4111-8111-111111111111",
          status: "active",
          partner_id: "partner-1",
          partner_username: "partner",
          partner_display_name: "Partner",
          partner_avatar_url: null,
          invite_message: null,
          invited_at: "2026-08-10T00:00:00.000Z",
          accepted_at: "2026-08-12T14:30:00.000Z",
          closed_at: null,
          is_incoming: true,
        },
      ],
      error: null,
    });
    mocks.createAdminClient.mockImplementation(() => {
      throw new Error(
        "SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY must be a service-role JWT or sb_secret_ key."
      );
    });

    const response = await GET(new Request("http://localhost/api/social/team"));

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.items).toEqual([
      expect.objectContaining({
        status: "active",
        acceptedAt: "2026-08-12T14:30:00.000Z",
      }),
    ]);
    expect(payload.items[0].teamXp).toBeNull();
  });
});
