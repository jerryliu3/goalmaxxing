import {
  ApiRouteError,
  apiErrorResponse,
  createCorrelationId,
} from "@/lib/api/route";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSocialRouteContext } from "@/lib/social/api";

export const runtime = "nodejs";

const paramsSchema = z.object({
  challengeId: z.uuid(),
});

function mapStandingsRpcError(message: string) {
  if (message.includes("authentication_required")) {
    return new ApiRouteError(401, "authentication_required", "You must be signed in.");
  }
  if (message.includes("challenge_not_found")) {
    return new ApiRouteError(404, "challenge_not_found", "Challenge was not found.");
  }
  if (message.includes("challenge_join_required")) {
    return new ApiRouteError(
      403,
      "challenge_join_required",
      "Join this challenge to see its standings."
    );
  }
  if (
    message.includes("cohort_membership_required") ||
    message.includes("group_membership_required")
  ) {
    return new ApiRouteError(
      403,
      "group_membership_required",
      "Group membership is required."
    );
  }
  return new ApiRouteError(
    500,
    "challenge_standings_unavailable",
    "Challenge standings are unavailable.",
    { cause: message }
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ challengeId: string }> | { challengeId: string } }
) {
  const correlationId = createCorrelationId();
  try {
    const params = paramsSchema.parse(await context.params);
    const url = new URL(request.url);
    const limit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
    const offset = Number.parseInt(url.searchParams.get("offset") ?? "0", 10);
    const socialContext = await requireSocialRouteContext(request);

    const { data, error } = await socialContext.supabase.rpc(
      "get_challenge_standings",
      {
        p_challenge_id: params.challengeId,
        p_limit: Number.isFinite(limit) ? limit : 50,
        p_offset: Number.isFinite(offset) ? offset : 0,
      }
    );
    if (error) {
      throw mapStandingsRpcError(error.message);
    }

    const rows = data ?? [];
    return NextResponse.json(
      {
        schemaVersion: "1",
        correlationId,
        standings: rows.map((row) => ({
          challengeId: row.challenge_id,
          subjectKind: row.subject_kind,
          subjectId: row.subject_id,
          displayName: row.display_name,
          avatarUrl: row.avatar_url,
          score: Number(row.score),
          rank: row.rank,
          isViewer: row.is_viewer,
        })),
        totalCount: rows[0]?.total_count ?? 0,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return apiErrorResponse(error, correlationId);
    }
    if (error instanceof z.ZodError) {
      return apiErrorResponse(
        new ApiRouteError(400, "invalid_challenge_id", "Challenge id is invalid.", {
          issues: error.issues,
        }),
        correlationId
      );
    }
    return apiErrorResponse(
      new ApiRouteError(
        500,
        "internal_error",
        "Challenge standings request failed unexpectedly."
      ),
      correlationId
    );
  }
}
