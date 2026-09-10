"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import { readMonthGridScrollEdges } from "@/features/planner/calendar-scroll-position";

export function useMonthGridEdgeVisibility(
  viewportRef: RefObject<HTMLElement | null>,
  revision: string
) {
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      setAtStart(true);
      setAtEnd(true);
      return;
    }

    const sync = () => {
      const edges = readMonthGridScrollEdges(viewport);
      setAtStart(edges.atStart);
      setAtEnd(edges.atEnd);
    };
    sync();
    viewport.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      viewport.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [revision, viewportRef]);

  return { firstRowVisible: atStart, lastRowVisible: atEnd };
}
