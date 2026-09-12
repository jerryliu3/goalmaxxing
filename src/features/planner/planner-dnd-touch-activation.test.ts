import { describe, expect, it } from "vitest";
import { shouldActivatePlannerTouchDrag } from "@/features/planner/planner-dnd-touch-activation";

describe("shouldActivatePlannerTouchDrag", () => {
  it("allows calendar pill drags without ledger constraints", () => {
    expect(
      shouldActivatePlannerTouchDrag({
        isLedgerRow: false,
        dx: 0,
        dy: 24,
        elapsedMs: 0,
      })
    ).toBe(true);
  });

  it("blocks ledger reorder when the gesture is a vertical scroll", () => {
    expect(
      shouldActivatePlannerTouchDrag({
        isLedgerRow: true,
        dx: 2,
        dy: 16,
        elapsedMs: 40,
      })
    ).toBe(false);
  });

  it("allows ledger reorder on a horizontal drag", () => {
    expect(
      shouldActivatePlannerTouchDrag({
        isLedgerRow: true,
        dx: 14,
        dy: 4,
        elapsedMs: 40,
      })
    ).toBe(true);
  });

  it("allows ledger reorder after a long press with minimal movement", () => {
    expect(
      shouldActivatePlannerTouchDrag({
        isLedgerRow: true,
        dx: 3,
        dy: 2,
        elapsedMs: 190,
      })
    ).toBe(true);
  });
});
