import { describe, expect, it } from "vitest";
import {
  isLedgerHeatmapDayMutable,
  progressLedgerCaption,
  resolveProgressLedgerMode,
  resolveSelectedLedgerGoalIds,
  toggleLedgerGoalSelection,
} from "./progress-ledger-selection";

describe("progress ledger selection", () => {
  it("treats null selection as every visible goal", () => {
    expect(resolveSelectedLedgerGoalIds(["a", "b"], null)).toEqual(["a", "b"]);
    expect(resolveSelectedLedgerGoalIds(["a", "b"], ["b", "gone"])).toEqual(["b"]);
  });

  it("uses aggregate for all selected, edit for one, overlap for a subset", () => {
    expect(resolveProgressLedgerMode({ selectedCount: 0, visibleCount: 3 })).toBe(
      "empty"
    );
    expect(resolveProgressLedgerMode({ selectedCount: 1, visibleCount: 3 })).toBe(
      "edit"
    );
    expect(resolveProgressLedgerMode({ selectedCount: 2, visibleCount: 3 })).toBe(
      "overlap"
    );
    expect(resolveProgressLedgerMode({ selectedCount: 3, visibleCount: 3 })).toBe(
      "aggregate"
    );
    expect(resolveProgressLedgerMode({ selectedCount: 1, visibleCount: 1 })).toBe(
      "edit"
    );
  });

  it("deselects a selected goal, including from the aggregate and the last remaining item", () => {
    expect(toggleLedgerGoalSelection(["a", "b"], null, "a")).toEqual(["b"]);
    expect(toggleLedgerGoalSelection(["a", "b"], ["a"], "a")).toEqual([]);
    expect(toggleLedgerGoalSelection(["a", "b"], ["a"], "b")).toBeNull();
  });

  it("blocks future heatmap edits and labels each mode", () => {
    expect(isLedgerHeatmapDayMutable("2026-09-05", "2026-09-06")).toBe(true);
    expect(isLedgerHeatmapDayMutable("2026-09-06", "2026-09-06")).toBe(true);
    expect(isLedgerHeatmapDayMutable("2026-09-07", "2026-09-06")).toBe(false);
    expect(progressLedgerCaption("overlap", 2)).toContain("Read-only overlap");
    expect(progressLedgerCaption("edit", 1)).toContain("log or remove a completion");
    expect(progressLedgerCaption("edit", 1, "milestone")).toContain(
      "log or remove a milestone"
    );
    expect(progressLedgerCaption("edit", 1, "completion", false)).toContain(
      "this goal's completions"
    );
  });
});
