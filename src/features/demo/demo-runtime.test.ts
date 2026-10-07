import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installDemoRuntime, resetDemoRuntimeForTests } from "@/features/demo/demo-runtime";
import { DEMO_UNSUPPORTED_CODE } from "@/features/demo/demo-ids";

describe("installDemoRuntime", () => {
  beforeEach(() => window.history.replaceState(null, "", "/demo/goals"));
  afterEach(() => {
    resetDemoRuntimeForTests();
    window.history.replaceState(null, "", "/");
  });

  it("patches fetch so /api requests stay in-process", async () => {
    const networkFetch = vi.fn(() => {
      throw new Error("network should not be used");
    });
    window.fetch = networkFetch as unknown as typeof fetch;
    installDemoRuntime("2026-08-22");

    const response = await fetch("/api/config");
    const payload = (await response.json()) as {
      flags: { socialEnabled: boolean; integrationsEnabled: boolean };
    };

    expect(networkFetch).not.toHaveBeenCalled();
    expect(payload.flags.socialEnabled).toBe(true);
    expect(payload.flags.integrationsEnabled).toBe(false);

    const blocked = await fetch("/api/goals", { method: "POST", body: "{}" });
    expect((await blocked.json()).code).toBe(DEMO_UNSUPPORTED_CODE);
  });
  it("returns to real requests after leaving the demo, without replacing account data", async () => {
    const networkFetch = vi.fn(async () => new Response(JSON.stringify({ account: "real" })));
    window.fetch = networkFetch as typeof fetch;
    installDemoRuntime("2026-08-22");
    window.history.replaceState(null, "", "/calendar");
    expect(await (await fetch("/api/config")).json()).toEqual({ account: "real" });
    expect(networkFetch).toHaveBeenCalledOnce();
    window.history.replaceState(null, "", "/demo/growth");
    expect((await (await fetch("/api/config")).json()).flags.socialEnabled).toBe(true);
    expect(networkFetch).toHaveBeenCalledOnce();
  });
});
