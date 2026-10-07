import { describe, expect, it } from "vitest";
import { buildAppTabs } from "@/components/navigation/tabs";

describe("navigation tabs", () => {
  it("keeps planner as a single top-level tab", () => {
    const tabs = buildAppTabs();

    expect(tabs.map((tab) => tab.key)).toEqual([
      "calendar",
      "goals",
      "growth",
      "social",
    ]);
    expect(tabs.map((tab) => tab.label)).toEqual([
      "Agenda",
      "Goals",
      "Growth",
      "Community",
    ]);
  });

  it("forwards a demo href prefix onto planner tabs", () => {
    expect(
      buildAppTabs({ hrefPrefix: "/demo" }).map((tab) => tab.href)
    ).toEqual([
      "/demo/calendar",
      "/demo/goals",
      "/demo/growth",
      "/demo/social",
    ]);
  });
});
