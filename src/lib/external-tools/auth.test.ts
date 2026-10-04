import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ enabled: true, claims: vi.fn(), user: vi.fn(), connection: vi.fn() }));
vi.mock("@/lib/feature-flags", () => ({ areExternalToolsEnabled: () => mocks.enabled }));
vi.mock("@/lib/supabase/config", () => ({ getSupabaseConfig: () => ({ supabaseUrl: "https://project.supabase.co" }) }));
vi.mock("@/lib/env", () => ({ getPublicEnv: () => ({ NEXT_PUBLIC_APP_URL: "https://goalmaxxing.app" }) }));
vi.mock("@/lib/supabase/route", () => ({ createRouteClient: async () => ({ supabase: {
  auth: { getClaims: mocks.claims, getUser: mocks.user },
  from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: mocks.connection }) }) }) }),
} }) }));
import { requireExternalContext, externalAuthErrorResponse } from "./auth";
import { ApiRouteError } from "@/lib/api/route";
import { resetRateLimitBucketsForTests } from "@/lib/api/rate-limit";
import { hasOAuthClientClaim, isExternalAccountRoute, protectedResourceMetadata } from "./oauth";
const userId = "11111111-1111-4111-8111-111111111111";
const clientId = "22222222-2222-4222-8222-222222222222";
const request = () => new Request("https://goalmaxxing.app/api/v1/goals", { headers: { authorization: "Bearer token" } });
describe("external account authorization", () => {
  beforeEach(() => {
    mocks.enabled = true; resetRateLimitBucketsForTests();
    mocks.claims.mockResolvedValue({ data: { claims: { sub: userId, role: "authenticated", iss: "https://project.supabase.co/auth/v1", aud: "authenticated", iat: Date.now() / 1000, exp: Date.now() / 1000 + 3600, client_id: clientId } }, error: null });
    mocks.user.mockResolvedValue({ data: { user: { id: userId } }, error: null });
    mocks.connection.mockResolvedValue({ data: { revoked_at: null, connected_at: "2026-01-01T00:00:00Z" }, error: null });
  });
  it("rejects cookies without a bearer token", async () => {
    await expect(requireExternalContext(new Request("https://goalmaxxing.app/api/v1/goals", { headers: { cookie: "session=abc" } }))).rejects.toMatchObject({ status: 401 });
  });
  it("binds an OAuth connection to the verified user and client", async () => {
    await expect(requireExternalContext(request())).resolves.toMatchObject({ userId, clientId });
  });
  it("denies access immediately after a connection is revoked", async () => {
    mocks.connection.mockResolvedValue({ data: { revoked_at: new Date().toISOString() }, error: null });
    await expect(requireExternalContext(request())).rejects.toMatchObject({ code: "connection_revoked", status: 401 });
  });
  it("does not revive old access tokens when a client reconnects", async () => {
    mocks.connection.mockResolvedValue({ data: { revoked_at: null, connected_at: new Date(Date.now() + 60_000).toISOString() }, error: null });
    await expect(requireExternalContext(request())).rejects.toMatchObject({ code: "connection_revoked" });
  });
  it("never auto-approves an unregistered client", async () => {
    mocks.connection.mockResolvedValue({ data: null, error: null });
    await expect(requireExternalContext(request())).rejects.toMatchObject({ code: "connection_revoked" });
  });
  it("rejects service credentials, expired tokens, and foreign issuers", async () => {
    for (const patch of [{ role: "service_role" }, { exp: 1 }, { iss: "https://evil.example/auth/v1" }]) {
      mocks.claims.mockResolvedValueOnce({ data: { claims: { sub: userId, role: "authenticated", iss: "https://project.supabase.co/auth/v1", aud: "authenticated", iat: Date.now() / 1000, exp: Date.now() / 1000 + 3600, ...patch } }, error: null });
      await expect(requireExternalContext(request())).rejects.toMatchObject({ code: "invalid_token" });
    }
  });
  it("rejects cross-origin browser calls and dark launches", async () => {
    await expect(requireExternalContext(new Request("https://goalmaxxing.app/api/mcp", { headers: { origin: "https://evil.example", authorization: "Bearer token" } }))).rejects.toMatchObject({ status: 403 });
    mocks.enabled = false;
    await expect(requireExternalContext(request())).rejects.toMatchObject({ status: 404 });
  });
  it("advertises the correct protected resource and preserves the correlation ID", async () => {
    const correlationId = "33333333-3333-4333-8333-333333333333";
    const response = externalAuthErrorResponse(new ApiRouteError(401, "invalid_token", "Reconnect."), correlationId, "/api/v1");
    expect(response.headers.get("www-authenticate")).toContain("/.well-known/oauth-protected-resource/api/v1");
    expect((await response.json()).correlationId).toBe(correlationId);
    expect(protectedResourceMetadata("/api/mcp").resource).toBe("https://goalmaxxing.app/api/mcp");
  });
  it("keeps connected apps off the model-backed legacy routes", () => {
    const token = `header.${Buffer.from(JSON.stringify({ client_id: clientId })).toString("base64url")}.signature`;
    expect(hasOAuthClientClaim(token)).toBe(true);
    expect(isExternalAccountRoute("https://goalmaxxing.app/api/planner/coach")).toBe(false);
    expect(isExternalAccountRoute("https://goalmaxxing.app/api/v1/planner/preview")).toBe(true);
  });
});
