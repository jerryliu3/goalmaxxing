import { describe, expect, it } from "vitest";
import { allChanges, changeIsStale, contextFor, initialState, reducer, replyFor, TODAY } from "./model";

function propose(state = initialState()) {
  return reducer(state, { type: "message", threadId: state.threadId, message: replyFor(state, "Make today lighter", "proposal") });
}

describe("companion interaction model", () => {
  it("keeps page selection, room, history, and drafts through expansion and minimization", () => {
    let state = reducer(initialState(), { type: "select", id: "write-fri" });
    state = reducer(state, { type: "draft", threadId: state.threadId, value: "Can we make room?" });
    for (const value of ["expanded", "minimized", "companion"] as const) state = reducer(state, { type: "mode", value });
    expect(state.selectedSession).toBe("write-fri");
    expect(state.surface).toBe("Plan");
    expect(state.topicId).toBe("week");
    expect(state.threads.find(row => row.id === state.threadId)?.draft).toBe("Can we make room?");
  });

  it("keeps independent drafts and conversations in each room", () => {
    let state = reducer(initialState(), { type: "draft", threadId: "week-main", value: "My week draft" });
    state = reducer(state, { type: "topic", id: "writing" });
    state = reducer(state, { type: "new-thread", id: "new-writing" });
    state = reducer(state, { type: "draft", threadId: "new-writing", value: "A writing draft" });
    state = reducer(state, { type: "message", threadId: "new-writing", message: { id: "first", role: "user", text: "Finding time for a draft" } });
    state = reducer(state, { type: "topic", id: "week" });
    expect(state.threads.find(row => row.id === "week-main")?.draft).toBe("My week draft");
    const writing = state.threads.find(row => row.id === "new-writing")!;
    expect(writing).toMatchObject({ topicId: "writing", title: "Finding time for a draft", draft: "A writing draft" });
    expect(state.threads.find(row => row.id === "writing-main")?.messages).toHaveLength(2);
  });

  it("updates current page context and facts without rewriting conversation snapshots", () => {
    let state = reducer(initialState(), { type: "message", threadId: "week-main", message: replyFor(initialState(), "How is my week?", "snapshot") });
    state = reducer(state, { type: "complete", id: "write-fri" });
    state = reducer(state, { type: "surface", value: "Progress" });
    const facts = contextFor(state);
    expect(facts).toMatchObject({ page: "Progress", purpose: "Understand progress over time", todayDone: 2, weekDone: 7 });
    expect(state.threads[0].messages[0].context).toContain("1/4 today");
    expect(replyFor(state, "How is my week?", "fresh").text).toContain("7 of 12");
  });

  it("changes the same planner data after review and can undo the placement", () => {
    let state = propose();
    const change = allChanges(state)[0];
    expect(state.sessions.find(row => row.id === change.sessionId)?.date).toBe(TODAY);
    state = reducer(state, { type: "change", id: change.id, operation: "apply" });
    expect(state.sessions.find(row => row.id === change.sessionId)).toMatchObject({ date: "2026-10-03", time: "11:00" });
    expect(contextFor(state)).toMatchObject({ todayDone: 1, weekDone: 6, weekTotal: 12 });
    expect(contextFor(state).today).toHaveLength(3);
    state = reducer(state, { type: "change", id: change.id, operation: "undo" });
    expect(state.sessions.find(row => row.id === change.sessionId)).toMatchObject({ date: TODAY, time: "15:00" });
    expect(allChanges(state)[0].status).toBe("undone");
  });

  it("requires refreshed review when work changes after a proposal", () => {
    let state = propose();
    const id = allChanges(state)[0].id;
    state = reducer(state, { type: "complete", id: "strength-fri" });
    expect(changeIsStale(state, allChanges(state)[0])).toBe(true);
    state = reducer(state, { type: "change", id, operation: "apply" });
    expect(state.sessions.find(row => row.id === "write-fri")?.date).toBe(TODAY);
    state = reducer(state, { type: "change", id, operation: "refresh" });
    expect(changeIsStale(state, allChanges(state)[0])).toBe(false);
    state = reducer(state, { type: "change", id, operation: "apply" });
    expect(state.sessions.find(row => row.id === "write-fri")?.date).toBe("2026-10-03");
  });

  it("keeps dismissed changes and completed work unchanged", () => {
    let state = propose();
    const id = allChanges(state)[0].id;
    state = reducer(state, { type: "change", id, operation: "dismiss" });
    state = reducer(state, { type: "change", id, operation: "apply" });
    expect(state.sessions.find(row => row.id === "write-fri")?.date).toBe(TODAY);
    state = propose();
    state = reducer(state, { type: "change", id, operation: "apply" });
    state = reducer(state, { type: "complete", id: "write-fri" });
    state = reducer(state, { type: "change", id, operation: "undo" });
    expect(state.sessions.find(row => row.id === "write-fri")).toMatchObject({ date: "2026-10-03", done: true });
  });

  it("stores exact preferences only after confirmation, scoped to the room", () => {
    let state = reducer(initialState(), { type: "topic", id: "energy" });
    const preference = "Remember: I prefer running in the evening.";
    state = reducer(state, { type: "message", threadId: state.threadId, message: replyFor(state, preference, "memory-message") });
    expect(state.memories).toHaveLength(1);
    state = reducer(state, { type: "memory", threadId: state.threadId, messageId: "memory-message", id: "confirmed" });
    state = reducer(state, { type: "memory", threadId: state.threadId, messageId: "memory-message", id: "duplicate" });
    expect(state.memories).toHaveLength(2);
    expect(state.memories[1]).toMatchObject({ topicId: "energy", text: preference });
    expect(state.sessions).toEqual(initialState().sessions);
    state = reducer(state, { type: "forget", id: "confirmed" });
    expect(state.memories.some(row => row.id === "confirmed")).toBe(false);
    expect(state.threads.find(row => row.id === state.threadId)?.messages.at(-1)?.memorySaved).toBe(false);
  });

  it("reflects recap completion and room goal links in new answers", () => {
    let state = reducer(initialState(), { type: "complete", id: "read-thu" });
    expect(replyFor(state, "Talk through my daily check-in", "recap").text).toContain("2 of 2");
    state = reducer(state, { type: "new-topic", id: "reading", title: "A reading practice" });
    state = reducer(state, { type: "edit-topic", id: "reading", title: "Reading", intention: "A little each day", goals: ["Reading"] });
    expect(replyFor(state, "How am I doing?", "linked").text).toContain("2 linked sessions this week, 1 is complete");
    state = reducer(state, { type: "archive-topic", id: "reading" });
    expect(state.topics.find(row => row.id === "reading")?.archived).toBe(true);
    expect(state.threads.some(row => row.id === "reading-main")).toBe(true);
  });
});
