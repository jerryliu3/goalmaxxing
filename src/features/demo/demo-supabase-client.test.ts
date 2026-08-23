import { afterEach, describe, expect, it } from "vitest";
import { DEMO_ALEX_ID } from "@/features/demo/demo-ids";
import { getDemoSupabaseClient } from "@/features/demo/demo-supabase-client";
import { buildDemoSnapshot } from "@/features/demo/demo-snapshot";
import { clearDemoStore, initDemoStore } from "@/features/demo/demo-store";

describe("demo supabase client", () => {
  afterEach(() => {
    clearDemoStore();
  });

  it("authenticates as Alex and reads goals from the snapshot", async () => {
    initDemoStore(buildDemoSnapshot("2026-08-22"));
    const supabase = getDemoSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    expect(user?.id).toBe(DEMO_ALEX_ID);

    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    expect(error).toBeNull();
    expect((data as Array<{ title: string }>).some((goal) => goal.title === "Strength")).toBe(
      true
    );
  });

  it("rejects profile writes instead of pretending they saved", async () => {
    initDemoStore(buildDemoSnapshot("2026-08-22"));
    const supabase = getDemoSupabaseClient();
    const { error } = await supabase.from("profiles").upsert({
      id: DEMO_ALEX_ID,
      username: "changed",
    });
    expect(error?.code).toBe("demo_unsupported");
  });
});
