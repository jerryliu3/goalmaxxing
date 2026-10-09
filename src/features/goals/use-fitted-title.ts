"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

const MAX_LINES = 2;
// Halvings of the scale range: finer than a pixel at any card size.
const SEARCH_STEPS = 7;

function wrapsPastMaxLines(title: HTMLElement) {
  const style = getComputedStyle(title);
  const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
  // Half a line of slack absorbs the inline lettering's baseline strut.
  return title.offsetHeight > lineHeight * (MAX_LINES + 0.5);
}

/**
 * Keeps a card title to two lines by shrinking it (`--title-scale`), never truncating it.
 * The title is sized in container units, so the scale depends only on the text, not on the
 * size the card is drawn at: fitting any one laid-out copy (fragments repeat the face)
 * gives the scale for every copy.
 */
export function useFittedTitle(text: string) {
  const copies = useRef(new Set<HTMLElement>());
  const [scale, setScale] = useState(1);

  const ref = useCallback((node: HTMLElement | null) => {
    if (!node) return;
    copies.current.add(node);
    return () => {
      copies.current.delete(node);
    };
  }, []);

  useLayoutEffect(() => {
    let fitted = false;
    let live = true;
    const fit = () => {
      const title = [...copies.current].find((copy) => copy.offsetWidth > 0);
      if (!title) return;
      fitted = true;
      const fits = (candidate: number) => {
        title.style.setProperty("--title-scale", String(candidate));
        return !wrapsPastMaxLines(title);
      };
      let next = 1;
      if (!fits(1)) {
        // Titles have no length cap, so there is no floor: the largest scale that fits wins.
        let low = 0;
        let high = 1;
        for (let step = 0; step < SEARCH_STEPS; step += 1) {
          const middle = (low + high) / 2;
          if (fits(middle)) low = middle;
          else high = middle;
        }
        next = low || high;
        fits(next);
      }
      setScale(next);
    };

    fit();
    void document.fonts?.ready.then(() => {
      if (live) fit();
    });
    // A card mounted hidden has no layout yet; fit it once it is first laid out.
    const observer =
      !fitted && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            fit();
            if (fitted) observer?.disconnect();
          })
        : null;
    copies.current.forEach((copy) => observer?.observe(copy));
    return () => {
      live = false;
      observer?.disconnect();
    };
  }, [text]);

  return { ref, scale };
}
