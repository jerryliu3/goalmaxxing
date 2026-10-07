export const APP_BOOT_READY_STORAGE_KEY = "gm-boot-ready";
export const APP_BOOT_READY_E2E_VALUE = "1";
export const APP_BOOT_PRELOAD_ELEMENT_ID = "gm-boot-splash-preload";
export const APP_SURFACE_READY_EVENT = "gm:app-surface-ready";

const APP_BOOT_PATH_PREFIXES = [
  "/calendar",
  "/checklist",
  "/tasks",
  "/insights",
  "/social",
  "/settings",
  "/achievements",
  "/growth",
  "/goals",
] as const;

const APP_BOOT_GATED_PATH_PREFIXES = [
  "/calendar",
  "/insights",
  "/settings",
  "/achievements",
  "/growth",
] as const;

export function normalizeAppBootPath(pathname: string): string {
  if (pathname === "/demo" || pathname.startsWith("/demo/")) {
    return pathname.slice("/demo".length) || "/";
  }
  return pathname;
}

function matchesPathPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isAppBootPath(pathname: string): boolean {
  const path = normalizeAppBootPath(pathname);
  if (path === "/app") {
    return true;
  }
  return APP_BOOT_PATH_PREFIXES.some((prefix) => matchesPathPrefix(path, prefix));
}

export function isAppBootGatedPath(pathname: string): boolean {
  const path = normalizeAppBootPath(pathname);
  return APP_BOOT_GATED_PATH_PREFIXES.some((prefix) => matchesPathPrefix(path, prefix));
}

export const APP_BOOT_PRELOAD_SCRIPT = `(function(){
  try {
    var key=${JSON.stringify(APP_BOOT_READY_STORAGE_KEY)};
    var id=${JSON.stringify(APP_BOOT_PRELOAD_ELEMENT_ID)};
    if (sessionStorage.getItem(key) === ${JSON.stringify(APP_BOOT_READY_E2E_VALUE)}) return;
    if (localStorage.getItem(key) === ${JSON.stringify(APP_BOOT_READY_E2E_VALUE)}) return;
    var path = location.pathname;
    if (path === "/demo" || path.indexOf("/demo/") === 0) path = path.slice(5) || "/";
    var prefixes = ${JSON.stringify(APP_BOOT_PATH_PREFIXES)};
    var match = path === "/app";
    if (!match) {
      for (var i = 0; i < prefixes.length; i++) {
        if (path === prefixes[i] || path.indexOf(prefixes[i] + "/") === 0) {
          match = true;
          break;
        }
      }
    }
    if (!match || document.getElementById(id)) return;
    var el = document.createElement("div");
    el.id = id;
    el.setAttribute("aria-busy", "true");
    el.style.cssText = "position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:var(--background,#f8f1e3);color:var(--foreground,#171717)";
    el.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:1.25rem;padding:0 1.5rem;text-align:center"><p style="margin:0;font-size:1.875rem;font-weight:600;letter-spacing:-0.025em">Goalmaxxing</p><p style="margin:0;font-size:0.875rem;opacity:0.7">Preparing your plan…</p></div>';
    (document.body || document.documentElement).appendChild(el);
  } catch (error) {}
})();`;
