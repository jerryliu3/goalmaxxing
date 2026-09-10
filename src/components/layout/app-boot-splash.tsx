"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { LandingWowMountain } from "@/components/landing/landing-wow-mountain";
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
const CLIMB_LOOP_MS = 14000;

function subscribeToBootReady() {
  return () => undefined;
}

function getBootReadySnapshot() {
  return (
    typeof window !== "undefined" &&
    window.sessionStorage.getItem(APP_BOOT_READY_STORAGE_KEY) === "1"
  );
}

function getServerBootReadySnapshot() {
  return true;
}

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
  const [progress, setProgress] = useState(0.08);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const loop = ((now - startedAt) % CLIMB_LOOP_MS) / CLIMB_LOOP_MS;
      setProgress(0.06 + loop * 0.88);
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [reduceMotion]);

  return (
    <div
      data-testid="app-boot-climb"
      className="relative h-64 w-[min(100vw-2rem,32rem)] overflow-hidden rounded-[20px] border border-border sm:h-80"
    >
      <LandingWowMountain progress={reduceMotion ? 0.42 : progress} />
    </div>
  );
}

export function AppBootSplash() {
  const bootReady = useSyncExternalStore(
    subscribeToBootReady,
    getBootReadySnapshot,
    getServerBootReadySnapshot
  );
  const [bootComplete, setBootComplete] = useState(false);

  useEffect(() => {
    if (bootReady || bootComplete) {
      return;
    }

    let cancelled = false;
    const finish = () => {
      if (cancelled) {
        return;
      }
      window.sessionStorage.setItem(APP_BOOT_READY_STORAGE_KEY, "1");
      setBootComplete(true);
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
  }, [bootComplete, bootReady]);

  if (bootReady || bootComplete) {
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
