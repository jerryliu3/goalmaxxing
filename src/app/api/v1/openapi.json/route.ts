import { NextResponse } from "next/server";
import { withRoute } from "@/lib/api/route";
import { requireExternalToolsEnabled } from "@/lib/external-tools/auth";
import { buildExternalOpenApi } from "@/lib/external-tools/openapi";
export const runtime = "nodejs";
export async function GET() {
  return withRoute(async () => {
    requireExternalToolsEnabled();
    return NextResponse.json(buildExternalOpenApi(), { headers: { "Cache-Control": "no-store" } });
  });
}
