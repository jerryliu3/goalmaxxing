"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { axisDate, axisIndex, resizedAxisOffset, visibleAxisWindow } from "./weave-axis";

export function useWeaveAxis(dayWidth: number, labelWidth: number, initialDate: string, onVisibleDate: (date: string) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const previousDayWidth = useRef<number | null>(null);
  const previousOffset = useRef(0);
  const initialDateRef = useRef(initialDate);
  const callback = useRef(onVisibleDate);
  const still = useReducedMotion();
  const [range, setRange] = useState(() => visibleAxisWindow(axisIndex(initialDate) * dayWidth, 1000, dayWidth, labelWidth));
  useEffect(() => { callback.current = onVisibleDate; }, [onVisibleDate]);
  useLayoutEffect(() => {
    const viewport = ref.current;
    if (!viewport) return;
    viewport.scrollLeft = previousDayWidth.current === null ? axisIndex(initialDateRef.current) * dayWidth : resizedAxisOffset(previousOffset.current, previousDayWidth.current, dayWidth);
    previousDayWidth.current = dayWidth;
    let frame = 0;
    let reportedIndex = -1;
    const update = () => {
      frame = 0;
      previousOffset.current = viewport.scrollLeft;
      const next = visibleAxisWindow(viewport.scrollLeft, viewport.clientWidth, dayWidth, labelWidth);
      setRange(current => current.first === next.first && current.last === next.last && current.firstVisible === next.firstVisible ? current : next);
      if (reportedIndex !== next.firstVisible) { reportedIndex = next.firstVisible; callback.current(axisDate(reportedIndex)); }
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(onScroll);
    observer.observe(viewport);
    viewport.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => { observer.disconnect(); viewport.removeEventListener("scroll", onScroll); if (frame) cancelAnimationFrame(frame); };
  }, [dayWidth, labelWidth]);
  const scrollToDate = useCallback((date: string, smooth = true) => {
    ref.current?.scrollTo({ left: axisIndex(date) * dayWidth, behavior: still || !smooth ? "instant" : "smooth" });
  }, [dayWidth, still]);
  return { ref, range, scrollToDate };
}
