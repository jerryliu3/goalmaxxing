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

import { DELETE } from "./route";

const CHALLENGE_ID = "11111111-1111-4111-8111-111111111111";

function leaveRequest() {
  return new Request(`http://localhost/api/social/challenges/${CHALLENGE_ID}/join`, {
    method: "DELETE",
  });
}

describe("DELETE /api/social/challenges/[challengeId]/join", () => {
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

  it("leaves a challenge the viewer has completed", async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });

    const response = await DELETE(leaveRequest(), {
      params: { challengeId: CHALLENGE_ID },
    });

    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("leave_challenge_service", {
      p_challenge_id: CHALLENGE_ID,
    });
    await expect(response.json()).resolves.toMatchObject({
      challengeId: CHALLENGE_ID,
      joined: false,
    });
  });

  it("returns 404 when the challenge does not exist", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { message: "challenge_not_found" },
    });

    const response = await DELETE(leaveRequest(), {
      params: { challengeId: CHALLENGE_ID },
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      code: "challenge_not_found",
    });
  });

  it("returns 409 when the challenge is already over", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { message: "challenge_already_ended" },
    });

    const response = await DELETE(leaveRequest(), {
      params: { challengeId: CHALLENGE_ID },
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: "challenge_already_ended",
    });
  });

  it("returns 409 when a team challenge has no active team", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { message: "team_required" },
    });

    const response = await DELETE(leaveRequest(), {
      params: { challengeId: CHALLENGE_ID },
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: "team_required",
    });
  });
});
