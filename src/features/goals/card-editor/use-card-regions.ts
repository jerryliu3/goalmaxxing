"use client";

import { type RefObject, useLayoutEffect, useState } from "react";
import type { FaceFact } from "./card-facts";

export interface FaceRegion {
  fact: FaceFact;
  x: number;
  y: number;
  width: number;
  height: number;
  /** False when the card prints nothing for it yet (no deadline, no time). */
  present: boolean;
  /** The printed line's middle; the hit area below it may be taller. */
  midY: number;
  /** Where a leader line should touch, when that isn't the box's edge (the title's last word). */
  point?: { x: number; y: number };
}

/**
 * Where each fact sits on the rendered `TempoGoalCard`. Selectors follow the card's own
 * structure, so the card stays a pure renderer and editing lives in an overlay.
 */
const SELECTORS: [FaceFact, string][] = [
  ["visibility", "[data-tempo-goal-card] > .tempo-card-meta:first-child > span:first-child"],
  ["cadence", ".tempo-card-target"],
  ["name", "[data-tempo-goal-card] h2"],
  ["category", ".tempo-card-period"],
  ["difficulty", ".tempo-card-effort"],
  ["start", ".tempo-card-date-line:first-child"],
  ["deadline", ".tempo-card-date-line:last-child"],
  ["time", ".tempo-card-time"],
];

const MIN_WIDTH = 72;
const MIN_HEIGHT = 20;
const TITLE_POINT_GAP = 3;

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * An element's layout box relative to `root`, from offsets. Offsets ignore CSS transforms,
 * so measuring stays correct while the card is turned over or mid-flip; client rects
 * would come back mirrored.
 */
export function boxWithin(element: Element | null, root: HTMLElement): Box | null {
  if (!(element instanceof HTMLElement)) return null;
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = element;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return node === root ? { x, y, width: element.offsetWidth, height: element.offsetHeight } : null;
}

export function useCardRegions(container: RefObject<HTMLElement | null>, version: string) {
  const [layout, setLayout] = useState<{ regions: FaceRegion[]; width: number }>({ regions: [], width: 0 });
  useLayoutEffect(() => {
    const root = container.current;
    if (!root) return;
    const measure = () => {
      const next = SELECTORS.map(([fact, selector]): FaceRegion => {
        const element = root.querySelector(selector);
        const box = boxWithin(element, root);
        if (!box) return { fact, x: 0, y: 0, width: 0, height: 0, present: false, midY: 0 };
        // The card reserves every fact's line, so an empty fact still has a place: the
        // slot sits exactly where its value will print. The effort bars are drawn, not text.
        const present = fact === "difficulty" ? box.width > 1 : Boolean(element?.textContent?.trim());
        // The effort bars keep their true width so controls can sit right beside them.
        const width = fact === "difficulty" ? box.width : Math.max(box.width, present ? MIN_WIDTH : MIN_WIDTH + 24);
        // Right-aligned facts grow leftward so the hit area stays on the card.
        const x = fact === "time" || fact === "difficulty" ? box.x + box.width - width : box.x;
        const end = fact === "name" ? boxWithin(root.querySelector(".tempo-card-title-end"), root) : null;
        // Clear of the last letter, so the line reads as pointing at the whole title.
        const point = end ? { x: end.x + TITLE_POINT_GAP, y: end.y + end.height / 2 } : undefined;
        const height = Math.max(box.height, present ? MIN_HEIGHT : 16);
        return { fact, x, y: box.y, width, height, present, midY: box.y + box.height / 2, point };
      });
      setLayout({ regions: next, width: root.offsetWidth });
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(root);
    const frame = requestAnimationFrame(measure);
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [container, version]);
  return layout;
}

/**
 * The element's laid-out width, kept current. Starts from `fallback` until there is a
 * layout to measure, so the first render already picks a sensible arrangement.
 */
export function useElementWidth(ref: RefObject<HTMLElement | null>, fallback: number) {
  const [width, setWidth] = useState(fallback);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => {
      if (element.clientWidth > 0) setWidth(element.clientWidth);
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}
