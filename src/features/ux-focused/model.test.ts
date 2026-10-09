import { describe, expect, it } from "vitest";
import { TEAM_SESSIONS, TODAY, moveSession, weekActivity } from "./model";
describe("focused team sample", () => {
  it("derives partner activity from completed sessions rather than elapsed dates", () => {
    const days = weekActivity(TEAM_SESSIONS);
    expect(days.find((day) => day.date === "2026-10-06")).toMatchObject({
      you: 0,
      partner: 1,
    });
    expect(days.find((day) => day.date === TODAY)).toMatchObject({
      you: 0,
      partner: 1,
      planned: 1,
    });
    expect(days.find((day) => day.date === "2026-10-09")).toMatchObject({
      future: true,
      you: 0,
      partner: 0,
      planned: 1,
    });
    expect(weekActivity([]).every((day) => day.you + day.partner === 0)).toBe(
      true,
    );
  });
  it("moves only your unfinished work onto an available date", () => {
    expect(
      moveSession(TEAM_SESSIONS, "f2", "2026-10-09").find((s) => s.id === "f2")
        ?.date,
    ).toBe("2026-10-09");
    expect(moveSession(TEAM_SESSIONS, "r4", "2026-10-09")).toEqual(
      TEAM_SESSIONS,
    );
    expect(moveSession(TEAM_SESSIONS, "f2", "2026-10-01")).toEqual(
      TEAM_SESSIONS,
    );
  });
});
