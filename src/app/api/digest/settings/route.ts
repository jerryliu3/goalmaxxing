import { z } from "zod";
import { isFeatureEnabled } from "@/lib/feature-flags";
import {
  parseJsonBody,
  requireAuthenticatedRequestContext,
  withRoute,
  apiSuccessResponse,
} from "@/lib/api/route";
import { digestDisabledError, setDigestAutoShow } from "@/lib/digest/service";

export const runtime = "nodejs";

const bodySchema = z
  .object({
    digestAutoShow: z.boolean(),
  })
  .strict();

export async function POST(request: Request) {
  return withRoute(async ({ correlationId }) => {
    if (!isFeatureEnabled("digestEnabled")) {
      throw digestDisabledError();
    }
    const { supabase, userId } = await requireAuthenticatedRequestContext(request, {
      unauthorizedMessage: "Sign in to update digest settings.",
    });
    const body = await parseJsonBody({ request, schema: bodySchema });
    const settings = await setDigestAutoShow({
      supabase,
      userId,
      digestAutoShow: body.digestAutoShow,
    });
    return apiSuccessResponse({ schemaVersion: "1", ...settings }, correlationId);
  });
}
