"use client";

import { useCallback, useLayoutEffect, useState, type RefObject } from "react";
import { readMonthGridScrollEdges } from "@/features/planner/calendar-scroll-position";

export function useMonthGridEdgeVisibility(
  viewportRef: RefObject<HTMLElement | null>,
  revision: string
) {
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const sync = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      setAtStart(true);
      setAtEnd(true);
      return;
    }
    const edges = readMonthGridScrollEdges(viewport);
    setAtStart(edges.atStart);
    setAtEnd(edges.atEnd);
  }, [viewportRef]);

  // Scroll alignment can trigger another commit before the browser delivers its
  // scroll event. Settle toggle layout in that commit, before morph measurement.
  useLayoutEffect(sync);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      viewport.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [revision, viewportRef, sync]);

  return { firstRowVisible: atStart, lastRowVisible: atEnd };
}
