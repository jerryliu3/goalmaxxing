import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv, getSupabaseSecretKey, looksLikeSupabaseSecretKey } from "@/lib/env";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

export function createAdminClient(): SupabaseClient<Database> {
  const env = getServerEnv();
  const secretKey = getSupabaseSecretKey(env);

  if (!secretKey) {
    throw new Error(
      "SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is required for server-side Supabase admin operations."
    );
  }

  if (!looksLikeSupabaseSecretKey(secretKey)) {
    throw new Error(
      "SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY must be a service-role JWT or sb_secret_ key."
    );
  }

  const { supabaseUrl } = getSupabaseConfig();

  return createClient<Database>(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
