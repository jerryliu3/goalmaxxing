import { describe, expect, it } from "vitest";
import { toggleExclusiveSelection } from "./toggle-exclusive-selection";

describe("toggleExclusiveSelection", () => {
  it("selects a value when nothing is selected", () => {
    expect(toggleExclusiveSelection([], "weekly")).toEqual(["weekly"]);
  });

  it("replaces another selected value instead of adding", () => {
    expect(toggleExclusiveSelection(["daily"], "weekly")).toEqual(["weekly"]);
  });

  it("clears the selection when the active value is toggled again", () => {
    expect(toggleExclusiveSelection(["weekly"], "weekly")).toEqual([]);
  });

  it("collapses a multi-value selection down to the clicked value", () => {
    expect(toggleExclusiveSelection(["daily", "weekly"], "weekly")).toEqual([
      "weekly",
    ]);
  });
});
