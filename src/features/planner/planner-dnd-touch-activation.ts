const LEDGER_HORIZONTAL_DRAG_MIN_PX = 12;
const LEDGER_VERTICAL_SCROLL_MIN_PX = 8;

export function shouldActivatePlannerTouchDrag({
  isLedgerRow,
  dx,
  dy,
  elapsedMs,
  delayMs = 180,
  tolerancePx = 10,
}: {
  isLedgerRow: boolean;
  dx: number;
  dy: number;
  elapsedMs: number;
  delayMs?: number;
  tolerancePx?: number;
}): boolean {
  if (!isLedgerRow) {
    return true;
  }

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx >= LEDGER_HORIZONTAL_DRAG_MIN_PX && absDx > absDy) {
    return true;
  }

  if (elapsedMs >= delayMs && absDx <= tolerancePx && absDy <= tolerancePx) {
    return true;
  }

  if (absDy >= LEDGER_VERTICAL_SCROLL_MIN_PX && absDy > absDx) {
    return false;
  }

  return false;
}
