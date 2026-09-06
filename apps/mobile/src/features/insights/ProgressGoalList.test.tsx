import React from "react";
import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { ProgressGoalList } from "./ProgressGoalList";

vi.mock("react-native", () => ({
  Pressable: (props: Record<string, unknown>) =>
    React.createElement("pressable", props),
  Text: ({ children }: { children: React.ReactNode }) =>
    React.createElement("text", null, children),
  View: (props: Record<string, unknown>) =>
    React.createElement("view", props),
  StyleSheet: { create: <T,>(styles: T) => styles, hairlineWidth: 1 },
}));

vi.mock("../../theme", () => ({
  useTheme: () => ({
    colors: {
      border: "#000",
      foreground: "#fff",
      mutedForeground: "#ccc",
    },
    fonts: {
      display: "serif",
      sans: "sans-serif",
      mono: "monospace",
    },
  }),
}));

describe("ProgressGoalList", () => {
  it("toggles selected goals and marks the pressed state", () => {
    const onToggleGoal = vi.fn();
    let root!: ReactTestRenderer;
    act(() => {
      root = create(
        <ProgressGoalList
          goals={[
            { id: "run", title: "Tempo run", color: "#4a6740", rateLabel: "8 of 12" },
            { id: "lift", title: "Lift", color: "#9a4f2c", rateLabel: "2 completions" },
          ]}
          selectedGoalIds={new Set(["run", "lift"])}
          onToggleGoal={onToggleGoal}
        />
      );
    });

    const buttons = root.root.findAll(
      (node: ReactTestInstance) => String(node.type) === "pressable"
    );
    expect(buttons).toHaveLength(2);
    expect(buttons[0]?.props.accessibilityLabel).toBe("Tempo run");
    expect(buttons[0]?.props.accessibilityState).toEqual({
      selected: true,
      disabled: false,
    });

    act(() => {
      buttons[1]?.props.onPress();
    });
    expect(onToggleGoal).toHaveBeenCalledWith("lift");
  });

  it("renders no mutation controls when read-only", () => {
    let root!: ReactTestRenderer;
    act(() => {
      root = create(
        <ProgressGoalList
          goals={[
            { id: "run", title: "Tempo run", color: "#4a6740", rateLabel: "8 of 12" },
          ]}
          selectedGoalIds={new Set(["run"])}
          readOnly
          onToggleGoal={() => undefined}
        />
      );
    });

    const button = root.root.find(
      (node: ReactTestInstance) => String(node.type) === "pressable"
    );
    expect(button.props.disabled).toBe(true);
    expect(button.props.accessibilityState).toEqual({
      selected: true,
      disabled: true,
    });
  });
});
