import { describe, expect, it } from "vitest";
import { reorderPreviewEntryKeys, sameEntryKeyOrder } from "./reorder-preview-entries";

describe("reorderPreviewEntryKeys", () => {
  it("allows manual ordering across completion states", () => {
    expect(
      reorderPreviewEntryKeys({
        entryKeys: ["open-a", "open-b", "done-a", "done-b"],
        activeEntryKey: "open-b",
        overEntryKey: "open-a",
      })
    ).toEqual(["open-b", "open-a", "done-a", "done-b"]);

    expect(
      reorderPreviewEntryKeys({
        entryKeys: ["open-a", "open-b", "done-a", "done-b"],
        activeEntryKey: "done-b",
        overEntryKey: "open-a",
      })
    ).toEqual(["done-b", "open-a", "open-b", "done-a"]);
  });

  it("preserves an existing order while adding newly visible entries", () => {
    expect(
      reorderPreviewEntryKeys({
        entryKeys: ["open-a", "open-b", "open-c", "done-a", "new"],
        activeEntryKey: "open-b",
        overEntryKey: "open-a",
        existingOrder: ["removed", "open-c", "open-a", "open-b", "done-a"],
      })
    ).toEqual(["open-c", "open-b", "open-a", "done-a", "new"]);
  });

  it("returns null for no-op and missing-target drops", () => {
    expect(
      reorderPreviewEntryKeys({
        entryKeys: ["open-a", "done-a"],
        activeEntryKey: "open-a",
        overEntryKey: "open-a",
      })
    ).toBeNull();
    expect(
      reorderPreviewEntryKeys({
        entryKeys: ["open-a", "done-a"],
        activeEntryKey: "open-a",
        overEntryKey: "missing",
      })
    ).toBeNull();
  });

  it("moves an item to the end of the entire list", () => {
    expect(
      reorderPreviewEntryKeys({
        entryKeys: ["open-a", "open-b", "open-c", "done-a"],
        activeEntryKey: "open-a",
        overEntryKey: "__end__",
      })
    ).toEqual(["open-b", "open-c", "done-a", "open-a"]);
  });
});

describe("sameEntryKeyOrder", () => {
  it("treats matching lists as unchanged and missing lists as different", () => {
    expect(sameEntryKeyOrder(["a", "b"], ["a", "b"])).toBe(true);
    expect(sameEntryKeyOrder(["a", "b"], ["b", "a"])).toBe(false);
    expect(sameEntryKeyOrder(undefined, ["a"])).toBe(false);
  });
});
