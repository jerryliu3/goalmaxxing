import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { ExternalContext } from "./auth";
const mocks = vi.hoisted(() => ({ execute: vi.fn(), auth: vi.fn() }));
vi.mock("./operations", () => ({ executeOperation: mocks.execute }));
vi.mock("./auth", () => ({ requireExternalContext: mocks.auth, externalAuthErrorResponse: (error: { status: number; code: string }, correlationId: string) => Response.json({ code: error.code, correlationId }, { status: error.status, headers: { "WWW-Authenticate": 'Bearer resource_metadata="https://goalmaxxing.app/.well-known/oauth-protected-resource/api/mcp"' } }) }));
vi.mock("@/lib/env", () => ({ getPublicEnv: () => ({ NEXT_PUBLIC_APP_URL: "https://goalmaxxing.app" }) }));
import { createAccountMcpServer, handleAccountMcp } from "./mcp";
import { ApiRouteError } from "@/lib/api/route";
const contexts: ExternalContext[] = [];
const clients: Client[] = [];
const servers: ReturnType<typeof createAccountMcpServer>[] = [];
async function connect(userId: string) {
  const context = { userId, token: `token-${userId}` } as ExternalContext;
  contexts.push(context);
  const server = createAccountMcpServer(context);
  const client = new Client({ name: "test-assistant", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  servers.push(server); clients.push(client);
  await server.connect(serverTransport); await client.connect(clientTransport);
  return client;
}
describe("Goalmaxxing MCP protocol", () => {
  beforeEach(() => { vi.clearAllMocks(); contexts.length = 0; mocks.execute.mockResolvedValue({ today: "2026-10-04" }); });
  afterEach(async () => { await Promise.all(clients.splice(0).map(client => client.close())); await Promise.all(servers.splice(0).map(server => server.close())); });
  it("advertises the shared tools with read/write and OAuth metadata", async () => {
    const client = await connect("owner");
    const { tools } = await client.listTools();
    expect(tools).toHaveLength(16);
    expect(tools.find(tool => tool.name === "preview_plan")?.annotations?.readOnlyHint).toBe(true);
    expect(tools.find(tool => tool.name === "publish_plan")?.annotations?.destructiveHint).toBe(true);
    expect(tools.find(tool => tool.name === "get_account")?._meta?.securitySchemes).toEqual([{ type: "oauth2", scopes: ["openid"] }]);
    expect(tools.some(tool => /coach|generate|parse/.test(tool.name))).toBe(false);
  });
  it("executes real MCP calls against the bound account context", async () => {
    const first = await connect("first-owner"); const second = await connect("second-owner");
    await first.callTool({ name: "get_account", arguments: {} });
    await second.callTool({ name: "get_account", arguments: {} });
    expect(mocks.execute.mock.calls[0][0]).toBe(contexts[0]);
    expect(mocks.execute.mock.calls[1][0]).toBe(contexts[1]);
  });
  it("keeps actionable conflict codes in tool errors", async () => {
    const client = await connect("owner");
    mocks.execute.mockRejectedValueOnce(new ApiRouteError(409, "stale_goal", "Read the goal again."));
    const result = await client.callTool({ name: "get_account", arguments: {} });
    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({ code: "stale_goal", correlationId: expect.any(String) });
  });
  it("rejects invalid tool input before invoking account services", async () => {
    const client = await connect("owner");
    const result = await client.callTool({ name: "create_task", arguments: { title: "Read" } });
    expect(result.isError).toBe(true); expect(mocks.execute).not.toHaveBeenCalled();
  });
  it("challenges unauthenticated transport requests before constructing account tools", async () => {
    mocks.auth.mockRejectedValueOnce(new ApiRouteError(401, "authentication_required", "Connect account."));
    const response = await handleAccountMcp(new Request("https://goalmaxxing.app/api/mcp", { method: "POST", body: "{}" }));
    expect(response.status).toBe(401); expect(response.headers.get("www-authenticate")).toContain("resource_metadata");
    expect(mocks.execute).not.toHaveBeenCalled();
  });
});
