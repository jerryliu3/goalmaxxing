"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LaneGeometry } from "./goal-lanes-model";

export interface LaneViewport {
  scrollLeft: number;
  /** Visible width of the date track, excluding the pinned goal label column. */
  trackWidth: number;
}

/**
 * Follows the lanes scroller. The exact position lives in a ref for anchoring;
 * React state changes at most once per frame, and only when scrolling crosses
 * a column, so native scrolling does not re-render the lanes. Callers derive
 * the columns to render from it with overscan.
 */
export function useLaneViewport({ pitch, label }: Pick<LaneGeometry, "pitch" | "label">) {
  const scroller = useRef<HTMLDivElement>(null);
  const exact = useRef<LaneViewport>({ scrollLeft: 0, trackWidth: 0 });
  const [viewport, setViewport] = useState<LaneViewport>(exact.current);
  const frame = useRef(0);

  const read = useCallback(() => {
    const element = scroller.current;
    if (!element) return exact.current;
    exact.current = {
      scrollLeft: element.scrollLeft,
      trackWidth: Math.max(0, element.clientWidth - label),
    };
    return exact.current;
  }, [label]);

  const sync = useCallback(() => {
    cancelAnimationFrame(frame.current);
    setViewport(read());
  }, [read]);

  /** Scrolls instantly and publishes the result in the same commit. */
  const scrollTo = useCallback(
    (left: number) => {
      const element = scroller.current;
      if (element) element.scrollLeft = Math.max(0, left);
      sync();
      return exact.current.scrollLeft;
    },
    [sync]
  );

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const sameColumn = (a: LaneViewport, b: LaneViewport) =>
      Math.floor(a.scrollLeft / pitch) === Math.floor(b.scrollLeft / pitch) &&
      a.trackWidth === b.trackWidth;
    const schedule = () => {
      read();
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() =>
        setViewport((current) =>
          sameColumn(current, exact.current) ? current : { ...exact.current }
        )
      );
    };
    element.addEventListener("scroll", schedule, { passive: true });
    const observer =
      typeof ResizeObserver === "function" ? new ResizeObserver(schedule) : null;
    observer?.observe(element);
    schedule();
    return () => {
      element.removeEventListener("scroll", schedule);
      observer?.disconnect();
      cancelAnimationFrame(frame.current);
    };
  }, [read, pitch]);

  return { scroller, viewport, exact, scrollTo };
}
