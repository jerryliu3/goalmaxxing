import { describe, expect, it } from "vitest";
import { APP_TABS, buildAppTabs, isAppTabActive } from "./tabs";

describe("app navigation tabs", () => {
  it("orders destinations as Plan, Progress, Community, Profile", () => {
    expect(APP_TABS).toEqual([
      { key: "calendar", href: "/calendar", label: "Plan" },
      { key: "insights", href: "/insights", label: "Progress" },
      { key: "social", href: "/social", label: "Community" },
      { key: "settings", href: "/settings", label: "Profile" },
    ]);
  });

  it("keeps top-level tabs stable", () => {
    expect(buildAppTabs()).toEqual([
      { key: "calendar", href: "/calendar", label: "Plan" },
      { key: "insights", href: "/insights", label: "Progress" },
      { key: "social", href: "/social", label: "Community" },
      { key: "settings", href: "/settings", label: "Profile" },
    ]);
  });

  it("prefixes tab hrefs when a demo base path is provided", () => {
    expect(buildAppTabs({ hrefPrefix: "/demo" })).toEqual([
      { key: "calendar", href: "/demo/calendar", label: "Plan" },
      { key: "insights", href: "/demo/insights", label: "Progress" },
      { key: "social", href: "/demo/social", label: "Community" },
      { key: "settings", href: "/demo/settings", label: "Profile" },
    ]);
  });

  it("treats prefixed planner routes as active under nested paths", () => {
    expect(isAppTabActive("/demo/calendar", "/demo/calendar")).toBe(true);
    expect(isAppTabActive("/demo/calendar", "/calendar")).toBe(false);
    expect(isAppTabActive("/demo/insights/more", "/demo/insights")).toBe(true);
    expect(isAppTabActive("/demo/settings", "/demo/calendar")).toBe(false);
    expect(isAppTabActive("/social", "/social")).toBe(true);
    expect(isAppTabActive("/settings/foo", "/settings")).toBe(true);
  });
});
