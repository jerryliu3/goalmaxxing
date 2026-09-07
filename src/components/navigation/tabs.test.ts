import { describe, expect, it } from "vitest";
import { buildAppTabs } from "@/components/navigation/tabs";

describe("navigation tabs", () => {
  it("keeps planner as a single top-level tab", () => {
    const tabs = buildAppTabs();

    expect(tabs.map((tab) => tab.key)).toEqual([
      "calendar",
      "insights",
      "social",
      "settings",
    ]);
    expect(tabs.map((tab) => tab.label)).toEqual([
      "Plan",
      "Progress",
      "Community",
      "Profile",
    ]);
  });

  it("forwards a demo href prefix onto planner tabs", () => {
    expect(
      buildAppTabs({ hrefPrefix: "/demo" }).map((tab) => tab.href)
    ).toEqual([
      "/demo/calendar",
      "/demo/insights",
      "/demo/social",
      "/demo/settings",
    ]);
  });
});
