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

export const APP_BOOT_GATES = ["surface", "xp"] as const;
export type AppBootGate = (typeof APP_BOOT_GATES)[number];

const readyGates = new Set<AppBootGate>();
let allReadyDispatched = false;

export function resetAppBootGatesForTests(): void {
  readyGates.clear();
  allReadyDispatched = false;
}

export function isAppBootSplashSkipped(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  if (typeof navigator !== "undefined" && navigator.webdriver) {
    return true;
  }
  const sessionValue = window.sessionStorage.getItem(APP_BOOT_READY_STORAGE_KEY);
  const localValue = window.localStorage.getItem(APP_BOOT_READY_STORAGE_KEY);
  return (
    sessionValue === APP_BOOT_READY_E2E_VALUE ||
    localValue === APP_BOOT_READY_E2E_VALUE ||
    sessionValue === String(performance.timeOrigin)
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

function maybeDispatchAppSurfaceReady(): void {
  if (allReadyDispatched) {
    return;
  }
  if (!APP_BOOT_GATES.every((gate) => readyGates.has(gate))) {
    return;
  }
  allReadyDispatched = true;
  reportAppSurfaceReady();
}

export function reportAppBootGateReady(gate: AppBootGate): void {
  readyGates.add(gate);
  maybeDispatchAppSurfaceReady();
}

export function useReportAppBootGateReady(gate: AppBootGate, isReady: boolean): void {
  useEffect(() => {
    if (!isReady) {
      return;
    }
    reportAppBootGateReady(gate);
  }, [gate, isReady]);
}

export function useReportAppSurfaceReady(isReady: boolean): void {
  useReportAppBootGateReady("surface", isReady);
}
