"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { addDaysToDateString } from "@/lib/goals/periods";
import { extendTimelineSpan, initialTimelineSpan, timelineIndex, visibleTimelineRange } from "./timeline-axis";

/** Extends the civil-date axis while preserving the leading date; only visible columns render. */
export function useTimelineAxis(initialDate: string, dayWidth: number, labelWidth: number, onVisibleDate: (date: string) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const [span, setSpan] = useState(() => initialTimelineSpan(initialDate));
  const [range, setRange] = useState(() => visibleTimelineRange(365 * dayWidth, 800, dayWidth, labelWidth, 731));
  const callback = useRef(onVisibleDate);
  callback.current = onVisibleDate;
  const previous = useRef<{ start: string; dayWidth: number } | null>(null);
  const requestedDate = useRef<string | null>(initialDate);
  const still = useReducedMotion();

  useLayoutEffect(() => {
    const viewport = ref.current;
    if (!viewport) return;
    const prior = previous.current;
    const leadingIndex = prior ? viewport.scrollLeft / prior.dayWidth + timelineIndex(prior.start, span.start) : 0;
    viewport.scrollLeft = requestedDate.current
      ? timelineIndex(requestedDate.current, span.start) * dayWidth
      : leadingIndex * dayWidth;
    requestedDate.current = null;
    previous.current = { start: span.start, dayWidth };
    let frame = 0;
    let reportedDate = "";
    const update = () => {
      frame = 0;
      const next = visibleTimelineRange(viewport.scrollLeft, viewport.clientWidth, dayWidth, labelWidth, span.days);
      setRange((current) => current.first === next.first && current.last === next.last && current.firstVisible === next.firstVisible ? current : next);
      const date = addDaysToDateString(span.start, next.firstVisible);
      if (date !== reportedDate) { reportedDate = date; callback.current(date); }
      const extended = extendTimelineSpan(span, next.first, next.last);
      if (extended !== span) setSpan(extended);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(onScroll);
    observer.observe(viewport);
    viewport.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      observer.disconnect();
      viewport.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [dayWidth, labelWidth, span]);

  const scrollToDate = useCallback((date: string) => {
    const index = timelineIndex(date, span.start);
    if (index < 28 || index >= span.days - 28) {
      requestedDate.current = date;
      setSpan(initialTimelineSpan(date));
    } else {
      ref.current?.scrollTo({ left: index * dayWidth, behavior: still ? "auto" : "smooth" });
    }
  }, [dayWidth, span, still]);
  return { ref, span, range, scrollToDate };
}
