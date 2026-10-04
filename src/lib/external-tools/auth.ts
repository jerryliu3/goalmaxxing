import { z } from "zod";
import { ApiRouteError, handleApiRouteError, createCorrelationId } from "@/lib/api/route";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { areExternalToolsEnabled } from "@/lib/feature-flags";
import { createRouteClient } from "@/lib/supabase/route";
import { readBearerToken } from "@/lib/supabase/auth-header";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { externalResourceUrl, oauthClientIdSchema } from "./oauth";

export function requireExternalToolsEnabled() {
  if (!areExternalToolsEnabled()) throw new ApiRouteError(404, "external_tools_disabled", "External account tools are not enabled.");
}

export function checkExternalOrigin(request: Request) {
  const origin = request.headers.get("origin");
  // Cloud MCP clients normally omit Origin. Browser callers must use the app.
  if (origin && origin !== new URL(externalResourceUrl()).origin) {
    throw new ApiRouteError(403, "origin_not_allowed", "This browser origin is not allowed.");
  }
}

export async function requireExternalContext(request: Request) {
  requireExternalToolsEnabled();
  checkExternalOrigin(request);
  const token = readBearerToken(request);
  if (!token) throw new ApiRouteError(401, "authentication_required", "Connect your Goalmaxxing account with OAuth.");
  const { supabase } = await createRouteClient(request);
  const { data, error } = await supabase.auth.getClaims(token);
  const { supabaseUrl } = getSupabaseConfig();
  const claimsSchema = z.object({
    sub: z.uuid(), role: z.literal("authenticated"),
    iss: z.literal(`${supabaseUrl}/auth/v1`),
    aud: z.union([z.literal("authenticated"), z.array(z.string()).refine(v => v.includes("authenticated"))]),
    exp: z.number().refine(v => v > Date.now() / 1000),
    iat: z.number(),
    client_id: oauthClientIdSchema.optional(),
  });
  const parsed = claimsSchema.safeParse(data?.claims);
  if (error || !parsed.success) throw new ApiRouteError(401, "invalid_token", "The access token is invalid or expired. Reconnect your account.");
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || userData.user?.id !== parsed.data.sub) throw new ApiRouteError(401, "invalid_token", "Sign in again to connect your account.");
  if (parsed.data.client_id) {
    const connection = await supabase.from("external_app_connections").select("revoked_at,connected_at")
      .eq("owner_id", parsed.data.sub).eq("client_id", parsed.data.client_id).maybeSingle();
    if (connection.error) throw new ApiRouteError(503, "connection_lookup_failed", "Account access could not be checked.", undefined, connection.error);
    if (!connection.data || connection.data.revoked_at || parsed.data.iat < Math.floor(Date.parse(connection.data.connected_at) / 1000)) throw new ApiRouteError(401, "connection_revoked", "Reconnect Goalmaxxing to authorize this app.");
  }
  const rate = checkRateLimit({ key: `external:${parsed.data.sub}`, limit: 120, windowMs: 60_000 });
  if (!rate.allowed) throw new ApiRouteError(429, "rate_limited", "Too many account requests. Try again shortly.", { retryAfterSeconds: Math.ceil(rate.retryAfterMs / 1000) });
  return { supabase, userId: parsed.data.sub, clientId: parsed.data.client_id ?? null, token };
}
export type ExternalContext = Awaited<ReturnType<typeof requireExternalContext>>;

export function externalAuthErrorResponse(error: ApiRouteError, correlationId = createCorrelationId(), path: "/api/mcp" | "/api/v1" = "/api/mcp") {
  const response = handleApiRouteError(error, correlationId);
  if (error.status === 401) {
    const metadata = new URL(`/.well-known/oauth-protected-resource${path}`, externalResourceUrl()).href;
    response.headers.set("WWW-Authenticate", `Bearer resource_metadata="${metadata}", error="invalid_token"`);
  }
  if (error.status === 429) response.headers.set("Retry-After", String(error.details?.retryAfterSeconds ?? 60));
  return response;
}
