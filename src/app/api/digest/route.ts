import { isFeatureEnabled } from "@/lib/feature-flags";
import {
  requireAuthenticatedRequestContext,
  withRoute,
  apiSuccessResponse,
} from "@/lib/api/route";
import { digestDisabledError, readCurrentDigest } from "@/lib/digest/service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return withRoute(async ({ correlationId }) => {
    if (!isFeatureEnabled("digestEnabled")) {
      throw digestDisabledError();
    }
    const { supabase, userId } = await requireAuthenticatedRequestContext(request, {
      unauthorizedMessage: "Sign in to view your digest.",
    });
    const digest = await readCurrentDigest({ supabase, userId });
    return apiSuccessResponse({ schemaVersion: "1", ...digest }, correlationId);
  });
}
