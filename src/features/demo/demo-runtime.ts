import { toLocalDateString } from "@/lib/dates/day";
import { buildDemoSnapshot } from "@/features/demo/demo-snapshot";
import { handleDemoFetch } from "@/features/demo/demo-fetch";
import { clearDemoStore, getDemoStore, initDemoStore } from "@/features/demo/demo-store";

let installed = false;
let originalFetch: typeof fetch | null = null;

export function installDemoRuntime(asOfDate = toLocalDateString()) {
  if (!installed) {
    initDemoStore(buildDemoSnapshot(asOfDate));
    if (typeof window !== "undefined") {
      originalFetch = window.fetch.bind(window);
      const passthrough = originalFetch;
      window.fetch = (input: RequestInfo | URL, init?: RequestInit) =>
        handleDemoFetch(input, init, passthrough);
    }
    installed = true;
  }
  return getDemoStore();
}

export function resetDemoRuntimeForTests() {
  if (typeof window !== "undefined" && originalFetch) {
    window.fetch = originalFetch;
  }
  originalFetch = null;
  installed = false;
  clearDemoStore();
}

export function isDemoRuntimeInstalled() {
  return installed;
}
