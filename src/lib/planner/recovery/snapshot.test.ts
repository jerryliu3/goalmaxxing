import { describe, expect, it } from "vitest";
import { buildGoal } from "@/lib/goals/goal-test-fixtures";
import { getAnchoredPeriod } from "@/lib/goals/periods";
import { cadenceUnitKey } from "@/lib/goals/target-basis";
import type { Completion } from "@/lib/goals/types";
import { findRecoverable } from "@/lib/planner/recovery/model";
import {
  annotatePlannerSessions,
  buildRecoverySnapshot,
  type AnnotatedPlannerSession,
} from "@/lib/planner/recovery/snapshot";

const TODAY = "2026-10-07";
const RUN_ID = "11111111-1111-4111-8111-111111111111";

const run = buildGoal({
  id: RUN_ID,
  title: "Run",
  frequency_type: "recurring",
  recurrence_interval: "weekly",
  target_count: 3,
  target_basis: "period",
  start_date: "2026-09-28",
});

function annotated(
  date: string,
  overrides: Partial<AnnotatedPlannerSession> = {}
): AnnotatedPlannerSession {
  return {
    goalId: RUN_ID,
    unitKey: `unit-${date}`,
    date,
    locked: false,
    credited: false,
    creditWindowEnd: "2026-10-11",
    requirementKind: "cadence",
    label: "Session 1 of 3",
    ...overrides,
  };
}

function completion(date: string): Completion {
  return {
    id: `completion-${date}`,
    goal_id: RUN_ID,
    user_id: "user-1",
    completed_on: date,
    planner_unit_key: null,
    source: "manual",
    created_at: `${date}T12:00:00.000Z`,
  };
}

function snapshot(sessions: AnnotatedPlannerSession[], overrides: Partial<Parameters<typeof buildRecoverySnapshot>[0]> = {}) {
  return buildRecoverySnapshot({
    goals: [run],
    sessions,
    completions: [],
    dismissals: [],
    restWeekdays: [0],
    blackoutRanges: [],
    today: TODAY,
    ...overrides,
  });
}

describe("buildRecoverySnapshot", () => {
  it("offers an uncredited miss whose credit week still includes today", () => {
    const result = snapshot([annotated("2026-10-05"), annotated("2026-10-09")]);

    expect(result.sessions).toEqual([
      expect.objectContaining({ id: `${RUN_ID}:2026-10-05`, status: "missed", windowEnd: "2026-10-11" }),
      expect.objectContaining({ id: `${RUN_ID}:2026-10-09`, status: "scheduled", windowEnd: null }),
    ]);
    expect(findRecoverable(result)).toHaveLength(1);
  });

  it("produces nothing for a past-period cadence miss", () => {
    const result = snapshot([annotated("2026-10-02", { creditWindowEnd: "2026-10-04" })]);

    expect(result.sessions).toEqual([]);
    expect(findRecoverable(result)).toEqual([]);
  });

  it("skips credited, locked, and let-go misses", () => {
    const result = snapshot(
      [
        annotated("2026-10-05", { credited: true }),
        annotated("2026-10-06", { locked: true }),
        annotated("2026-10-04", { creditWindowEnd: "2026-10-11" }),
      ],
      { dismissals: [{ goalId: RUN_ID, missedOn: "2026-10-04" }] }
    );

    expect(findRecoverable(result)).toEqual([]);
  });

  it("caps the window at the goal's end", () => {
    const result = snapshot([annotated("2026-10-05")], {
      goals: [{ ...run, end_date: "2026-10-08" }],
    });

    expect(result.sessions[0]?.windowEnd).toBe("2026-10-08");
  });

  it("drops archived goals and keeps rest days off daily goals", () => {
    const daily = buildGoal({ id: "22222222-2222-4222-8222-222222222222", recurrence_interval: "daily" });
    const archived = buildGoal({ id: "33333333-3333-4333-8333-333333333333", archived_at: "2026-10-01T00:00:00Z" });
    const result = snapshot(
      [
        annotated("2026-10-08"),
        annotated("2026-10-08", { goalId: daily.id }),
        annotated("2026-10-05", { goalId: archived.id }),
      ],
      { goals: [run, daily, archived] }
    );

    expect(result.goals.map((goal) => [goal.id, goal.restDays])).toEqual([
      [RUN_ID, [0]],
      [daily.id, []],
    ]);
    expect(result.sessions.some((session) => session.goalId === archived.id)).toBe(false);
  });

  it("marks future days that already hold a completion", () => {
    const result = snapshot([annotated("2026-10-09")], {
      completions: [completion("2026-10-05"), completion("2026-10-08")],
    });

    expect(result.goals[0]?.completedDates).toEqual(["2026-10-08"]);
  });
});

describe("annotatePlannerSessions", () => {
  it("credits a session done on another day of its week", () => {
    const period = getAnchoredPeriod(run.start_date, "weekly", "2026-10-05", { weekStartsOn: 1 });
    const sessions = annotatePlannerSessions({
      goals: [run],
      completions: [completion("2026-10-06")],
      items: [
        { goal_id: RUN_ID, unit_key: cadenceUnitKey(period.periodKey, 1), scheduled_date: "2026-10-05", locked: false },
        { goal_id: RUN_ID, unit_key: cadenceUnitKey(period.periodKey, 2), scheduled_date: "2026-10-09", locked: false },
      ],
      asOfDate: TODAY,
      weekStartsOn: 1,
    });

    expect(sessions.filter((session) => session.credited)).toHaveLength(1);
    expect(sessions.every((session) => session.creditWindowEnd === period.end)).toBe(true);
    expect(sessions.map((session) => session.label)).toEqual(["Session 1 of 3", "Session 2 of 3"]);
  });
});
