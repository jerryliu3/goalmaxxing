import { describe, expect, it } from "vitest";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";
import type { Goal } from "@/lib/goals/types";
import {
  buildGoalViewSessions,
  buildGoalViewWindow,
  groupSessions,
  listWindowDays,
  selectGoalViewGoals,
  sessionsForGoal,
} from "./goal-view-model";

function entry(
  key: string,
  goalId: string,
  patch: Partial<PlannerDayDetailEntry> = {}
): PlannerDayDetailEntry {
  return {
    key,
    originalGoalId: goalId,
    goalTitle: `Goal ${goalId}`,
    unitKey: "cadence:1",
    label: null,
    classification: "open",
    creditState: "uncredited",
    activeGoal: null,
    activeItem: null,
    draftDiffKind: null,
    draftDiffFromDate: null,
    draftDiffToDate: null,
    draftGhost: false,
    ...patch,
  };
}

const goal = (id: string, title: string) => ({ id, title }) as Goal;

describe("Goal View window", () => {
  it("covers exactly 90 days around the leading date", () => {
    const window = buildGoalViewWindow("2026-10-02");
    expect(window).toEqual({ start: "2026-09-11", end: "2026-12-09" });
    expect(listWindowDays(window)).toHaveLength(90);
  });
});

describe("buildGoalViewSessions", () => {
  const byDay: Record<string, PlannerDayDetailEntry[]> = {
    "2026-10-02": [
      entry("a", "run", {
        unitKey: "milestone:3",
        label: "Find your pace",
        effectiveScheduledLocalTime: "07:30",
        creditState: "completed_as_scheduled",
      }),
      entry("ghost", "run", { draftGhost: true }),
      entry("task", "t1", { entryKind: "task" }),
    ],
    "2026-10-03": [
      entry("b", "run", { draftDiffKind: "moved" as never }),
    ],
  };
  const sessions = buildGoalViewSessions(
    ["2026-10-02", "2026-10-03"],
    (day) => byDay[day] ?? []
  );

  it("skips draft ghosts and tasks", () => {
    expect(sessions.map((session) => session.key)).toEqual(["a", "b"]);
  });

  it("derives milestone, time, completion and draft state", () => {
    expect(sessions[0]).toMatchObject({
      goalId: "run",
      date: "2026-10-02",
      time: "07:30",
      label: "Find your pace",
      milestone: 3,
      done: true,
      draft: false,
    });
    expect(sessions[1]).toMatchObject({ milestone: null, done: false, draft: true });
  });
});

describe("goal session selectors", () => {
  const sessions = buildGoalViewSessions(
    ["2026-09-28", "2026-10-02", "2026-10-09", "2026-11-03"],
    (day) => [entry(`run-${day}`, "run"), entry(`gym-${day}`, "gym")]
  );

  it("hides past sessions unless asked, sorted by date", () => {
    const upcoming = sessionsForGoal(sessions, "run", false, "2026-10-02");
    expect(upcoming.map((session) => session.date)).toEqual([
      "2026-10-02",
      "2026-10-09",
      "2026-11-03",
    ]);
    expect(sessionsForGoal(sessions, "run", true, "2026-10-02")).toHaveLength(4);
  });

  it("keeps the planner's goal order and drops goals without sessions", () => {
    const goals = selectGoalViewGoals(
      [goal("gym", "Gym"), goal("idle", "Idle"), goal("run", "Run")],
      sessions,
      { showPast: true, today: "2026-10-02" }
    );
    expect(goals.map((g) => g.id)).toEqual(["gym", "run"]);
  });

  it("hides ended goals and goals with only past sessions unless past sessions are shown", () => {
    const pastOnly = buildGoalViewSessions(["2026-09-28"], () => [
      entry("past", "past"),
    ]);
    const mixed = [...sessions, ...pastOnly];
    const ended = { ...goal("ended", "Ended"), end_date: "2026-09-30" } as Goal;
    const goals = [goal("run", "Run"), goal("past", "Past"), ended];
    const withEnded = [...mixed, ...buildGoalViewSessions(["2026-09-28"], () => [entry("e", "ended")])];
    const today = "2026-10-02";
    expect(
      selectGoalViewGoals(goals, withEnded, { showPast: false, today }).map((g) => g.id)
    ).toEqual(["run"]);
    expect(
      selectGoalViewGoals(goals, withEnded, { showPast: true, today }).map((g) => g.id)
    ).toEqual(["run", "past", "ended"]);
  });

  it("groups by planner week start", () => {
    const all = sessionsForGoal(sessions, "run", true, "2026-10-02");
    const monday = groupSessions(all, 1);
    expect(monday.map((group) => group.date)).toEqual([
      "2026-09-28",
      "2026-10-05",
      "2026-11-02",
    ]);
    expect(monday[0].label).toBe("Week of Sep 28");
    expect(groupSessions(all, 0)[0].date).toBe("2026-09-27");
  });
});
