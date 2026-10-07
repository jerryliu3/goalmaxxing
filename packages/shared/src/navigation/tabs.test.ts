import { describe, expect, it } from "vitest";
import { APP_TABS, buildAppTabs, isAppTabActive } from "./tabs";

describe("app navigation tabs", () => {
  it("orders destinations as Agenda, Growth, Community", () => {
    expect(APP_TABS).toEqual([
      { key: "calendar", href: "/calendar", label: "Agenda" },
      { key: "growth", href: "/growth", label: "Growth" },
      { key: "social", href: "/social", label: "Community" },
    ]);
  });

  it("keeps top-level tabs stable", () => {
    expect(buildAppTabs()).toEqual([
      { key: "calendar", href: "/calendar", label: "Agenda" },
      { key: "growth", href: "/growth", label: "Growth" },
      { key: "social", href: "/social", label: "Community" },
    ]);
  });

  it("prefixes tab hrefs when a demo base path is provided", () => {
    expect(buildAppTabs({ hrefPrefix: "/demo" })).toEqual([
      { key: "calendar", href: "/demo/calendar", label: "Agenda" },
      { key: "growth", href: "/demo/growth", label: "Growth" },
      { key: "social", href: "/demo/social", label: "Community" },
    ]);
  });

  it("treats prefixed planner routes as active under nested paths", () => {
    expect(isAppTabActive("/demo/calendar", "/demo/calendar")).toBe(true);
    expect(isAppTabActive("/demo/calendar", "/calendar")).toBe(false);
    expect(isAppTabActive("/demo/growth/more", "/demo/growth")).toBe(true);
    expect(isAppTabActive("/demo/settings", "/demo/calendar")).toBe(false);
    expect(isAppTabActive("/social", "/social")).toBe(true);
    expect(isAppTabActive("/settings/foo", "/settings")).toBe(true);
  });
});
