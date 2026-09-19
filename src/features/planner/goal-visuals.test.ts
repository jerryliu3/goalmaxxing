import { describe, expect, it } from "vitest";
import { GAZETTEER } from "@cadence/shared/brand/gazetteer";

import {
  getDisplayCategorySwatchColor,
  getGoalVisual,
  getWorkPillDraftFillStyle,
  getWorkPillFillStyle,
  mixOpaqueHex,
  normalizeGoalColor,
  WORK_PILL_DRAFT_HUE_AMOUNT,
  WORK_PILL_HUE_AMOUNT,
  WORK_PILL_NEW_DRAFT_HUE_AMOUNT,
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
    ).toBe("#10b981");
  });

  it("uses opaque pastel fills with quieter ink and hue for completed tiles", () => {
    const original = getWorkPillFillStyle("#10b981", false);
    const originalPastel = mixOpaqueHex("#10b981", "#ffffff", WORK_PILL_HUE_AMOUNT);
    expect(original.backgroundColor).toBe(originalPastel);
    expect(original.borderColor).toBe(originalPastel);
    expect(original.backgroundColor).not.toBe("#10b981");
    expect(original.color).toBe("#1c1917");
    expect(getWorkPillFillStyle("#10b981", true).backgroundColor).toBe(
      mixOpaqueHex("#10b981", "#ffffff", WORK_PILL_HUE_AMOUNT * 0.45)
    );
    expect(getWorkPillFillStyle("#10b981", true).color).toBe("#57534e");

    const originalBlue = getWorkPillFillStyle("#2563eb", false);
    expect(originalBlue.backgroundColor).toBe(
      mixOpaqueHex("#2563eb", "#ffffff", WORK_PILL_HUE_AMOUNT)
    );
    expect(originalBlue.color).toBe("#1c1917");

    const gazetteerHealth = getWorkPillFillStyle("#10b981", false, "gazetteer");
    const gazetteerPastel = mixOpaqueHex(
      GAZETTEER.gain,
      GAZETTEER.paper,
      WORK_PILL_HUE_AMOUNT
    );
    expect(gazetteerHealth.backgroundColor).toBe(gazetteerPastel);
    expect(gazetteerHealth.borderColor).toBe(gazetteerPastel);
    expect(gazetteerHealth.color).toBe("#1c1917");
  });

  it("darkens the original work color for draft placements", () => {
    const moved = getWorkPillDraftFillStyle("#10b981", "moved_to");
    const created = getWorkPillDraftFillStyle("#10b981", "new");
    const rest = getWorkPillFillStyle("#10b981");
    expect(moved.backgroundColor).toBe(
      mixOpaqueHex("#10b981", "#ffffff", WORK_PILL_DRAFT_HUE_AMOUNT)
    );
    expect(created.backgroundColor).toBe(
      mixOpaqueHex("#10b981", "#ffffff", WORK_PILL_NEW_DRAFT_HUE_AMOUNT)
    );
    expect(moved.backgroundColor).not.toBe(rest.backgroundColor);
    expect(created.backgroundColor).not.toBe(moved.backgroundColor);
  });

  it("mixes two opaque hexes without leaving an alpha channel", () => {
    expect(mixOpaqueHex("#ff0000", "#ffffff", 0.5)).toBe("#ff8080");
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

  it("maps category swatches onto the active theme and keeps custom hexes", () => {
    expect(getDisplayCategorySwatchColor("health")).toBe("#10b981");
    expect(getDisplayCategorySwatchColor("health", "gazetteer")).toBe(GAZETTEER.gain);
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
