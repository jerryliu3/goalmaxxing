"use client";

import { useEffect } from "react";
import {
  APP_BOOT_PRELOAD_ELEMENT_ID,
  APP_BOOT_READY_E2E_VALUE,
  APP_BOOT_READY_STORAGE_KEY,
  APP_SURFACE_READY_EVENT,
} from "@/components/layout/app-boot-preload";

export {
  APP_BOOT_PRELOAD_ELEMENT_ID,
  APP_BOOT_PRELOAD_SCRIPT,
  APP_BOOT_READY_E2E_VALUE,
  APP_BOOT_READY_STORAGE_KEY,
  APP_SURFACE_READY_EVENT,
  isAppBootGatedPath,
  isAppBootPath,
  normalizeAppBootPath,
} from "@/components/layout/app-boot-preload";

export function isAppBootSplashSkipped(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const value = window.sessionStorage.getItem(APP_BOOT_READY_STORAGE_KEY);
  return (
    value === APP_BOOT_READY_E2E_VALUE || value === String(performance.timeOrigin)
  );
}

export function markAppBootReady(): void {
  if (typeof window === "undefined") {
    return;
  }
  const existing = window.sessionStorage.getItem(APP_BOOT_READY_STORAGE_KEY);
  if (existing === APP_BOOT_READY_E2E_VALUE) {
    return;
  }
  window.sessionStorage.setItem(
    APP_BOOT_READY_STORAGE_KEY,
    String(performance.timeOrigin)
  );
}

export function removeAppBootPreloadOverlay(): void {
  if (typeof document === "undefined") {
    return;
  }
  document.getElementById(APP_BOOT_PRELOAD_ELEMENT_ID)?.remove();
}

export function reportAppSurfaceReady(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(APP_SURFACE_READY_EVENT));
}

export function useReportAppSurfaceReady(isReady: boolean): void {
  useEffect(() => {
    if (!isReady) {
      return;
    }
    reportAppSurfaceReady();
  }, [isReady]);
}
