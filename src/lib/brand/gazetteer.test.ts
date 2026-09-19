import { describe, expect, it } from "vitest";
import { GAZETTEER } from "@cadence/shared/brand/gazetteer";
import { normalizeCategoryDisplayColor } from "@cadence/shared/brand";

describe("gazetteer display colors", () => {
  it("maps leftover Tailwind preset hexes onto the paper palette", () => {
    expect(normalizeCategoryDisplayColor("#10b981")).toBe(GAZETTEER.gain);
    expect(normalizeCategoryDisplayColor("#2563eb")).toBe(GAZETTEER.stamp);
    expect(normalizeCategoryDisplayColor("#6366f1")).toBe(GAZETTEER.mutedDeep);
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
    expect(GAZETTEER.recover).not.toBe(GAZETTEER.stampLight);
    expect(GAZETTEER.recover).not.toBe(GAZETTEER.colRust);
  });

  it("keeps unknown hexes so custom goal colors still win", () => {
    expect(normalizeCategoryDisplayColor("#112233")).toBe("#112233");
    expect(normalizeCategoryDisplayColor("0A0B0C")).toBe("#0A0B0C");
  });
});
