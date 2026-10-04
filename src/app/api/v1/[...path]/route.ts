import { handleExternalHttp } from "@/lib/external-tools/http";
export const runtime = "nodejs";
export const maxDuration = 60;
type Context = { params: Promise<{ path: string[] }> };
async function handle(request: Request, context: Context) {
  return handleExternalHttp(request, `/${(await context.params).path.join("/")}`);
}
export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
