"use client";

import { useCallback, useEffect, useRef } from "react";
import { reportError } from "@/lib/observability/report-error";

/** Serialize background reads and retain one trailing read for changes arriving mid-refresh. */
export function useCoalescedRefresh(refresh: () => Promise<unknown>) {
  const refreshRef = useRef(refresh);
  const mountedRef = useRef(true);
  const pendingRef = useRef(false);
  const runningRef = useRef(false);

  useEffect(() => { refreshRef.current = refresh; }, [refresh]);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      pendingRef.current = false;
    };
  }, []);

  return useCallback(() => {
    if (!mountedRef.current) return;
    pendingRef.current = true;
    if (runningRef.current) return;
    runningRef.current = true;
    void (async () => {
      try {
        while (mountedRef.current && pendingRef.current) {
          pendingRef.current = false;
          try {
            await refreshRef.current();
          } catch (error) {
            reportError(error, { surface: "background-refresh" });
          }
        }
      } finally {
        runningRef.current = false;
      }
    })();
  }, []);
}
