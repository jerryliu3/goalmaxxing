import { afterEach, describe, expect, it, vi } from "vitest";
import { DEMO_UNSUPPORTED_CODE } from "@/features/demo/demo-ids";
import { handleDemoFetch } from "@/features/demo/demo-fetch";
import { buildDemoSnapshot } from "@/features/demo/demo-snapshot";
import { clearDemoStore, initDemoStore } from "@/features/demo/demo-store";

describe("demo fetch router", () => {
  afterEach(() => {
    clearDemoStore();
  });

  it("serves planner context without calling through to the network", async () => {
    initDemoStore(buildDemoSnapshot("2026-08-22"));
    const originalFetch = vi.fn(() => {
      throw new Error("network should not be used");
    });

    const response = await handleDemoFetch(
      "/api/planner/context?scopeMonth=2026-08",
      { method: "GET" },
      originalFetch as unknown as typeof fetch
    );
    const payload = (await response.json()) as {
      goalTitles: Record<string, string>;
      activePlan: { goals: Array<{ title: string }> };
    };

    expect(originalFetch).not.toHaveBeenCalled();
    expect(response.ok).toBe(true);
    expect(payload.goalTitles).toMatchObject(
      expect.objectContaining({
        [Object.keys(payload.goalTitles)[0] ?? ""]: expect.any(String),
      })
    );
    expect(payload.activePlan.goals.some((goal) => goal.title === "Strength")).toBe(
      true
    );

    const progress = await handleDemoFetch(
      "/api/progress/context?asOfDate=2026-08-22&timezone=America%2FNew_York&viewDate=2026-08-22",
      { method: "GET" },
      originalFetch as unknown as typeof fetch
    );
    expect(progress.ok).toBe(true);
    expect(originalFetch).not.toHaveBeenCalled();
  });

  it("keeps unsupported writes from pretending to succeed", async () => {
    initDemoStore(buildDemoSnapshot("2026-08-22"));
    const originalFetch = vi.fn();
    const response = await handleDemoFetch(
      "/api/completions",
      {
        method: "POST",
        body: JSON.stringify({
          goalId: "10000000-0000-4000-8000-000000000001",
          date: "2026-08-22",
          desiredFactState: "present",
          timezone: "America/New_York",
        }),
      },
      originalFetch as unknown as typeof fetch
    );
    const payload = (await response.json()) as { code: string };

    expect(originalFetch).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
    expect(payload.code).toBe(DEMO_UNSUPPORTED_CODE);
  });

  it("blocks supabase rest URLs without calling through", async () => {
    initDemoStore(buildDemoSnapshot("2026-08-22"));
    const originalFetch = vi.fn();
    const response = await handleDemoFetch(
      "https://example.supabase.co/rest/v1/goals",
      { method: "GET" },
      originalFetch as unknown as typeof fetch
    );

    expect(originalFetch).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });
});
