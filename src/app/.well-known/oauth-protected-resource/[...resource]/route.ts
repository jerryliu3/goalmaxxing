import { NextResponse } from "next/server";
import { withRoute } from "@/lib/api/route";
import { requireExternalToolsEnabled } from "@/lib/external-tools/auth";
import { protectedResourceMetadata } from "@/lib/external-tools/oauth";

export async function GET(_request: Request, { params }: { params: Promise<{ resource: string[] }> }) {
  return withRoute(async () => {
    requireExternalToolsEnabled();
    const path = `/${(await params).resource.join("/")}`;
    if (path !== "/api/mcp" && path !== "/api/v1") return new NextResponse(null, { status: 404 });
    return NextResponse.json(protectedResourceMetadata(path), { headers: { "Cache-Control": "no-store" } });
  });
}
