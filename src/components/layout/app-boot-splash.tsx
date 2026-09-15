"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useState } from "react";
import { LandingWowMountain } from "@/components/landing/landing-wow-mountain";
import {
  APP_SURFACE_READY_EVENT,
  isAppBootSplashSkipped,
  markAppBootReady,
  removeAppBootPreloadOverlay,
} from "@/components/layout/app-boot-ready";
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

export { APP_BOOT_READY_STORAGE_KEY } from "@/components/layout/app-boot-ready";

const BOOT_TIMEOUT_MS = 15000;
const CLIMB_LOOP_MS = Math.round(14000 / 1.7);

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

function BootClimbAnimation() {
  const reduceMotion = useReducedMotion() === true;
  const [loopProgress, setLoopProgress] = useState(0.08);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const loop = ((now - startedAt) % CLIMB_LOOP_MS) / CLIMB_LOOP_MS;
      setLoopProgress(0.06 + loop * 0.88);
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [reduceMotion]);

  const progress = reduceMotion ? 0.42 : loopProgress;

  return (
    <div
      data-testid="app-boot-climb"
      className="relative h-64 w-[min(100vw-2rem,32rem)] overflow-hidden rounded-[20px] border border-border sm:h-80"
    >
      <LandingWowMountain progress={progress} />
    </div>
  );
}

export function AppBootSplash() {
  const [visible, setVisible] = useState(true);

  useLayoutEffect(() => {
    removeAppBootPreloadOverlay();
    if (isAppBootSplashSkipped()) {
      setVisible(false);
      return;
    }

    let cancelled = false;
    let finished = false;
    const finish = () => {
      if (cancelled || finished) {
        return;
      }
      finished = true;
      markAppBootReady();
      removeAppBootPreloadOverlay();
      setVisible(false);
    };
    const timeoutId = window.setTimeout(finish, BOOT_TIMEOUT_MS);
    let paintFrame = 0;
    const onSurfaceReady = () => {
      window.clearTimeout(timeoutId);
      paintFrame = window.requestAnimationFrame(() => {
        finish();
      });
    };
    window.addEventListener(APP_SURFACE_READY_EVENT, onSurfaceReady);
    void warmPlannerContext().catch(() => undefined);
    void import("@/features/planner/calendar-page-shell");
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      if (paintFrame) {
        window.cancelAnimationFrame(paintFrame);
      }
      window.removeEventListener(APP_SURFACE_READY_EVENT, onSurfaceReady);
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
        <BootClimbAnimation />
        <p className="font-display text-3xl font-semibold tracking-tight">Goalmaxxing</p>
        <p className="text-sm text-muted-foreground">Preparing your plan…</p>
      </div>
    </div>
  );
}
