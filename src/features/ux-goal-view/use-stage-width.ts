"use client";

import { useEffect, useRef, useState } from "react";

/** Container width lets the phone preview behave like the actual phone layout. */
export function useStageWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1000);
  useEffect(() => {
    const stage = ref.current;
    if (!stage) return;
    setWidth(stage.clientWidth);
    const observer = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}
