import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";

vi.mock("expo-router", () => ({
  useLocalSearchParams: () => ({}),
}));

vi.mock("../calendar/CalendarScreen", async () => {
  const ReactModule = await import("react");
  return {
    CalendarScreen: () =>
      ReactModule.createElement("CalendarSurface", { testID: "calendar-surface" }),
  };
});

vi.mock("../checklist/ChecklistScreen", async () => {
  const ReactModule = await import("react");
  return {
    ChecklistScreen: () =>
      ReactModule.createElement("ChecklistSurface", { testID: "checklist-surface" }),
  };
});

import { PlannerScreen } from "./PlannerScreen";

describe("PlannerScreen", () => {
  it("renders Plan as the calendar Day surface without Calendar/Checklist chips", () => {
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = create(<PlannerScreen />);
    });

    expect(
      renderer.root.findAll(
        (node) => (node.type as unknown) === "CalendarSurface"
      )
    ).toHaveLength(1);
    expect(
      renderer.root.findAll(
        (node) => (node.type as unknown) === "ChecklistSurface"
      )
    ).toHaveLength(0);
    act(() => renderer.unmount());
  });
});
