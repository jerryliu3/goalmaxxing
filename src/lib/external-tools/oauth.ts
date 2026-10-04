import { z } from "zod";
import { getPublicEnv } from "@/lib/env";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const oauthClientIdSchema = z.uuid();
export const authorizationIdSchema = z.string().min(1).max(500).regex(/^[a-zA-Z0-9_-]+$/);

export function externalResourceUrl(path: "/api/mcp" | "/api/v1" = "/api/mcp") {
  const appUrl = getPublicEnv().NEXT_PUBLIC_APP_URL;
  if (!appUrl) throw new Error("NEXT_PUBLIC_APP_URL is required for external account tools.");
  const url = new URL(appUrl);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) {
    throw new Error("External account tools require a public HTTPS app origin or local HTTP development origin.");
  }
  return new URL(path, url).href;
}

export function protectedResourceMetadata(path: "/api/mcp" | "/api/v1") {
  const { supabaseUrl } = getSupabaseConfig();
  return {
    resource: externalResourceUrl(path),
    authorization_servers: [`${supabaseUrl}/auth/v1`],
    scopes_supported: ["openid"],
    bearer_methods_supported: ["header"],
    resource_name: "Goalmaxxing account tools",
  };
}

// Used only to DENY legacy routes after getUser has verified the credential.
// Positive authorization always uses verified getClaims in external auth.ts.
export function hasOAuthClientClaim(token: string): boolean {
  try {
    const claims: unknown = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString());
    return typeof claims === "object" && claims !== null && "client_id" in claims;
  } catch { return false; }
}

export function isExternalAccountRoute(url: string) {
  const path = new URL(url).pathname;
  return path === "/api/mcp" || path === "/api/v1" || path.startsWith("/api/v1/");
}
