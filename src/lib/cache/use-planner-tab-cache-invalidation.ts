"use client";

import { useEffect, useRef } from "react";
import { subscribePlannerTabCacheInvalidation } from "@/lib/cache/planner-tab-cache";

export function usePlannerTabCacheInvalidation(onInvalidate: () => void) {
  const onInvalidateRef = useRef(onInvalidate);

  useEffect(() => {
    onInvalidateRef.current = onInvalidate;
  });

  useEffect(() => {
    return subscribePlannerTabCacheInvalidation(() => {
      onInvalidateRef.current();
    });
  }, []);
}
