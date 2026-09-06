import { describe, expect, it } from "vitest";
import { buildAppTabs } from "@/components/navigation/tabs";

describe("navigation tab preferences", () => {
  it("keeps planner as a single top-level tab", () => {
    const calendarFirst = buildAppTabs("calendar");
    const checklistFirst = buildAppTabs("checklist");

    expect(calendarFirst.map((tab) => tab.key)).toEqual([
      "calendar",
      "insights",
      "social",
      "settings",
    ]);
    expect(checklistFirst.map((tab) => tab.key)).toEqual([
      "calendar",
      "insights",
      "social",
      "settings",
    ]);
    expect(calendarFirst.map((tab) => tab.label)).toEqual([
      "Plan",
      "Progress",
      "Community",
      "You",
    ]);
  });

  it("forwards a demo href prefix onto planner tabs", () => {
    expect(
      buildAppTabs("calendar", { hrefPrefix: "/demo" }).map((tab) => tab.href)
    ).toEqual([
      "/demo/calendar",
      "/demo/insights",
      "/demo/social",
      "/demo/settings",
    ]);
  });
});
