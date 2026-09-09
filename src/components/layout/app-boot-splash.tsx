"use client";

import { useEffect, useState } from "react";
import { getMonthInTimezone } from "@/features/planner/calendar-format";
import type { PlannerContextPayload } from "@/features/planner/calendar-surface.types";
import { getJson } from "@/lib/api/client";
import { buildPlannerContextCacheKey } from "@/lib/cache/planner-tab-cache";
import {
  isTabDataCacheFresh,
  readTabDataCache,
  writeTabDataCache,
} from "@/lib/cache/tab-data-cache";
import { resolveUserTimezone } from "@/lib/dates/timezone";

export const APP_BOOT_READY_STORAGE_KEY = "gm-boot-ready";
const BOOT_TIMEOUT_MS = 8000;

async function warmPlannerContext() {
  const month = getMonthInTimezone(resolveUserTimezone());
  const cacheKey = buildPlannerContextCacheKey(month);
  const cached = readTabDataCache<PlannerContextPayload>(cacheKey);
  if (cached && isTabDataCacheFresh(cacheKey)) {
    return;
  }
  const contextPayload = await getJson<PlannerContextPayload>("/api/planner/context", {
    query: { scopeMonth: month },
  });
  writeTabDataCache(cacheKey, contextPayload);
}

export function AppBootSplash() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.sessionStorage.getItem(APP_BOOT_READY_STORAGE_KEY) === "1") {
      return;
    }

    let cancelled = false;
    setVisible(true);
    const finish = () => {
      if (cancelled) {
        return;
      }
      window.sessionStorage.setItem(APP_BOOT_READY_STORAGE_KEY, "1");
      setVisible(false);
    };
    const timeoutId = window.setTimeout(finish, BOOT_TIMEOUT_MS);
    void warmPlannerContext()
      .catch(() => undefined)
      .finally(() => {
        window.clearTimeout(timeoutId);
        finish();
      });
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      data-testid="app-boot-splash"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-page"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-5 px-6 text-center">
        <span
          aria-hidden
          className="app-boot-stamp flex size-16 items-center justify-center rounded-[14px] border-2 border-primary"
        >
          <span className="font-display text-3xl font-semibold leading-none text-primary">
            G
          </span>
        </span>
        <p className="font-display text-3xl font-semibold tracking-tight">Goalmaxxing</p>
        <p className="text-sm text-muted-foreground">Preparing your plan…</p>
      </div>
    </div>
  );
}
