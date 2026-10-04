import { handleAccountMcp } from "@/lib/external-tools/mcp";
export const runtime = "nodejs";
export const maxDuration = 60;
export const POST = handleAccountMcp;
// Stateless JSON Streamable HTTP has no unsolicited SSE stream or sessions.
// Return 405 for GET/DELETE after the OAuth challenge if needed.
export const GET = handleAccountMcp;
export const DELETE = handleAccountMcp;
