import { describe, expect, it } from "vitest";
import {
  isLedgerHeatmapDayMutable,
  progressLedgerCaption,
  resolveProgressLedgerMode,
  resolveSelectedLedgerGoalIds,
  toggleLedgerGoalSelection,
} from "./progress-ledger-selection";

describe("mobile progress ledger selection", () => {
  it("treats null selection as every visible goal", () => {
    expect(resolveSelectedLedgerGoalIds(["a", "b"], null)).toEqual(["a", "b"]);
    expect(resolveSelectedLedgerGoalIds(["a", "b"], ["b", "gone"])).toEqual(["b"]);
  });

  it("returns null when the last toggle restores the full set", () => {
    expect(toggleLedgerGoalSelection(["a", "b"], ["a"], "b")).toBeNull();
    expect(toggleLedgerGoalSelection(["a", "b"], null, "a")).toEqual(["b"]);
  });

  it("names aggregate, edit, overlap, and empty modes", () => {
    expect(resolveProgressLedgerMode({ selectedCount: 0, visibleCount: 2 })).toBe(
      "empty"
    );
    expect(resolveProgressLedgerMode({ selectedCount: 1, visibleCount: 3 })).toBe(
      "edit"
    );
    expect(resolveProgressLedgerMode({ selectedCount: 3, visibleCount: 3 })).toBe(
      "aggregate"
    );
    expect(resolveProgressLedgerMode({ selectedCount: 2, visibleCount: 3 })).toBe(
      "overlap"
    );
    expect(progressLedgerCaption("edit", 1)).toContain("Tap a past");
    expect(isLedgerHeatmapDayMutable("2026-09-06", "2026-09-06")).toBe(true);
    expect(isLedgerHeatmapDayMutable("2026-09-07", "2026-09-06")).toBe(false);
  });
});
