import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";

vi.mock("expo-router", () => ({
  useLocalSearchParams: () => ({}),
}));

vi.mock("react-native", async () => {
  const ReactModule = await import("react");
  return {
    Pressable: (props: Record<string, unknown>) =>
      ReactModule.createElement("Pressable", props),
    StyleSheet: { create: <T,>(styles: T) => styles },
    Text: (props: Record<string, unknown>) =>
      ReactModule.createElement("Text", props),
    View: (props: Record<string, unknown>) =>
      ReactModule.createElement("View", props),
  };
});

vi.mock("../calendar/CalendarScreen", async () => {
  const ReactModule = await import("react");
  return {
    CalendarScreen: ({ plannerNavigation }: { plannerNavigation: React.ReactNode }) =>
      ReactModule.createElement(
        "CalendarSurface",
        null,
        plannerNavigation
      ),
  };
});

vi.mock("../checklist/ChecklistScreen", async () => {
  const ReactModule = await import("react");
  return {
    ChecklistScreen: ({ plannerNavigation }: { plannerNavigation: React.ReactNode }) =>
      ReactModule.createElement(
        "ChecklistSurface",
        null,
        plannerNavigation
      ),
  };
});

vi.mock("../../theme", () => ({
  useTheme: () => ({
    colors: {
      primary: "#9a4f2c",
      border: "#d4c4a4",
      card: "#f8f1e3",
      background: "#f3ead8",
      foreground: "#241c14",
      mutedForeground: "#7a6a56",
    },
    fonts: { sans: "System", display: "Georgia" },
  }),
}));

import { PlannerScreen } from "./PlannerScreen";

describe("PlannerScreen", () => {
  it("defaults to Day and switches to Month", () => {
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = create(<PlannerScreen />);
    });

    expect(
      renderer.root.findAll(
        (node) => (node.type as unknown) === "ChecklistSurface"
      )
    ).toHaveLength(1);
    const monthTab = renderer.root
      .findAll((node) => (node.type as unknown) === "Pressable")
      .find((node) => node.props.accessibilityLabel === "Month");

    act(() => monthTab?.props.onPress());

    expect(
      renderer.root.findAll(
        (node) => (node.type as unknown) === "CalendarSurface"
      )
    ).toHaveLength(1);
    act(() => renderer.unmount());
  });
});
