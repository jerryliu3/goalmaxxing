import { isFeatureEnabled } from "@/lib/feature-flags";
import {
  requireAuthenticatedRequestContext,
  withRoute,
  apiSuccessResponse,
} from "@/lib/api/route";
import { acknowledgeCurrentDigest, digestDisabledError } from "@/lib/digest/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return withRoute(async ({ correlationId }) => {
    if (!isFeatureEnabled("digestEnabled")) {
      throw digestDisabledError();
    }
    const { supabase, userId } = await requireAuthenticatedRequestContext(request, {
      unauthorizedMessage: "Sign in to dismiss your digest.",
    });
    const digest = await acknowledgeCurrentDigest({ supabase, userId });
    return apiSuccessResponse({ schemaVersion: "1", ...digest }, correlationId);
  });
}
