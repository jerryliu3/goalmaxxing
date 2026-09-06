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

  it("keeps unknown hexes so custom goal colors still win", () => {
    expect(toGazetteerDisplayColor("#112233")).toBe("#112233");
    expect(toGazetteerDisplayColor("0A0B0C")).toBe("#0A0B0C");
  });
});
