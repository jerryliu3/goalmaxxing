// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetEnvCacheForTests } from "@/lib/env";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser },
    rpc: mocks.rpc,
  }),
}));

import { GET } from "./route";

const challengeId = "11111111-1111-4111-8111-111111111111";

describe("GET /api/social/challenges/[challengeId]/standings", () => {
  beforeEach(() => {
    vi.stubEnv("SOCIAL_ENABLED", "true");
    resetEnvCacheForTests();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "viewer-1" } },
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    resetEnvCacheForTests();
  });

  it("returns ranked challenge participants", async () => {
    mocks.rpc.mockResolvedValue({
      data: [
        {
          challenge_id: challengeId,
          subject_kind: "user",
          subject_id: "user-2",
          display_name: "Avery",
          avatar_url: null,
          score: 8,
          rank: 1,
          is_viewer: false,
          total_count: 2,
        },
        {
          challenge_id: challengeId,
          subject_kind: "user",
          subject_id: "viewer-1",
          display_name: "You",
          avatar_url: null,
          score: 5,
          rank: 2,
          is_viewer: true,
          total_count: 2,
        },
      ],
      error: null,
    });

    const response = await GET(
      new Request(
        `http://localhost/api/social/challenges/${challengeId}/standings?limit=50&offset=0`
      ),
      { params: { challengeId } }
    );

    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("get_challenge_standings", {
      p_challenge_id: challengeId,
      p_limit: 50,
      p_offset: 0,
    });
    await expect(response.json()).resolves.toMatchObject({
      schemaVersion: "1",
      totalCount: 2,
      standings: [
        { displayName: "Avery", score: 8, rank: 1, isViewer: false },
        { displayName: "You", score: 5, rank: 2, isViewer: true },
      ],
    });
  });

  it("requires challenge membership", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { message: "challenge_join_required" },
    });

    const response = await GET(
      new Request(
        `http://localhost/api/social/challenges/${challengeId}/standings`
      ),
      { params: { challengeId } }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      code: "challenge_join_required",
    });
  });
});
