import { describe, expect, it } from "vitest";
import { completionIntent, draftCount, goalProgress, groupSessions, initialStudyState, sessionChangeError, sessionsForGoal, studyReducer } from "./model";
import { SAMPLE_GOALS } from "./sample";

describe("goal-view study workflows", () => {
  it("keeps changed dates in a draft, saves them, and undoes later changes to that saved plan", () => {
    const initial = initialStudyState();
    const session = initial.sessions.find(s => s.id === "half-2")!;
    const edited = studyReducer(initial, { type: "edit", id: session.id, date: "2026-10-03", time: "09:00" });
    expect(draftCount(edited)).toBe(1);
    expect(edited.saved.find(s => s.id === session.id)?.date).toBe("2026-10-02");
    expect(studyReducer(edited, { type: "discard" }).sessions).toEqual(initial.sessions);
    const saved = studyReducer(edited, { type: "save" });
    expect(draftCount(saved)).toBe(0);
    const again = studyReducer(saved, { type: "edit", id: session.id, date: "2026-10-04", time: "09:00" });
    expect(studyReducer(again, { type: "discard" }).sessions.find(s => s.id === session.id)?.date).toBe("2026-10-03");
  });

  it("logs a past session through checklist eligibility and keeps it when date drafts are discarded", () => {
    const initial = initialStudyState();
    const missed = initial.sessions.find(s => s.goalId === "strength" && s.date === "2026-09-30")!;
    expect(completionIntent(missed, initial.facts).allowed).toBe(true);
    const logged = studyReducer(initial, { type: "complete", id: missed.id });
    const edited = studyReducer(logged, { type: "edit", id: "half-2", date: "2026-10-03", time: "07:30" });
    expect(studyReducer(edited, { type: "discard" }).facts).toEqual(logged.facts);
    const undone = studyReducer(logged, { type: "complete", id: missed.id });
    expect(undone.facts).toEqual(initial.facts);
  });

  it("blocks future completion and logging dates whose placement is still a draft", () => {
    const initial = initialStudyState();
    const future = initial.sessions.find(s => s.id === "half-3")!;
    expect(completionIntent(future, initial.facts).disabledReason).toBe("future_creation");
    expect(studyReducer(initial, { type: "complete", id: future.id }).facts).toEqual(initial.facts);
    const draft = studyReducer(initial, { type: "edit", id: "half-2", date: "2026-10-02", time: "09:00" });
    expect(studyReducer(draft, { type: "complete", id: "half-2" }).facts).toEqual(initial.facts);
    expect(studyReducer(studyReducer(draft, { type: "save" }), { type: "complete", id: "half-2" }).facts).toHaveLength(initial.facts.length + 1);
  });

  it("protects locked dates, completion history, goal bounds, duplicate dates and milestone order", () => {
    const state = initialStudyState();
    const error = (id: string, date: string) => sessionChangeError(state.sessions.find(s => s.id === id)!, date, "07:30", state.sessions, state.facts);
    expect(error("half-5", "2026-11-07")).toMatch(/locked/);
    expect(error("half-0", "2026-10-03")).toMatch(/Completed/);
    expect(error("half-2", "2026-11-09")).toMatch(/ends/);
    expect(error("half-2", "2026-10-11")).toMatch(/already/);
    expect(error("half-2", "2026-10-12")).toMatch(/order/);
    expect(error("half-2", "2026-09-29")).toMatch(/today/);
    expect(error("half-2", "2026-02-30")).toMatch(/valid date/);
    expect(error("half-2", "2026-10-03")).toBeNull();
  });

  it("keeps 30 named milestones and ongoing dates discoverable in calendar groups", () => {
    const { sessions } = initialStudyState();
    const portfolio = sessionsForGoal(sessions, "portfolio", "all");
    expect(portfolio).toHaveLength(30);
    expect(portfolio.at(-1)?.milestone).toBe(30);
    const ongoing = sessionsForGoal(sessions, "japanese", "upcoming");
    expect(ongoing.length).toBeGreaterThan(100);
    expect(SAMPLE_GOALS.find(g => g.id === "japanese")?.end_date).toBeNull();
    expect(groupSessions(ongoing, "month").map(g => g.label)).toEqual(["October 2026", "November 2026", "December 2026", "January 2027"]);
  });

  it("reports period progress separately from lifetime milestone progress", () => {
    const { facts } = initialStudyState();
    expect(goalProgress(SAMPLE_GOALS[0], facts)).toMatchObject({ done: 2, target: 6, unit: "milestones" });
    expect(goalProgress(SAMPLE_GOALS[1], facts)).toMatchObject({ done: 1, target: 3, unit: "this week" });
    expect(goalProgress(SAMPLE_GOALS[2], facts)).toMatchObject({ done: 0, target: 1, unit: "today" });
  });
});
