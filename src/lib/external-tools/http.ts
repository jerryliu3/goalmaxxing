import { z } from "zod";
import { NextResponse } from "next/server";
import { ApiRouteError, handleApiRouteError, parseJsonBody, withRoute, apiSuccessResponse } from "@/lib/api/route";
import { requireExternalContext, externalAuthErrorResponse } from "./auth";
import { httpRoutes } from "./catalog";
import { executeOperation } from "./operations";

export function matchHttpRoute(method: string, path: string) {
  for (const route of httpRoutes) {
    if (route.method !== method) continue;
    const keys: string[] = [];
    const pattern = route.path.replace(/\{(\w+)\}/g, (_match, key: string) => { keys.push(key); return "([^/]+)"; });
    const match = new RegExp(`^${pattern}$`).exec(path);
    if (match) return { route, params: Object.fromEntries(keys.map((key, index) => [key, match[index + 1]])) };
  }
  return null;
}

export function parseExternalQuery(params: URLSearchParams): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  for (const [key, value] of params) {
    if (key in input) throw new ApiRouteError(400, "validation_failed", `Query parameter ${key} must appear once.`);
    input[key] = key === "limit" ? Number(value) : key === "includeArchived" && ["true", "false"].includes(value) ? value === "true" : value;
  }
  return input;
}

export async function handleExternalHttp(request: Request, path: string) {
  return withRoute(async ({ correlationId }) => {
    const context = await requireExternalContext(request);
    const matched = matchHttpRoute(request.method, path);
    if (!matched) {
      const allowed = httpRoutes.filter(route => matchHttpRoute(route.method, path)).map(route => route.method);
      if (allowed.length) return NextResponse.json({ code: "method_not_allowed", message: "This method is not supported for this endpoint.", correlationId }, { status: 405, headers: { Allow: [...new Set(allowed)].join(", "), "Cache-Control": "no-store" } });
      throw new ApiRouteError(404, "endpoint_not_found", "This account endpoint does not exist.");
    }
    const input = request.method === "GET"
      ? parseExternalQuery(new URL(request.url).searchParams)
      : await parseJsonBody({ request, schema: z.record(z.string(), z.unknown()), maxBytes: 256 * 1024 });
    for (const key of Object.keys(matched.params)) if (key in input) throw new ApiRouteError(400, "validation_failed", `${key} belongs in the URL, not the request body.`);
    const result = await executeOperation(context, matched.route.operation, { ...input, ...matched.params });
    return apiSuccessResponse({ schemaVersion: "1", ...result }, correlationId, matched.route.operation.startsWith("create_") ? 201 : 200);
  }, { onError: (error, correlationId) => error instanceof ApiRouteError
    ? externalAuthErrorResponse(error, correlationId, "/api/v1")
    : handleApiRouteError(error, correlationId) });
}
