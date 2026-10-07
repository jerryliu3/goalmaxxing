import { describe, expect, it } from "vitest";
import { COLOR_LIBRARY, GOAL_CATEGORY_COLORS } from "@cadence/shared/brand";
import { GAZETTEER } from "@cadence/shared/brand/gazetteer";
import {
  getDisplayCategorySwatchColor,
  getGoalVisual,
  getWorkPillDraftFillStyle,
  getWorkPillFillStyle,
  getWorkRowEdgeStyle,
  normalizeGoalColor,
} from "./goal-visuals";

describe("goal visuals", () => {
  it("keeps icon/color deterministic per goal id", () => {
    const first = getGoalVisual({
      goalId: "12000000-0000-4000-8000-000000000001",
      color: null,
      category: null,
    });
    const second = getGoalVisual({
      goalId: "12000000-0000-4000-8000-000000000001",
      color: null,
      category: null,
    });
    expect(first.Icon).toBe(second.Icon);
    expect(first.color).toBe(second.color);
  });

  it("normalizes and prefers valid configured colors", () => {
    expect(normalizeGoalColor("ff00aa")).toBe("#ff00aa");
    expect(
      getGoalVisual({
        goalId: "12000000-0000-4000-8000-000000000002",
        color: "0A0B0C",
        category: null,
      }).color
    ).toBe("#0A0B0C");
  });

  it("uses category swatch colors for planner icon chips", () => {
    expect(
      getGoalVisual({
        goalId: "12000000-0000-4000-8000-000000000003",
        color: "0A0B0C",
        category: "Health",
      }).color
    ).toBe(GOAL_CATEGORY_COLORS.health);
  });

  it("carries a category goal's pigment on the pill's left edge", () => {
    expect(getWorkPillFillStyle(GOAL_CATEGORY_COLORS.career)).toMatchObject({
      borderLeftColor: COLOR_LIBRARY["klein-blue"].pigment,
    });
  });

  it("paints every work pill on the theme's neutral surface and ink", () => {
    expect(getWorkPillFillStyle("#10b981")).toEqual({
      backgroundColor: "var(--muted)",
      borderColor: "transparent",
      borderLeftColor: "#10b981",
      borderLeftWidth: 3,
      color: "var(--foreground)",
    });
    expect(getWorkPillFillStyle("#10b981", true).color).toBe("var(--muted-foreground)");
    expect(getWorkPillFillStyle("#10b981", false, "gazetteer").backgroundColor).toBe(
      "var(--muted)"
    );
  });

  it("gives Day view rows the pills' goal-colour edge on their flat surface", () => {
    expect(getWorkRowEdgeStyle("#10b981")).toEqual({
      borderLeftStyle: "solid",
      borderLeftWidth: 3,
      borderLeftColor: "#10b981",
      paddingLeft: 8,
    });
  });

  it("mixes draft placements into the page so they read on any theme", () => {
    const moved = getWorkPillDraftFillStyle("#10b981", "moved_to");
    const created = getWorkPillDraftFillStyle("#10b981", "new");
    expect(moved.backgroundColor).toBe("color-mix(in srgb, #10b981 30%, var(--background))");
    expect(created.backgroundColor).toBe("color-mix(in srgb, #10b981 42%, var(--background))");
    expect(moved.borderColor).toBe("#10b981");
    expect(created.color).toBe("var(--foreground)");
  });

  it("keeps leftover blue goal hexes on original", () => {
    expect(
      getGoalVisual({
        goalId: "12000000-0000-4000-8000-000000000005",
        color: "#2563eb",
        category: null,
      }).color
    ).toBe("#2563eb");
  });

  it("maps leftover blue goal hexes onto stamp rust in Gazetteer", () => {
    expect(
      getGoalVisual(
        {
          goalId: "12000000-0000-4000-8000-000000000005",
          color: "#2563eb",
          category: null,
        },
        "gazetteer"
      ).color
    ).toBe("#9a4f2c");
    expect(
      getGoalVisual(
        {
          goalId: "12000000-0000-4000-8000-000000000003",
          color: "0A0B0C",
          category: "Health",
        },
        "gazetteer"
      ).color
    ).toBe(GOAL_CATEGORY_COLORS.health);
  });

  it("keeps goal-level color for custom categories", () => {
    expect(
      getGoalVisual({
        goalId: "12000000-0000-4000-8000-000000000004",
        color: "#112233",
        category: "Outdoor Adventure",
      }).color
    ).toBe("#112233");
  });

  it("keeps the shared category palette in every theme and re-inks custom hexes", () => {
    expect(getDisplayCategorySwatchColor("health")).toBe(GOAL_CATEGORY_COLORS.health);
    expect(getDisplayCategorySwatchColor("health", "gazetteer")).toBe(GOAL_CATEGORY_COLORS.health);
    expect(getDisplayCategorySwatchColor("custom", "gazetteer")).toBe(GAZETTEER.muted);
    expect(
      getGoalVisual(
        {
          goalId: "12000000-0000-4000-8000-000000000006",
          color: "#112233",
          category: "Outdoor Adventure",
        },
        "gazetteer"
      ).color
    ).toBe("#112233");
  });
});
