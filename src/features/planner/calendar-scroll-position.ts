const DAY_CELL_SELECTOR = '[data-day-cell="true"][data-day]';

function queryCalendarDayCell(container: HTMLElement, day: string) {
  return container.querySelector<HTMLElement>(
    `${DAY_CELL_SELECTOR}[data-day="${day}"]`
  );
}

export function getCalendarTargetScrollTop(
  container: HTMLElement,
  target: HTMLElement
) {
  const containerTop = container.getBoundingClientRect().top;
  const targetTop = target.getBoundingClientRect().top;
  return Math.max(0, container.scrollTop + targetTop - containerTop);
}

export function getCalendarTargetScrollLeft(
  container: HTMLElement,
  target: HTMLElement
) {
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const targetLeft = container.scrollLeft + targetRect.left - containerRect.left;
  const centeredLeft =
    targetLeft - (container.clientWidth - targetRect.width) / 2;
  const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
  return Math.min(maxScrollLeft, Math.max(0, centeredLeft));
}

export function getTopVisibleCalendarDay(container: HTMLElement) {
  const visibleTop = Math.max(container.getBoundingClientRect().top, 0) + 1;
  const dayCells =
    container.querySelectorAll<HTMLElement>(DAY_CELL_SELECTOR);

  for (const dayCell of dayCells) {
    if (dayCell.getBoundingClientRect().bottom > visibleTop) {
      return dayCell.dataset.day ?? null;
    }
  }

  return null;
}

export function resolveMonthRowAnchorDay({
  viewport,
  focusedDay,
}: {
  viewport: HTMLElement;
  focusedDay: string;
}) {
  return getTopVisibleCalendarDay(viewport) ?? focusedDay;
}

export function captureCalendarDayScreenTop(viewport: HTMLElement, day: string) {
  return queryCalendarDayCell(viewport, day)?.getBoundingClientRect().top ?? null;
}

export function restoreCalendarDayScreenTop({
  viewport,
  day,
  previousTop,
  alignInsideViewport,
}: {
  viewport: HTMLElement;
  day: string;
  previousTop: number;
  alignInsideViewport: boolean;
}) {
  const cell = queryCalendarDayCell(viewport, day);
  if (!cell) {
    return;
  }

  if (alignInsideViewport) {
    const nextTop = getCalendarTargetScrollTop(viewport, cell);
    if (typeof viewport.scrollTo === "function") {
      viewport.scrollTo({ top: nextTop, behavior: "auto" });
    } else {
      viewport.scrollTop = nextTop;
    }
  } else if (viewport.scrollTop !== 0) {
    viewport.scrollTop = 0;
  }

  const delta = cell.getBoundingClientRect().top - previousTop;
  if (Math.abs(delta) < 1) {
    return;
  }
  if (typeof window.scrollBy === "function") {
    window.scrollBy({ top: delta, left: 0, behavior: "auto" });
    return;
  }
  window.scrollTo(0, (window.scrollY || 0) + delta);
}

interface CalendarDayVisibilityOptions {
  checkHorizontal?: boolean;
  checkVertical?: boolean;
  insetPx?: number;
}

export function isCalendarDayVisible(
  container: HTMLElement,
  day: string,
  {
    checkHorizontal = true,
    checkVertical = true,
    insetPx = 1,
  }: CalendarDayVisibilityOptions = {}
) {
  const dayCell = queryCalendarDayCell(container, day);
  if (!dayCell) {
    return false;
  }

  const containerRect = container.getBoundingClientRect();
  const dayRect = dayCell.getBoundingClientRect();
  if (
    (checkHorizontal && (containerRect.width <= 0 || dayRect.width <= 0)) ||
    (checkVertical && (containerRect.height <= 0 || dayRect.height <= 0))
  ) {
    return true;
  }
  const horizontalVisible =
    !checkHorizontal ||
    (dayRect.right > containerRect.left + insetPx &&
      dayRect.left < containerRect.right - insetPx);
  const verticalVisible =
    !checkVertical ||
    (dayRect.bottom > containerRect.top + insetPx &&
      dayRect.top < containerRect.bottom - insetPx);
  return horizontalVisible && verticalVisible;
}
