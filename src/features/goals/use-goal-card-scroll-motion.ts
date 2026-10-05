"use client";

import { useEffect, useState } from "react";

export const GOAL_CARD_SCROLL_SETTLE_MS = 180;

/** One listener set per page; inertia and nested scrolling both delay card preparation. */
export function useGoalCardScrollMotion() {
  const [moving, setMoving] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onMotion = () => {
      setMoving(true);
      clearTimeout(timer);
      timer = setTimeout(() => setMoving(false), GOAL_CARD_SCROLL_SETTLE_MS);
    };
    const options = { capture: true, passive: true };
    window.addEventListener("scroll", onMotion, options);
    window.addEventListener("wheel", onMotion, options);
    window.addEventListener("touchmove", onMotion, options);
    window.addEventListener("resize", onMotion, options);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onMotion, options);
      window.removeEventListener("wheel", onMotion, options);
      window.removeEventListener("touchmove", onMotion, options);
      window.removeEventListener("resize", onMotion, options);
    };
  }, []);
  return moving;
}
