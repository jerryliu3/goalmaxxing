import { describe, expect, it } from "vitest";
import { APP_TABS, buildAppTabs, isAppTabActive } from "./tabs";

describe("app navigation tabs", () => {
  it("keeps Planner as a single top-level tab", () => {
    expect(APP_TABS).toEqual([
      { key: "calendar", href: "/calendar", label: "Planner" },
      { key: "social", href: "/social", label: "Community" },
      { key: "insights", href: "/insights", label: "Insights" },
      { key: "settings", href: "/settings", label: "Profile" },
    ]);
  });

  it("keeps top-level tabs stable across planner preference values", () => {
    expect(buildAppTabs("calendar")).toEqual([
      { key: "calendar", href: "/calendar", label: "Planner" },
      { key: "social", href: "/social", label: "Community" },
      { key: "insights", href: "/insights", label: "Insights" },
      { key: "settings", href: "/settings", label: "Profile" },
    ]);
  });

  it("prefixes tab hrefs when a demo base path is provided", () => {
    expect(buildAppTabs("calendar", { hrefPrefix: "/demo" })).toEqual([
      { key: "calendar", href: "/demo/calendar", label: "Planner" },
      { key: "social", href: "/demo/social", label: "Community" },
      { key: "insights", href: "/demo/insights", label: "Insights" },
      { key: "settings", href: "/demo/settings", label: "Profile" },
    ]);
  });

  it("treats prefixed planner routes as active under nested paths", () => {
    expect(isAppTabActive("/demo/calendar", "/demo/calendar")).toBe(true);
    expect(isAppTabActive("/demo/calendar", "/calendar")).toBe(false);
    expect(isAppTabActive("/demo/insights/more", "/demo/insights")).toBe(true);
    expect(isAppTabActive("/demo/settings", "/demo/calendar")).toBe(false);
  });
});
