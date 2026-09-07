import { describe, expect, it } from "vitest";
import { getGoalVisual, normalizeGoalColor, getWorkPillFillStyle } from "./goal-visuals";

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
    ).toBe("#10b981");
  });

  it("turns category color into pill fill, not a separate chip", () => {
    expect(
      getWorkPillFillStyle("#10b981", false).backgroundColor
    ).toBe("rgba(16, 185, 129, 0.18)");
    expect(getWorkPillFillStyle("#10b981", true).borderColor).toBe("#10b981");
    expect(
      getWorkPillFillStyle("#10b981", true).backgroundColor
    ).toBe("rgba(16, 185, 129, 0.4)");
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
    ).toBe("#4a6740");
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
});
