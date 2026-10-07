"use client";

import { useLayoutEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { planMorphEasing } from "@/features/planner/plan-view-transition";
import { LANE_LAYOUT_MORPH_MS } from "./use-lane-morph";

/** Marks a piece of a card that glides to its new spot when Calendar toggles. */
export const GLIDE_KEY = "data-glide";

interface Place {
  x: number;
  y: number;
  size: number;
}

/** Layout offset of `element` inside `tile`, ignoring transforms (the tile itself may be gliding). */
function offsetWithin(element: HTMLElement, tile: HTMLElement) {
  let x = 0;
  let y = 0;
  for (let node: HTMLElement | null = element; node && node !== tile; node = node.offsetParent as HTMLElement | null) {
    x += node.offsetLeft;
    y += node.offsetTop;
  }
  return { x, y };
}

function measure(tile: HTMLElement) {
  const places = new Map<string, Place>();
  for (const element of tile.querySelectorAll<HTMLElement>(`[${GLIDE_KEY}]`)) {
    places.set(element.getAttribute(GLIDE_KEY)!, {
      ...offsetWithin(element, tile),
      size: Number.parseFloat(getComputedStyle(element).fontSize) || 1,
    });
  }
  return places;
}

/**
 * A card's count, period, time, and name each have a spot under the date, and
 * new spots once a calendar header names the date and the count leads. When
 * that flips, every marked piece glides (the count also scales) from where it
 * was to where it now sits, over the same 720ms as the cards themselves;
 * a piece with no earlier spot fades in as the others land.
 */
export function useTileGlide(lead: boolean) {
  const tileRef = useRef<HTMLElement>(null);
  const last = useRef<{ lead: boolean; places: Map<string, Place> } | null>(null);
  const reduceMotion = useReducedMotion();

  useLayoutEffect(() => {
    const tile = tileRef.current;
    if (!tile) return;
    const places = measure(tile);
    const previous = last.current;
    last.current = { lead, places };
    if (!previous || previous.lead === lead || reduceMotion || typeof tile.animate !== "function") return;
    for (const element of tile.querySelectorAll<HTMLElement>(`[${GLIDE_KEY}]`)) {
      const key = element.getAttribute(GLIDE_KEY)!;
      const from = previous.places.get(key);
      const to = places.get(key)!;
      if (!from) {
        element.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: LANE_LAYOUT_MORPH_MS / 2,
          delay: LANE_LAYOUT_MORPH_MS / 2,
          easing: "ease-out",
          fill: "backwards",
        });
        continue;
      }
      const dx = from.x - to.x;
      const dy = from.y - to.y;
      const scale = from.size / to.size;
      if (!dx && !dy && scale === 1) continue;
      element.animate(
        [{ transform: `translate(${dx}px, ${dy}px) scale(${scale})` }, { transform: "none" }],
        { duration: LANE_LAYOUT_MORPH_MS, easing: planMorphEasing() }
      );
    }
  });

  return tileRef;
}
