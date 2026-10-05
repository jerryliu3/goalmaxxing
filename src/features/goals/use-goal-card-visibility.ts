"use client";

import { useLayoutEffect, useRef, useState } from "react";

/** Visibility only bounds interaction eligibility; entering view does not build 3D. */
export function useGoalCardVisibility(margin = 200) {
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
      bounds.bottom > -margin && bounds.top < window.innerHeight + margin &&
      bounds.right > 0 && bounds.left < window.innerWidth
    );
    const observer = new IntersectionObserver(([entry]) => {
      setNearViewport(entry.isIntersecting);
    }, { rootMargin: `${margin}px 0px` });
    observer.observe(card);
    return () => observer.disconnect();
  }, [margin]);

  return { ref, nearViewport };
}
