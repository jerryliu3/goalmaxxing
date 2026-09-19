import { describe, expect, it } from "vitest";
import {
  GAZETTEER,
  CATEGORY_COLORS,
  GAZETTEER_HEATMAP_SCALE,
  categoryColor,
  categoryFillForGoal,
  gazetteerLightTheme,
  getGazetteerHeatmapScaleHex,
  normalizeCategoryDisplayColor,
} from "./gazetteer";

describe("gazetteer display colors", () => {
  it("maps leftover Tailwind preset hexes onto the paper palette", () => {
    expect(normalizeCategoryDisplayColor("#10b981")).toBe(GAZETTEER.gain);
    expect(normalizeCategoryDisplayColor("#2563eb")).toBe(GAZETTEER.stamp);
    expect(normalizeCategoryDisplayColor("#6366f1")).toBe(GAZETTEER.mutedDeep);
  });

  it("keeps unknown hexes so custom goal colors still win", () => {
    expect(normalizeCategoryDisplayColor("#112233")).toBe("#112233");
    expect(normalizeCategoryDisplayColor("0A0B0C")).toBe("#0A0B0C");
  });

  it("resolves category labels onto earth fills", () => {
    expect(categoryColor("Health")).toBe(CATEGORY_COLORS.health);
    expect(categoryColor("career")).toBe(CATEGORY_COLORS.career);
    expect(categoryColor("unknown")).toBe(CATEGORY_COLORS.other);
  });

  it("prefers stored color over category when both exist", () => {
    expect(categoryFillForGoal("#10b981", "career")).toBe(
      CATEGORY_COLORS.career
    );
    expect(categoryFillForGoal(null, "Personal")).toBe(
      CATEGORY_COLORS.personal
    );
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

  it("keeps the light theme on paper, walnut, and stamp rust", () => {
    expect(gazetteerLightTheme.background).toBe(GAZETTEER.page);
    expect(gazetteerLightTheme.card).toBe(GAZETTEER.paper);
    expect(gazetteerLightTheme.foreground).toBe(GAZETTEER.ink);
    expect(gazetteerLightTheme.primary).toBe(GAZETTEER.stamp);
    expect(gazetteerLightTheme.gain).toBe(GAZETTEER.gain);
    expect(GAZETTEER_HEATMAP_SCALE[3]).toBe(GAZETTEER.stamp);
    expect(getGazetteerHeatmapScaleHex(3)).toBe(GAZETTEER.stamp);
  });
});
