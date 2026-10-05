import { describe, expect, it } from "vitest";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";
import { buildGoal } from "@/lib/goals/goal-test-fixtures";
import type { Goal } from "@/lib/goals/types";
import {
  buildGoalViewSessions,
  buildGoalViewWindow,
  groupSessions,
  listWindowDays,
  selectGoalViewGoals,
  sessionOrdinals,
  sessionsForGoal,
  type GoalViewSession,
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

describe("sessionOrdinals", () => {
  const at = (goalId: string, date: string, unitKey: string) =>
    ({ key: `${goalId}:${date}`, goalId, date, time: "", entry: { unitKey } }) as GoalViewSession;
  const weekly = buildGoal({
    id: "run",
    frequency_type: "recurring",
    target_basis: "period",
    recurrence_interval: "weekly",
    target_count: 3,
    start_date: "2026-09-01",
  });

  it("numbers cadence sessions by their slot in the period", () => {
    const ordinals = sessionOrdinals(
      [weekly],
      [at("run", "2026-10-07", "cadence:2026-10-05:2"), at("run", "2026-10-05", "cadence:2026-10-05:1")],
      1
    );
    expect(ordinals.get("run:2026-10-05")).toBe("1 of 3 per week");
    expect(ordinals.get("run:2026-10-07")).toBe("2 of 3 per week");
  });

  it("counts a session's place in its period when the key has no slot", () => {
    const ordinals = sessionOrdinals(
      [weekly],
      [
        at("run", "2026-10-05", "cadence:2026-10-05"),
        at("run", "2026-10-08", "cadence:2026-10-08"),
        // Monday starts the next week, so the count starts again.
        at("run", "2026-10-12", "cadence:2026-10-12"),
      ],
      1
    );
    expect([...ordinals.values()]).toEqual(["1 of 3 per week", "2 of 3 per week", "1 of 3 per week"]);
  });

  it("counts toward a lifetime total or a milestone sequence", () => {
    const total = buildGoal({ id: "read", frequency_type: "recurring", target_basis: "lifetime", target_count: 30 });
    const steps = buildGoal({ id: "book", frequency_type: "fixed_milestones", target_count: 5 });
    const ordinals = sessionOrdinals(
      [total, steps],
      [at("read", "2026-10-05", "total:12"), at("book", "2026-10-06", "milestone:2")],
      1
    );
    expect(ordinals.get("read:2026-10-05")).toBe("12 of 30");
    expect(ordinals.get("book:2026-10-06")).toBe("2 of 5");
  });

  it("counts periods for a goal with one session each", () => {
    // Weekly from Tuesday Sep 1; Monday-start weeks make Oct 5 week 6.
    const once = buildGoal({ ...weekly, id: "once", target_count: 1 });
    const daily = buildGoal({ ...weekly, id: "daily", recurrence_interval: "daily", target_count: 1 });
    const ordinals = sessionOrdinals(
      [once, daily],
      [at("once", "2026-10-05", "cadence:2026-10-05:1"), at("daily", "2026-09-03", "cadence:2026-09-03:1")],
      1
    );
    expect(ordinals.get("once:2026-10-05")).toBe("Week 6");
    expect(ordinals.get("daily:2026-09-03")).toBe("Day 3");
  });

  it("goes by the session's unit, not just the goal's settings", () => {
    // Settings that read "49 per day", on an item that fills a lifetime total
    // without a number: nothing honest to count.
    const reading = buildGoal({ ...weekly, id: "read", recurrence_interval: "daily", target_count: 49 });
    expect(sessionOrdinals([reading], [at("read", "2026-10-05", "deadline:2026-10-05")], 1).size).toBe(0);
  });
});
