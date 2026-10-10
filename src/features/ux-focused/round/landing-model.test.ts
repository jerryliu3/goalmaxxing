import { describe, expect, it } from "vitest";
import { initialLesson, lessonReducer, lessonSessions } from "./landing-model";
describe("mobile landing examples", () => {
  it("changes the October target and the visible week consistently", () => {
    const lighter = lessonReducer(initialLesson(), {
      type: "target",
      target: 8,
    });
    expect(lessonSessions(lighter)).toHaveLength(2);
    expect(lessonReducer(lighter, { type: "target", target: 12 }).target).toBe(
      12,
    );
  });
  it("moves only the selected sample work and requires Save; Undo cannot undo a saved plan", () => {
    const initial = initialLesson();
    const moved = lessonReducer(initial, { type: "move" });
    expect(moved.saved).toBe(false);
    expect(lessonSessions(moved).find((s) => s.id === "change")?.date).toBe(
      "2026-10-09",
    );
    expect(lessonSessions(moved).find((s) => s.id === "first")?.date).toBe(
      "2026-10-05",
    );
    expect(lessonReducer(moved, { type: "undo" })).toEqual(initial);
    const saved = lessonReducer(moved, { type: "save" });
    expect(lessonReducer(saved, { type: "undo" })).toBe(saved);
  });
  it("does not grant future or partner completion, or move recorded work", () => {
    const together = initialLesson("together");
    expect(lessonReducer(together, { type: "toggle", id: "second" })).toBe(
      together,
    );
    expect(lessonReducer(together, { type: "toggle", id: "review" })).toBe(
      together,
    );
    const recorded = lessonReducer(initialLesson(), {
      type: "toggle",
      id: "change",
    });
    expect(lessonReducer(recorded, { type: "move" })).toBe(recorded);
    const moved = lessonReducer(initialLesson(), { type: "move" });
    expect(lessonReducer(moved, { type: "toggle", id: "change" })).toBe(moved);
  });
  it("resets the sample on a story change without leaking a different goal’s draft or completions", () => {
    const moved = lessonReducer(initialLesson(), { type: "move" });
    const project = lessonReducer(moved, { type: "story", story: "project" });
    expect(project).toEqual(initialLesson("project"));
    expect(lessonSessions(project).find((s) => s.id === "change")?.title).toBe(
      "Build the rough cut",
    );
  });
});
