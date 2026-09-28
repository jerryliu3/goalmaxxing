import { z } from "zod";
import { coachEntityPatchSchema } from "@cadence/shared/coach";
import { ApiRouteError, parseJsonBody } from "@/lib/api/route";
import { coachDatabaseError, type CoachRequestContext } from "./api";

export async function manageCoachEntity(request: Request, context: CoachRequestContext, kind: "topic" | "thread", id: string) {
  const deleting = request.method === "DELETE";
  const body = await parseJsonBody({ request, schema: deleting
    ? z.object({ version: z.number().int().nonnegative() }).strict()
    : coachEntityPatchSchema });
  const patch = coachEntityPatchSchema.parse(body);
  if (!deleting && kind === "thread" && patch.intention !== undefined) {
    throw new ApiRouteError(400, "validation_failed", "Intentions belong to topics.");
  }
  const result = await context.admin.rpc("manage_coach_entity", {
    p_owner: context.userId, p_kind: kind, p_id: id, p_version: body.version,
    p_patch: deleting ? null : patch,
  });
  coachDatabaseError(result.error);
  return deleting ? { deleted: true } : { updated: true };
}
