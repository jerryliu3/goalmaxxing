import { describe, expect, it } from "vitest";
import { GOAL_CATEGORY_COLORS } from "./categories";
import {
  GAZETTEER,
  GAZETTEER_HEATMAP_SCALE,
  gazetteerFillForGoal,
  getGazetteerHeatmapScaleHex,
  toGazetteerDisplayColor,
} from "./gazetteer";

describe("gazetteer display colors", () => {
  it("maps leftover Tailwind preset hexes onto the paper palette", () => {
    expect(toGazetteerDisplayColor("#10b981")).toBe(GAZETTEER.gain);
    expect(toGazetteerDisplayColor("#2563eb")).toBe(GAZETTEER.stamp);
    expect(toGazetteerDisplayColor("#6366f1")).toBe(GAZETTEER.mutedDeep);
  });

  it("keeps unknown hexes so custom goal colors still win", () => {
    expect(toGazetteerDisplayColor("#112233")).toBe("#112233");
    expect(toGazetteerDisplayColor("0A0B0C")).toBe("#0A0B0C");
  });

  it("prefers stored color over category when both exist", () => {
    expect(gazetteerFillForGoal("#10b981", "career")).toBe(GAZETTEER.gain);
    // Without a stored color, a goal takes its category's shared palette color.
    expect(gazetteerFillForGoal(null, "Personal")).toBe(GOAL_CATEGORY_COLORS.personal);
  });

  it("keeps sage as the chrome secondary distinct from gain green", () => {
    expect(GAZETTEER.sage).toBe("#6f8175");
    expect(GAZETTEER.gain).toBe("#4a6740");
    expect(GAZETTEER.sage).not.toBe(GAZETTEER.gain);
  });

  it("keeps rust identity colors distinct from sage chrome", () => {
    expect(GAZETTEER.stampLight).toBe("#c88968");
    expect(GAZETTEER.stamp).toBe("#9a4f2c");
    expect(GAZETTEER.stampLight).not.toBe(GAZETTEER.stamp);
    expect(GAZETTEER.sage).toBe("#6f8175");
  });

  it("keeps warning yellow off the rust identity", () => {
    expect(GAZETTEER.recover).toBe("#eab308");
    expect(GAZETTEER.recover).not.toBe(GAZETTEER.stamp);
  });

  it("keeps the heatmap scale on stamp rust", () => {
    expect(GAZETTEER_HEATMAP_SCALE[3]).toBe(GAZETTEER.stamp);
    expect(getGazetteerHeatmapScaleHex(3)).toBe(GAZETTEER.stamp);
  });
});
