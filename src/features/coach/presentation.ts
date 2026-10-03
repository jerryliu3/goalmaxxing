import type { CoachPage } from "@cadence/shared/coach";
import { coachSurfaceForPath } from "@/lib/coach/surface-registry";

export type CoachMode = "closed" | "companion" | "expanded";
export type CoachView = "conversation" | "rooms" | "understanding" | "check-in" | "changes";
export type CoachPresentation = { mode: CoachMode; view: CoachView };
export type CoachPresentationEvent = { type: "mode"; mode: CoachMode } | { type: "view"; view: CoachView };
export function coachPresentation(state: CoachPresentation, event: CoachPresentationEvent): CoachPresentation {
  return event.type === "mode" ? { ...state, mode: event.mode }
    : { mode: state.mode === "closed" ? "companion" : state.mode, view: event.view };
}
export type CoachPageRegistration = { id: string; path: string; page: Partial<CoachPage>; priority: number };
/** Page owners publish identifiers; opening the companion never changes the source page. */
export function resolveCoachPage(path: string, registrations: CoachPageRegistration[]): CoachPage {
  let page: CoachPage = { surface: coachSurfaceForPath(path), scope: "self", hasDraft: false };
  const active = registrations.filter(entry => entry.path === path).sort((a, b) => a.priority - b.priority);
  for (const entry of active) {
    if (entry.page.surface && entry.page.surface !== page.surface) page = { surface: entry.page.surface, scope: page.scope, hasDraft: page.hasDraft };
    page = { ...page, ...entry.page, hasDraft: page.hasDraft || Boolean(entry.page.hasDraft) };
  }
  return page;
}
