import { describe, expect, it } from "vitest";
import { initialStudyState, studyReducer } from "./model";
import { SAMPLE_GOALS } from "./sample";
import { sessionsOnDate, studyCalendarEntry, weaveWeekDates } from "./weave-model";

describe("Time Weave and production Week projection", () => {
  it("uses the week containing the scroll anchor, including month and year boundaries", () => {
    expect(weaveWeekDates("2026-10-02")).toEqual(["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]);
    expect(weaveWeekDates("2027-01-01")).toEqual(["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03"]);
  });

  it("shows the same edited session on its new day before saving in either orientation", () => {
    const initial = initialStudyState();
    const edited = studyReducer(initial, { type: "edit", id: "half-2", date: "2026-10-03", time: "07:30" });
    expect(sessionsOnDate(edited.sessions, "2026-10-02", ["half"])).toHaveLength(0);
    const moved = sessionsOnDate(edited.sessions, "2026-10-03", ["half"])[0];
    expect(studyCalendarEntry(moved, SAMPLE_GOALS[0], edited)).toMatchObject({ key: "half-2", unitKey: "milestone:3", draftDiffKind: "moved_to", draftDiffFromDate: "2026-10-02", draftDiffToDate: "2026-10-03" });
    const saved = studyReducer(edited, { type: "save" });
    expect(studyCalendarEntry(moved, SAMPLE_GOALS[0], saved).draftDiffKind).toBeNull();
  });

  it("keeps day inspection within visible goals and orders timed sessions before anytime work", () => {
    const state = initialStudyState();
    const session = state.sessions.find(s => s.id === "half-2")!;
    const input = [
      { ...session, id: "anytime", time: "" },
      { ...session, id: "later", time: "18:00" },
      { ...session, id: "early", time: "07:30" },
      { ...session, id: "hidden", goalId: "hidden", time: "06:00" },
    ];
    expect(sessionsOnDate(input, session.date, ["half"]).map(s => s.id)).toEqual(["early", "later", "anytime"]);
    expect(input[0].id).toBe("anytime");
    expect(sessionsOnDate(input, "2026-10-03", ["half"])).toHaveLength(0);
  });
});
