import {
  DUO_SURFACE_DEFAULTS,
  type DuoScope,
} from "@cadence/shared/social/duo";

export { DUO_SURFACE_DEFAULTS };

// Keep these route prefixes synchronized with DUO_SURFACE_DEFAULTS in the
// shared package whenever a Duo surface is added or renamed.
export function resolveDuoSurfaceDefault(pathname: string | null): DuoScope {
  const path = pathname?.replace(/^\/demo(?=\/)/, "");
  if (path?.startsWith("/insights") || path?.startsWith("/achievements")) {
    return DUO_SURFACE_DEFAULTS.insights;
  }
  if (path?.startsWith("/checklist")) {
    return DUO_SURFACE_DEFAULTS.checklist;
  }
  if (path?.startsWith("/calendar") || path === "/goals") {
    return DUO_SURFACE_DEFAULTS.calendar;
  }
  return DUO_SURFACE_DEFAULTS.checklist;
}
