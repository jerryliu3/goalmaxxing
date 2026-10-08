import { ApiRouteError, apiSuccessResponse, parseJsonBody, requireAuthenticatedRequestContext, withRoute } from "@/lib/api/route";
import { emptyOnboardingProgress, onboardingActionSchema, onboardingProgressSchema } from "@/lib/onboarding/progress";

export async function GET(request: Request) {
  return withRoute(async ({ correlationId }) => {
    const { supabase, userId } = await requireAuthenticatedRequestContext(request);
    const [state, profile] = await Promise.all([
      supabase.from("user_onboarding_progress").select("setup_step, tours").eq("user_id", userId).maybeSingle(),
      supabase.from("profiles").select("onboarding_completed_at").eq("id", userId).maybeSingle(),
    ]);
    if (state.error || profile.error) throw new ApiRouteError(500, "onboarding_load_failed", "Getting started could not be loaded.", undefined, state.error ?? profile.error);
    if (!profile.data) throw new ApiRouteError(404, "profile_not_found", "Your account profile could not be found.");
    const completedAt = profile.data.onboarding_completed_at;
    return apiSuccessResponse({ progress: onboardingProgressSchema.parse({ ...emptyOnboardingProgress, ...state.data, completed_at: completedAt, ...(completedAt ? { setup_step: 3 } : {}) }) }, correlationId);
  });
}

export async function POST(request: Request) {
  return withRoute(async ({ correlationId }) => {
    const { supabase } = await requireAuthenticatedRequestContext(request);
    const body = await parseJsonBody({ request, schema: onboardingActionSchema });
    const { data, error } = await supabase.rpc("update_onboarding_progress", {
      p_action: body.action,
      p_step: body.action === "advance" ? body.step : undefined,
      p_guide: body.action === "tour" ? body.key : undefined,
      p_status: body.action === "tour" ? body.status : undefined,
    });
    if (error) {
      if (error.message === "ONBOARDING_SETUP_INCOMPLETE") throw new ApiRouteError(409, "onboarding_setup_incomplete", "Finish the practice steps before completing setup.");
      throw new ApiRouteError(500, "onboarding_save_failed", "Getting started could not be saved. Try again.", undefined, error);
    }
    return apiSuccessResponse({ progress: onboardingProgressSchema.parse(data) }, correlationId);
  });
}
