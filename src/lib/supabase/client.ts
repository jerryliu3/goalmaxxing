"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getDemoSupabaseClient } from "@/features/demo/demo-supabase-client";
import { hasDemoStore } from "@/features/demo/demo-store";
import { installDemoRuntime } from "@/features/demo/demo-runtime";
import { isBrowserDemoPath } from "@/lib/navigation/demo-path";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

export function createClient() {
  if (isBrowserDemoPath()) {
    if (!hasDemoStore()) {
      installDemoRuntime();
    }
    return getDemoSupabaseClient() as unknown as ReturnType<
      typeof createBrowserClient<Database>
    >;
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
