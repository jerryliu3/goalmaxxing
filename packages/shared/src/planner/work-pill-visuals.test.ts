import { describe, expect, it } from "vitest";
import { GOAL_CATEGORY_COLORS } from "../brand/categories";
import { COLOR_LIBRARY } from "../brand/colors";
import { GAZETTEER } from "../brand/gazetteer";
import {
  getGazetteerWorkPillDraftFillStyle,
  getGazetteerWorkPillFillStyle,
  mixOpaqueHex,
  WORK_PILL_DRAFT_HUE_AMOUNT,
  WORK_PILL_HUE_AMOUNT,
  WORK_PILL_NEW_DRAFT_HUE_AMOUNT,
} from "./work-pill-visuals";

describe("gazetteer work pill visuals", () => {
  it("mixes two opaque hexes without leaving an alpha channel", () => {
    expect(mixOpaqueHex("#ff0000", "#ffffff", 0.5)).toBe("#ff8080");
  });

  it("uses an opaque pastel fill that stays the same on every month tile", () => {
    const fill = getGazetteerWorkPillFillStyle(GAZETTEER.gain);
    const pastel = mixOpaqueHex(GAZETTEER.gain, GAZETTEER.paper, WORK_PILL_HUE_AMOUNT);
    expect(fill.backgroundColor).toBe(pastel);
    expect(fill.borderColor).toBe(pastel);
    expect(fill.backgroundColor).not.toBe(GAZETTEER.gain);
  });

  it("mixes a category goal's pigment rather than its pastel surface", () => {
    expect(getGazetteerWorkPillFillStyle(GOAL_CATEGORY_COLORS.health).backgroundColor).toBe(
      mixOpaqueHex(COLOR_LIBRARY.vermilion.pigment, GAZETTEER.paper, WORK_PILL_HUE_AMOUNT)
    );
  });

  it("darkens draft placements more than credited fills", () => {
    const credited = getGazetteerWorkPillFillStyle(GAZETTEER.gain);
    const moved = getGazetteerWorkPillDraftFillStyle(GAZETTEER.gain, "moved_to");
    const created = getGazetteerWorkPillDraftFillStyle(GAZETTEER.gain, "new");
    expect(moved.backgroundColor).toBe(
      mixOpaqueHex(GAZETTEER.gain, GAZETTEER.paper, WORK_PILL_DRAFT_HUE_AMOUNT)
    );
    expect(created.backgroundColor).toBe(
      mixOpaqueHex(GAZETTEER.gain, GAZETTEER.paper, WORK_PILL_NEW_DRAFT_HUE_AMOUNT)
    );
    expect(moved.backgroundColor).not.toBe(credited.backgroundColor);
    expect(created.backgroundColor).not.toBe(moved.backgroundColor);
  });
});
