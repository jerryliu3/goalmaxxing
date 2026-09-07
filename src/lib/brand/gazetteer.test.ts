import { describe, expect, it } from "vitest";
import {
  GAZETTEER,
  GAZETTEER_CATEGORY_COLORS,
  toGazetteerDisplayColor,
} from "@/lib/brand/gazetteer";

describe("gazetteer display colors", () => {
  it("maps leftover Tailwind preset hexes onto the paper palette", () => {
    expect(toGazetteerDisplayColor("#10b981")).toBe(GAZETTEER_CATEGORY_COLORS.health);
    expect(toGazetteerDisplayColor("#2563eb")).toBe(GAZETTEER.stamp);
    expect(toGazetteerDisplayColor("#6366f1")).toBe(GAZETTEER_CATEGORY_COLORS.personal);
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
    expect(toGazetteerDisplayColor("#112233")).toBe("#112233");
    expect(toGazetteerDisplayColor("0A0B0C")).toBe("#0A0B0C");
  });
});
