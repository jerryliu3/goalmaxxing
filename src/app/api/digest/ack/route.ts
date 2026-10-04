import { z } from "zod";
import { isFeatureEnabled } from "@/lib/feature-flags";
import {
  parseJsonBody,
  requireAuthenticatedRequestContext,
  withRoute,
  apiSuccessResponse,
} from "@/lib/api/route";
import { acknowledgeDigest, digestDisabledError } from "@/lib/digest/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return withRoute(async ({ correlationId }) => {
    if (!isFeatureEnabled("digestEnabled")) {
      throw digestDisabledError();
    }
    const { userId } = await requireAuthenticatedRequestContext(request, {
      unauthorizedMessage: "Sign in to dismiss your digest.",
    });
    const body = await parseJsonBody({request,schema:z.object({referenceId:z.uuid(),localDate:z.iso.date()}).strict()});
    const digest = await acknowledgeDigest({ userId, ...body });
    return apiSuccessResponse({ schemaVersion: "1", ...digest }, correlationId);
  });
}
