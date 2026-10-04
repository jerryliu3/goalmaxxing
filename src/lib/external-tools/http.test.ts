import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), execute: vi.fn() }));
vi.mock("./auth", () => ({ requireExternalContext: mocks.auth, externalAuthErrorResponse: (error: { status: number; code: string }, correlationId: string) => Response.json({ code: error.code, correlationId }, { status: error.status }) }));
vi.mock("./operations", () => ({ executeOperation: mocks.execute }));
import { handleExternalHttp } from "./http";
import { ApiRouteError } from "@/lib/api/route";
describe("external HTTP contract", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.auth.mockResolvedValue({ userId: "owner" }); mocks.execute.mockResolvedValue({ goal: { id: "goal" } }); });
  it("forwards the URL identity and body to the shared operation", async () => {
    const response = await handleExternalHttp(new Request("https://app.example/api/v1/goals/goal", { method: "PUT", body: JSON.stringify({ requestId: "request", expectedUpdatedAt: "version", goal: { title: "Read" } }) }), "/goals/goal");
    expect(response.status).toBe(200);
    expect(mocks.execute).toHaveBeenCalledWith({ userId: "owner" }, "update_goal", { goalId: "goal", requestId: "request", expectedUpdatedAt: "version", goal: { title: "Read" } });
    expect(await response.json()).toMatchObject({ schemaVersion: "1", correlationId: expect.any(String) });
  });
  it("rejects identity overrides before executing a mutation", async () => {
    const response = await handleExternalHttp(new Request("https://app.example/api/v1/goals/owner-goal", { method: "PUT", body: JSON.stringify({ goalId: "other-goal" }) }), "/goals/owner-goal");
    expect(response.status).toBe(400); expect(mocks.execute).not.toHaveBeenCalled();
  });
  it("rejects repeated query parameters", async () => {
    const response = await handleExternalHttp(new Request("https://app.example/api/v1/goals?after=a&after=b"), "/goals");
    expect(response.status).toBe(400); expect(mocks.execute).not.toHaveBeenCalled();
  });
  it("does not expose arbitrary internal routes", async () => {
    const response = await handleExternalHttp(new Request("https://app.example/api/v1/planner/coach", { method: "POST", body: "{}" }), "/planner/coach");
    expect(response.status).toBe(404); expect(mocks.execute).not.toHaveBeenCalled();
  });
  it("authenticates before executing and preserves typed stale-write errors", async () => {
    mocks.auth.mockRejectedValueOnce(new ApiRouteError(401, "invalid_token", "Reconnect."));
    expect((await handleExternalHttp(new Request("https://app.example/api/v1/account"), "/account")).status).toBe(401);
    expect(mocks.execute).not.toHaveBeenCalled();
    mocks.execute.mockRejectedValueOnce(new ApiRouteError(409, "stale_goal", "Refresh."));
    expect((await handleExternalHttp(new Request("https://app.example/api/v1/goals/x", { method: "PUT", body: "{}" }), "/goals/x")).status).toBe(409);
  });
  it("returns method-specific Allow without applying an unsupported action", async () => {
    const response = await handleExternalHttp(new Request("https://app.example/api/v1/goals/x", { method: "DELETE" }), "/goals/x");
    expect(response.status).toBe(405); expect(response.headers.get("allow")).toBe("GET, PUT"); expect(mocks.execute).not.toHaveBeenCalled();
  });
});
