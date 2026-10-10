import { describe, expect, it } from "vitest";
import { focusedVariant } from "../catalog";
import {
  INITIAL_CHECK_IN,
  INITIAL_TEAM_SESSIONS,
  publishCheckIn,
  recordOwnSession,
  teamBrief,
} from "./team-model";
describe("dedicated team study", () => {
  it("routes C distinctly and bounds unsupported alternatives", () => {
    expect(focusedVariant("c", 3)).toBe(2);
    expect(focusedVariant("c", 2)).toBe(0);
    expect(focusedVariant("bad", 3)).toBe(0);
  });
  it("attributes recorded work, excludes future plans and finds the next handoff", () => {
    const brief = teamBrief(INITIAL_TEAM_SESSIONS);
    expect(brief.people.map((p) => p.count)).toEqual([2, 3]);
    expect(brief.next.slice(0, 2).map((s) => s.id)).toEqual(["f2", "f3"]);
    expect(teamBrief([]).recorded).toEqual([]);
  });
  it("cannot record partner work or a future session", () => {
    expect(recordOwnSession(INITIAL_TEAM_SESSIONS, "f3")).toEqual(
      INITIAL_TEAM_SESSIONS,
    );
    expect(recordOwnSession(INITIAL_TEAM_SESSIONS, "r5")).toEqual(
      INITIAL_TEAM_SESSIONS,
    );
    expect(
      recordOwnSession(INITIAL_TEAM_SESSIONS, "f2").find((s) => s.id === "f2")
        ?.done,
    ).toBe(true);
  });
  it("publishes a focus without changing placed work and invalidates a previous acknowledgement", () => {
    expect(
      publishCheckIn({ ...INITIAL_CHECK_IN, focus: "  ", acknowledged: true })
        .published,
    ).toBe(false);
    expect(
      publishCheckIn({ ...INITIAL_CHECK_IN, acknowledged: true }),
    ).toMatchObject({ published: true, acknowledged: false });
  });
});
