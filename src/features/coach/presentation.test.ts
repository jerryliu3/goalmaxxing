import { describe, expect, it } from "vitest";
import { coachPresentation, resolveCoachPage, type CoachPageRegistration } from "./presentation";

describe("coach presentation and page ownership", () => {
  it("expands and contracts without losing the current view", () => {
    const initial = { mode: "companion" as const, view: "understanding" as const };
    const expanded = coachPresentation(initial, { type: "mode", mode: "expanded" });
    expect(expanded).toEqual({ mode: "expanded", view: "understanding" });
    expect(coachPresentation(expanded, { type: "mode", mode: "closed" }).view).toBe("understanding");
  });
  it("opens a requested view without collapsing the expanded workspace", () => {
    expect(coachPresentation({ mode: "closed", view: "conversation" }, { type: "view", view: "check-in" }).mode).toBe("companion");
    expect(coachPresentation({ mode: "expanded", view: "conversation" }, { type: "view", view: "rooms" }).mode).toBe("expanded");
  });
  it("an editor overrides selection but preserves planner draft protection", () => {
    const registrations: CoachPageRegistration[] = [
      { id: "plan", path: "/calendar", priority: 0, page: { surface: "plan", selectedDate: "2026-10-02", selectedItemId: "old-item", scope: "duo", hasDraft: true } },
      { id: "editor", path: "/calendar", priority: 10, page: { surface: "goal", selectedGoalId: "editing-goal" } },
    ];
    expect(resolveCoachPage("/calendar", registrations)).toEqual({ surface: "goal", selectedGoalId: "editing-goal", scope: "duo", hasDraft: true });
    expect(resolveCoachPage("/calendar", registrations.filter(row => row.id !== "editor"))).toMatchObject({ surface: "plan", selectedItemId: "old-item", selectedDate: "2026-10-02", hasDraft: true });
  });
  it("leaving a page discards its selections and inferred draft state", () => {
    expect(resolveCoachPage("/settings", [{ id: "plan", path: "/calendar", priority: 0, page: { selectedDate: "2026-10-02", hasDraft: true } }])).toEqual({ surface: "you", scope: "self", hasDraft: false });
  });
  it("viewer selections augment the shared Duo scope", () => {
    expect(resolveCoachPage("/insights", [
      { id: "shell", path: "/insights", priority: 0, page: { surface: "progress", scope: "duo" } },
      { id: "viewer", path: "/insights", priority: 1, page: { selectedGoalId: "own-goal", selectedDate: "2026-10-02" } },
    ])).toMatchObject({ scope: "duo", selectedGoalId: "own-goal" });
  });
});
