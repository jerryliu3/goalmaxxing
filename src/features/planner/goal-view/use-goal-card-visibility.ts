"use client";

import { useLayoutEffect, useRef, useState } from "react";

const CARD_PRELOAD_MARGIN = 200;

/** Keep full fragments ready just ahead of scrolling, and release them behind it. */
export function useGoalCardVisibility() {
  const ref = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(false);

  useLayoutEffect(() => {
    const card = ref.current;
    if (!card) return;
    if (typeof IntersectionObserver === "undefined") {
      setNearViewport(true);
      return;
    }

    // Prepare the initial viewport before paint; later scrolls use the native
    // observer, which also accounts for the carousel's clipping container.
    const bounds = card.getBoundingClientRect();
    setNearViewport(
      bounds.width > 0 && bounds.height > 0 &&
      bounds.bottom > -CARD_PRELOAD_MARGIN && bounds.top < window.innerHeight + CARD_PRELOAD_MARGIN &&
      bounds.right > 0 && bounds.left < window.innerWidth
    );
    const observer = new IntersectionObserver(([entry]) => {
      setNearViewport(entry.isIntersecting);
    }, { rootMargin: `${CARD_PRELOAD_MARGIN}px 0px` });
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return { ref, nearViewport };
}
