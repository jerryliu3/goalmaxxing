import React from "react";
import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import type { MobileGoal } from "../checklist/checklist-lane-data";
import { InsightsLedgerPanel } from "./InsightsLedgerPanel";

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
      border: "#d4c4a4",
      card: "#f8f1e3",
      foreground: "#241c14",
      mutedForeground: "#7a6a56",
      primary: "#9a4f2c",
      primaryForeground: "#f8f1e3",
    },
    fonts: {
      display: "serif",
      sans: "sans-serif",
      sansMedium: "sans-serif-medium",
      mono: "monospace",
    },
  }),
}));

const run: MobileGoal = {
  id: "run",
  owner_id: "u1",
  title: "Tempo run",
  description: null,
  category: "Health",
  frequency_type: "recurring",
  recurrence_interval: "daily",
  target_count: 1,
  start_date: "2026-01-01",
  end_date: null,
  team_id: null,
  photo_path: null,
  archived_at: null,
  is_deleted: false,
  color: null,
};

const lift: MobileGoal = {
  ...run,
  id: "lift",
  title: "Lift",
  category: "Career",
};

const swim: MobileGoal = {
  ...run,
  id: "swim",
  title: "Swim",
  category: "Personal",
};

function renderedText(root: ReactTestRenderer) {
  return root.root
    .findAll((node: ReactTestInstance) => String(node.type) === "text")
    .map((node) => node.props.children)
    .flat()
    .join(" ");
}

describe("InsightsLedgerPanel", () => {
  it("starts on the aggregate heatmap and makes a single goal editable", () => {
    const onToggleCompletion = vi.fn();
    let root!: ReactTestRenderer;
    act(() => {
      root = create(
        <InsightsLedgerPanel
          goals={[run, lift]}
          facts={[
            { goal_id: "run", completed_on: "2026-09-01", source: "manual" },
            { goal_id: "lift", completed_on: "2026-09-01", source: "manual" },
          ]}
          summaries={[]}
          days={["2026-09-01", "2099-01-01"]}
          offset={0}
          readOnly={false}
          onToggleCompletion={onToggleCompletion}
        />
      );
    });

    expect(renderedText(root)).toContain("Aggregate of selected goals");
    expect(
      root.root.findAll(
        (node: ReactTestInstance) => String(node.type) === "pressable"
      ).length
    ).toBeGreaterThanOrEqual(2);

    const liftButton = root.root.find(
      (node: ReactTestInstance) =>
        String(node.type) === "pressable" &&
        node.props.accessibilityLabel === "Lift"
    );
    act(() => {
      liftButton.props.onPress();
    });

    expect(renderedText(root)).toContain("Hold a past or today cell");
    const pastDay = root.root.find(
      (node: ReactTestInstance) =>
        String(node.type) === "pressable" &&
        node.props.testID === "insights-ledger-day-2026-09-01"
    );
    act(() => {
      pastDay.props.onPress();
    });
    expect(onToggleCompletion).toHaveBeenCalledWith({
      goalId: "run",
      date: "2026-09-01",
      desiredFactState: "absent",
    });

    const futureDay = root.root.find(
      (node: ReactTestInstance) =>
        String(node.type) === "view" &&
        node.props.testID === "insights-ledger-day-2099-01-01"
    );
    expect(futureDay.props.onPress).toBeUndefined();
  });

  it("shows overlap mode when a partial multi-goal selection stays active", () => {
    let root!: ReactTestRenderer;
    act(() => {
      root = create(
        <InsightsLedgerPanel
          goals={[run, lift, swim]}
          facts={[]}
          summaries={[]}
          days={["2026-09-01"]}
          offset={0}
          readOnly={false}
          onToggleCompletion={() => undefined}
        />
      );
    });

    const swimButton = root.root.find(
      (node: ReactTestInstance) =>
        String(node.type) === "pressable" &&
        node.props.accessibilityLabel === "Swim"
    );
    act(() => {
      swimButton.props.onPress();
    });
    expect(renderedText(root)).toContain("Read-only overlap of 2 goals");
  });
});
