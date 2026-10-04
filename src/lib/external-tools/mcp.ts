import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { NextResponse } from "next/server";
import { ApiRouteError, createCorrelationId, handleApiRouteError } from "@/lib/api/route";
import { reportError } from "@/lib/observability/report-error";
import { requireExternalContext, externalAuthErrorResponse, type ExternalContext } from "./auth";
import { externalResourceUrl } from "./oauth";
import { operationSchemas, type OperationName } from "./schemas";
import { operationMetadata } from "./catalog";
import { executeOperation } from "./operations";

export function createAccountMcpServer(context: ExternalContext) {
  // A fresh server for each HTTP request prevents account context crossing users.
  const server = new McpServer({ name: "goalmaxxing", version: "1.0.0" }, {
    instructions: "Goalmaxxing is the account and planning system. Use your host model for reasoning, parsing and coaching: no exposed tool calls Goalmaxxing AI. Get account timezone/today first. Read before editing, paginate complete lists, preserve unchanged goal definition fields, and ask the user to approve consequential changes. Preview a stable plan and show its changes before publishing exactly that preview. Never invent revision or confirmation hashes; refresh and seek renewed approval after stale-state errors. Keep requestId unchanged for a retry and use a fresh UUID for a different logical mutation.",
  });
  for (const name of Object.keys(operationSchemas) as OperationName[]) {
    const metadata = operationMetadata[name];
    server.registerTool(name, {
      title: metadata.title, description: metadata.description,
      inputSchema: operationSchemas[name],
      annotations: { readOnlyHint: metadata.readOnly, destructiveHint: metadata.destructive ?? false, idempotentHint: true, openWorldHint: false },
      _meta: { securitySchemes: [{ type: "oauth2", scopes: ["openid"] }] },
    }, async input => {
      const correlationId = createCorrelationId();
      try {
        const data = await executeOperation(context, name, input);
        const result = { schemaVersion: "1", ...data, correlationId };
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
      } catch (error) {
        const known = error instanceof ApiRouteError;
        if (!known || error.status >= 500) reportError(error, { correlationId, code: known ? error.code : "internal_error", operation: name, status: known ? error.status : 500 });
        const result = {
          code: known ? error.code : "internal_error",
          message: known ? error.message : "The account operation failed. Try again or contact support with the correlation ID.",
          correlationId, ...(known && error.details ? { details: error.details } : {}),
        };
        return {
          isError: true, content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result,
          ...(known && error.status === 401 ? { _meta: { "mcp/www_authenticate": [`Bearer resource_metadata="${new URL("/.well-known/oauth-protected-resource/api/mcp", externalResourceUrl()).href}", error="invalid_token"`] } } : {}),
        };
      }
    });
  }
  return server;
}

export async function handleAccountMcp(request: Request) {
  const correlationId = createCorrelationId();
  try {
    const context = await requireExternalContext(request);
    const server = createAccountMcpServer(context);
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true, maxRequestBodySize: 256 * 1024 });
    try {
      await server.connect(transport);
      const response = await transport.handleRequest(request);
      const headers = new Headers(response.headers);
      headers.set("Cache-Control", "no-store"); headers.set("X-Correlation-Id", correlationId);
      return new NextResponse(response.body, { status: response.status, headers });
    } finally { await server.close(); }
  } catch (error) {
    return error instanceof ApiRouteError ? externalAuthErrorResponse(error, correlationId) : handleApiRouteError(error, correlationId);
  }
}
