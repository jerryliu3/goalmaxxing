const DEFAULT_CARD_WIDTH_PX = 320;
const DEFAULT_CARD_ESTIMATED_HEIGHT_PX = 176;
const VIEWPORT_MARGIN_PX = 16;
const TARGET_GAP_PX = 12;

export function isVisibleOnboardingElement(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
}

export function queryOnboardingElements(target: string) {
  return Array.from(
    document.querySelectorAll(`[data-onboarding="${target}"]`)
  ).filter(
    (element): element is HTMLElement =>
      element instanceof HTMLElement && isVisibleOnboardingElement(element)
  );
}

export function unionClientRects(elements: HTMLElement[]) {
  let top = Number.POSITIVE_INFINITY;
  let left = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;
  for (const element of elements) {
    const rect = element.getBoundingClientRect();
    top = Math.min(top, rect.top);
    left = Math.min(left, rect.left);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);
  }
  return new DOMRect(left, top, right - left, bottom - top);
}

export function readOnboardingTargetRect(targets: readonly string[]) {
  for (const target of targets) {
    const elements = queryOnboardingElements(target);
    if (elements.length === 0) {
      continue;
    }
    return unionClientRects(elements);
  }
  return null;
}

export function firstOnboardingElement(targets: readonly string[]) {
  for (const target of targets) {
    const [element] = queryOnboardingElements(target);
    if (element) {
      return element;
    }
  }
  return null;
}

export function placeOnboardingCard(
  rect: DOMRect | null,
  options?: {
    cardWidthPx?: number;
    estimatedHeightPx?: number;
  }
) {
  const cardWidthPx = options?.cardWidthPx ?? DEFAULT_CARD_WIDTH_PX;
  const estimatedHeightPx =
    options?.estimatedHeightPx ?? DEFAULT_CARD_ESTIMATED_HEIGHT_PX;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  if (!rect) {
    return {
      top: VIEWPORT_MARGIN_PX + 72,
      left: Math.max(VIEWPORT_MARGIN_PX, (viewportWidth - cardWidthPx) / 2),
    };
  }

  const canPlaceBelow =
    rect.bottom + TARGET_GAP_PX + estimatedHeightPx <=
    viewportHeight - VIEWPORT_MARGIN_PX;
  const top = canPlaceBelow
    ? rect.bottom + TARGET_GAP_PX
    : Math.max(
        VIEWPORT_MARGIN_PX,
        rect.top - TARGET_GAP_PX - estimatedHeightPx
      );
  const left = Math.min(
    Math.max(rect.left, VIEWPORT_MARGIN_PX),
    viewportWidth - cardWidthPx - VIEWPORT_MARGIN_PX
  );
  return { top, left };
}
