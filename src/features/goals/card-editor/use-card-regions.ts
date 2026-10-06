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
  ["stretch", ".tempo-card-effort"],
  ["start", ".tempo-card-dates > span:first-child"],
  ["deadline", ".tempo-card-dates > span:last-child"],
  ["time", ".tempo-card-dates + .tempo-card-meta > span"],
];

const MIN_WIDTH = 72;
const MIN_HEIGHT = 20;

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
  const [layout, setLayout] = useState<{ regions: FaceRegion[]; width: number; height: number }>({ regions: [], width: 0, height: 0 });
  useLayoutEffect(() => {
    const root = container.current;
    if (!root) return;
    const measure = () => {
      const dates = boxWithin(root.querySelector(".tempo-card-dates"), root);
      const article = root.querySelector("[data-tempo-goal-card]");
      const card = boxWithin(article, root);
      const next = SELECTORS.map(([fact, selector]): FaceRegion => {
        const box = boxWithin(root.querySelector(selector), root);
        if (box && box.width > 1) {
          // The effort bars keep their true width so controls can sit right beside them.
          const width = fact === "stretch" ? box.width : Math.max(box.width, MIN_WIDTH);
          // Right-aligned facts grow leftward so the hit area stays on the card.
          const x = fact === "deadline" || fact === "stretch" ? box.x + box.width - width : box.x;
          return { fact, x, y: box.y, width, height: Math.max(box.height, MIN_HEIGHT), present: true };
        }
        // Absent facts get a ghost slot exactly where the card would print them.
        const anchor = dates ?? card;
        if (!anchor) return { fact, x: 0, y: 0, width: 0, height: 0, present: false };
        if (fact === "time" && card) {
          // The time prints as the next row under the dates: one row gap down, inside the
          // card's bottom padding so the slot always reads as part of the face.
          const style = article ? getComputedStyle(article) : null;
          const rowGap = parseFloat(style?.rowGap ?? "") || 6;
          const inset = (parseFloat(style?.paddingBottom ?? "") || 12) / 2;
          const height = Math.max(anchor.height, 16);
          const y = Math.min(anchor.y + anchor.height + rowGap, card.y + card.height - inset - height);
          return { fact, x: anchor.x, y, width: MIN_WIDTH + 24, height, present: false };
        }
        const x = fact === "deadline" ? anchor.x + anchor.width - MIN_WIDTH : anchor.x;
        return { fact, x, y: anchor.y, width: MIN_WIDTH, height: Math.max(anchor.height, 16), present: false };
      });
      setLayout({ regions: next, width: root.offsetWidth, height: root.offsetHeight });
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
