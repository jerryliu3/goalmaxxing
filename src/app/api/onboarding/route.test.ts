// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), rpc: vi.fn(), from: vi.fn() }));
vi.mock("@/lib/api/route", async () => ({ ...await vi.importActual<typeof import("@/lib/api/route")>("@/lib/api/route"), requireAuthenticatedRequestContext: mocks.auth }));
import { GET, POST } from "./route";
import { ApiRouteError } from "@/lib/api/route";
const request = (body: unknown) => new Request("http://localhost/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ userId: "account-1", supabase: { rpc: mocks.rpc, from: mocks.from } });
  mocks.rpc.mockResolvedValue({ data: { setup_step: 1, completed_at: null, tours: {} }, error: null });
});
describe("account onboarding boundary", () => {
  it("requires authentication", async () => {
    mocks.auth.mockRejectedValue(new ApiRouteError(401, "unauthorized", "Sign in."));
    expect((await POST(request({ action: "complete" }))).status).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("rejects unknown fields and invalid steps before writing", async () => {
    for (const body of [{ action: "advance", step: 4 }, { action: "complete", userId: "someone-else" }, { action: "tour", key: "other", status: "complete" }]) {
      expect((await POST(request(body))).status).toBe(400);
    }
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("uses the authenticated RPC without accepting a target user", async () => {
    const response = await POST(request({ action: "advance", step: 1 }));
    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("update_onboarding_progress", { p_action: "advance", p_step: 1 });
    expect(await response.json()).toMatchObject({ progress: { setup_step: 1 }, correlationId: expect.any(String) });
  });
  it("reports incomplete setup as an actionable conflict", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "ONBOARDING_SETUP_INCOMPLETE" } });
    const response = await POST(request({ action: "complete" }));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "onboarding_setup_incomplete" });
  });
  it("preserves the existing account completion marker even without practice progress", async () => {
    const completed_at = "2026-10-01T12:00:00+00:00";
    mocks.from.mockImplementation((table: string) => ({ select: () => ({ eq: (_key: string, id: string) => {
      expect(id).toBe("account-1");
      return { maybeSingle: async () => ({ data: table === "profiles" ? { onboarding_completed_at: completed_at } : null, error: null }) };
    } }) }));
    const response = await GET(new Request("http://localhost/api/onboarding"));
    expect(await response.json()).toMatchObject({ progress: { setup_step: 3, completed_at, tours: {} } });
  });
});
