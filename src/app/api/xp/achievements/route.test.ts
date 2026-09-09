// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetEnvCacheForTests } from "@/lib/env";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  }),
}));

import { GET } from "./route";

function buildFromStub() {
  return vi.fn((table: string) => {
    if (table === "profiles") {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: { timezone: "America/New_York", week_starts_on: 1 },
                error: null,
              }),
          }),
        }),
      };
    }
    if (table === "goals") {
      const chain = {
        eq: () => chain,
        order: () => chain,
        limit: () => Promise.resolve({ data: [], error: null }),
      };
      return { select: () => chain };
    }
    if (table === "completions") {
      const chain = {
        eq: () => chain,
        order: () => chain,
        limit: () => Promise.resolve({ data: [], error: null }),
      };
      return { select: () => chain };
    }
    if (table === "user_awards") {
      const chain = {
        eq: () => chain,
        order: () =>
          Promise.resolve({
            data: [
              {
                id: "award-2",
                unlocked_at: "2026-03-01T00:00:00.000Z",
                acknowledged_at: null,
                revoked_at: null,
                xp_rewards: {
                  level: 2,
                  reward_code: "xp.level.2",
                  reward_title: "Level 2 unlocked",
                  reward_description: "You reached Level 2.",
                },
              },
            ],
            error: null,
          }),
      };
      return { select: () => chain };
    }
    if (table === "xp_rewards") {
      return {
        select: () => ({
          order: () =>
            Promise.resolve({
              data: [
                {
                  id: "reward-2",
                  level: 2,
                  reward_code: "xp.level.2",
                  reward_title: "Level 2 unlocked",
                  reward_description: "You reached Level 2.",
                },
                {
                  id: "reward-4",
                  level: 4,
                  reward_code: "xp.level.4",
                  reward_title: "Level 4 unlocked",
                  reward_description: "You reached Level 4.",
                },
              ],
              error: null,
            }),
        }),
      };
    }
    if (table === "xp_profiles") {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({ data: { total_xp: 800 }, error: null }),
            }),
          }),
        }),
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });
}

describe("GET /api/xp/achievements", () => {
  beforeEach(() => {
    vi.stubEnv("XP_ENABLED", "true");
    resetEnvCacheForTests();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });
    mocks.from.mockImplementation(buildFromStub());
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    resetEnvCacheForTests();
  });

  it("returns the showcase payload with locked level mounts", async () => {
    const response = await GET(new Request("http://localhost/api/xp/achievements"));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.schemaVersion).toBe("2");
    expect(body.levelAwards).toHaveLength(2);
    expect(body.levelAwards[0]?.unlockedAt).toBeTruthy();
    expect(body.levelAwards[1]?.unlockedAt).toBeNull();
    expect(body.personalRecords).toHaveLength(4);
    expect(body).not.toHaveProperty("globalAchievements");
  });
});
