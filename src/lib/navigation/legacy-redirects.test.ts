import { describe, expect, it, vi } from "vitest";
import type { NextConfig } from "next";
import nextConfig from "../../../next.config";

vi.mock("@sentry/nextjs", () => ({ withSentryConfig: (config: NextConfig) => config }));

describe("legacy application redirects", () => {
  it.each(["", "/demo"])("redirects before rendering the %s application shell", async (prefix) => {
    const redirects = await nextConfig.redirects?.();
    for (const [from, to] of [
      ["/achievements", "/growth"],
      ["/insights", "/growth"],
      ["/insights/more", "/growth#stats"],
      ["/goals/library", "/goals#goal-library"],
    ]) {
      expect(redirects).toContainEqual({ source: `${prefix}${from}`, destination: `${prefix}${to}`, permanent: true });
    }
    const folios = redirects?.filter((rule) => rule.source === `${prefix}/insights/folios`);
    expect(folios?.[0]).toMatchObject({ has: [{ type: "query", key: "view", value: "past" }], destination: `${prefix}/goals#past-goals` });
    expect(folios?.[1]).toMatchObject({ destination: `${prefix}/goals` });
  });
});
