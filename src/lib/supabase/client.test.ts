import { afterEach, describe, expect, it, vi } from "vitest";

const createBrowserClient = vi.fn(() => ({ kind: "real" as const }));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: () => createBrowserClient(),
}));

vi.mock("@/lib/supabase/config", () => ({
  getSupabaseConfig: () => ({
    supabaseUrl: "http://127.0.0.1:54321",
    supabaseAnonKey: "test-anon-key",
  }),
}));

import { createClient } from "@/lib/supabase/client";
import { resetDemoRuntimeForTests } from "@/features/demo/demo-runtime";

describe("createClient demo gate", () => {
  afterEach(() => {
    resetDemoRuntimeForTests();
    createBrowserClient.mockClear();
    window.history.replaceState({}, "", "/");
  });

  it("returns the real browser client off the demo path", () => {
    window.history.replaceState({}, "", "/calendar");
    const client = createClient();
    expect(client).toEqual({ kind: "real" });
    expect(createBrowserClient).toHaveBeenCalledTimes(1);
  });

  it("returns the demo client on /demo paths", async () => {
    window.history.replaceState({}, "", "/demo/calendar");
    const client = createClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    expect(createBrowserClient).not.toHaveBeenCalled();
    expect(user?.id).toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  });
});
