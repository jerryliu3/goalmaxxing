import { z } from "zod";
import { isFeatureEnabled } from "@/lib/feature-flags";
import {
  parseJsonBody,
  requireAuthenticatedRequestContext,
  withRoute,
  apiSuccessResponse,
} from "@/lib/api/route";
import { digestDisabledError, generateCurrentDigest } from "@/lib/digest/service";

export const runtime = "nodejs";

const bodySchema = z
  .object({
    regenerate: z.boolean().optional(),
  })
  .strict();

export async function POST(request: Request) {
  return withRoute(async ({ correlationId }) => {
    if (!isFeatureEnabled("digestEnabled")) {
      throw digestDisabledError();
    }
    const { supabase, userId } = await requireAuthenticatedRequestContext(request, {
      unauthorizedMessage: "Sign in to generate your digest.",
    });
    const body = await parseJsonBody({ request, schema: bodySchema });
    const digest = await generateCurrentDigest({
      supabase,
      userId,
      regenerate: body.regenerate === true,
    });
    return apiSuccessResponse({ schemaVersion: "1", ...digest }, correlationId);
  });
}
