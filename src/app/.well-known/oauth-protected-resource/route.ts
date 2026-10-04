import { NextResponse } from "next/server";
import { withRoute } from "@/lib/api/route";
import { requireExternalToolsEnabled } from "@/lib/external-tools/auth";
import { protectedResourceMetadata } from "@/lib/external-tools/oauth";
export async function GET() {
  return withRoute(async () => {
    requireExternalToolsEnabled();
    return NextResponse.json(protectedResourceMetadata("/api/mcp"), { headers: { "Cache-Control": "no-store" } });
  });
}
