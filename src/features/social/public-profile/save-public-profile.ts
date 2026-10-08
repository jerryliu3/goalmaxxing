import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { buildPublicProfileUpdate } from "@/features/social/public-profile/profile-draft";

const SAVE_ERROR_COPY: Record<string, string> = {
  bio_too_long: "Keep your bio to 140 characters.",
  invalid_showcase_pins: "You can pin up to three things.",
  invalid_showcase_pin: "One of your pins is no longer available. Remove it and try again.",
  private_goal_not_featurable: "Private goals can't appear on your profile.",
  goal_not_found: "One of those goals no longer exists.",
};

export async function savePublicProfile(
  supabase: SupabaseClient<Database>,
  update: ReturnType<typeof buildPublicProfileUpdate>
) {
  const { error } = await supabase.rpc("update_public_profile", update);
  if (error) {
    throw new Error(SAVE_ERROR_COPY[error.message] ?? "Your profile could not be saved.");
  }
}
