import { describe, expect, it } from "vitest";
import type { RecoveryGoal, RecoverySession } from "@/lib/planner/recovery/contract";
import {
  findRecoverable,
  goalPlanMoves,
  recoveryPromptText,
  REBALANCE_REASON,
  suggest,
  windowLabel,
  type RecoverySeed,
  type SeedSession,
} from "@/lib/planner/recovery/model";

// Wed Oct 7 2026; the credit week runs Mon Oct 5 – Sun Oct 11.
const TODAY = "2026-10-07";

function goal(id: string, overrides: Partial<RecoveryGoal> = {}): RecoveryGoal {
  return {
    id,
    title: id,
    kind: "cadence",
    interval: "weekly",
    endDate: null,
    restDays: [],
    completedDates: [],
    ...overrides,
  };
}

function session(
  goalId: string,
  date: string,
  status: RecoverySession["status"] = "scheduled",
  overrides: Partial<SeedSession> = {}
): SeedSession {
  return {
    id: `${goalId}:${date}`,
    goalId,
    unitKey: `${goalId}-${date}`,
    date,
    label: "Session",
    status,
    locked: false,
    windowEnd: status === "missed" ? "2026-10-11" : null,
    ...overrides,
  };
}

function seed(goals: RecoveryGoal[], sessions: SeedSession[], overrides: Partial<RecoverySeed> = {}): RecoverySeed {
  return {
    today: TODAY,
    horizonEnd: "2026-11-17",
    blackoutRanges: [],
    goals,
    sessions,
    ...overrides,
  };
}

describe("findRecoverable", () => {
  it("returns only missed sessions whose window still includes today, tightest first", () => {
    const recoverable = findRecoverable(
      seed(
        [goal("books", { kind: "deadline_total", interval: null }), goal("run")],
        [
          session("books", "2026-10-03", "missed", { windowEnd: "2026-12-31" }),
          session("run", "2026-10-05", "missed"),
          session("run", "2026-10-06", "missed", { windowEnd: "2026-10-06" }),
          session("run", "2026-10-09"),
        ]
      )
    );

    expect(recoverable.map((item) => item.session.id)).toEqual([
      "run:2026-10-05",
      "books:2026-10-03",
    ]);
  });
});

describe("suggest (just the missed session)", () => {
  it("may land after the goal's next scheduled session", () => {
    const plan = suggest(
      seed(
        [goal("run")],
        [
          session("run", "2026-10-05", "missed"),
          session("run", "2026-10-07"),
          session("run", "2026-10-09"),
        ]
      )
    );

    expect(plan.rows).toHaveLength(1);
    expect(plan.rows[0]).toMatchObject({
      date: "2026-10-08",
      reason: "First open day — today already has a session.",
    });
  });

  it("never suggests a day in the past", () => {
    const plan = suggest(seed([goal("run")], [session("run", "2026-10-05", "missed")]));

    expect(plan.rows[0]?.date).toBe(TODAY);
    expect(plan.rows[0]?.options[0]?.date).toBe(TODAY);
    expect(plan.rows[0]?.options.every((option) => option.date >= TODAY)).toBe(true);
  });

  it("avoids rest days and blackout days, and says why", () => {
    const plan = suggest(
      seed(
        [goal("yoga", { restDays: [4] })],
        [
          session("yoga", "2026-10-06", "missed"),
          session("yoga", "2026-10-07"),
          session("yoga", "2026-10-10"),
        ],
        { blackoutRanges: [{ start: "2026-10-09", end: "2026-10-09" }] }
      )
    );

    expect(plan.rows[0]).toMatchObject({
      date: "2026-10-11",
      reason:
        "First open day — today and Sat already have a session; tomorrow and Fri are rest days.",
    });
  });

  it("falls back to a rest day only when nothing else is open", () => {
    const plan = suggest(
      seed(
        [goal("yoga", { restDays: [0, 4, 5, 6] })],
        [session("yoga", "2026-10-06", "missed"), session("yoga", "2026-10-07")]
      )
    );

    expect(plan.rows[0]).toMatchObject({
      date: "2026-10-08",
      rest: true,
      reason: "Only rest days are open — tomorrow is the earliest.",
    });
  });

  it("treats a day that already holds a completion as taken", () => {
    const plan = suggest(
      seed(
        [goal("run", { completedDates: ["2026-10-07"] })],
        [session("run", "2026-10-05", "missed")]
      )
    );

    expect(plan.rows[0]?.date).toBe("2026-10-08");
  });

  it("gives an honest reason when the window has no room", () => {
    const plan = suggest(
      seed(
        [goal("guitar")],
        [
          session("guitar", "2026-10-06", "missed"),
          ...["07", "08", "09", "10", "11"].map((day) => session("guitar", `2026-10-${day}`)),
        ]
      )
    );

    expect(plan.rows[0]?.date).toBeNull();
    expect(plan.rows[0]?.reason).toBe(
      "This week has no open day left. 5 days already have a session."
    );
  });

  it("does not cap how many goals share a day", () => {
    const goals = ["a", "b", "c", "d"].map((id) => goal(id));
    const plan = suggest(seed(goals, goals.map((item) => session(item.id, "2026-10-05", "missed"))));

    expect(plan.rows.map((row) => row.date)).toEqual([TODAY, TODAY, TODAY, TODAY]);
  });

  it("keeps two slipped sessions of one goal on different days", () => {
    const plan = suggest(
      seed(
        [goal("run")],
        [session("run", "2026-10-05", "missed"), session("run", "2026-10-06", "missed")]
      )
    );

    expect(plan.rows.map((row) => row.date)).toEqual([TODAY, "2026-10-08"]);
  });
});

describe("suggest (Auto-rebalance)", () => {
  const books = goal("books", { kind: "deadline_total", interval: null, endDate: "2026-10-20" });
  const rebalanceSeed = seed(
    [books],
    [
      session("books", "2026-10-03", "missed", { windowEnd: "2026-10-20" }),
      session("books", "2026-10-08"),
      session("books", "2026-10-09"),
    ]
  );

  it("spreads the goal's later sessions evenly and lists every shift", () => {
    const plan = suggest(rebalanceSeed, true);
    const goalPlan = plan.goals[0]!;

    expect(goalPlan.strategy).toBe("rebalance");
    expect(goalPlan.rows[0]).toMatchObject({ date: "2026-10-09", reason: REBALANCE_REASON });
    expect(goalPlan.shifts).toEqual([
      { sessionId: "books:2026-10-08", label: "Session", from: "2026-10-08", to: "2026-10-14" },
      { sessionId: "books:2026-10-09", label: "Session", from: "2026-10-09", to: "2026-10-18" },
    ]);
    expect(goalPlanMoves(goalPlan)).toEqual([
      { sessionId: "books:2026-10-03", to: "2026-10-09" },
      { sessionId: "books:2026-10-08", to: "2026-10-14" },
      { sessionId: "books:2026-10-09", to: "2026-10-18" },
    ]);
  });

  it("never moves locked sessions or sessions this review already placed", () => {
    const plan = suggest(
      seed(
        [books],
        [
          session("books", "2026-10-02", "missed", { windowEnd: "2026-10-20" }),
          session("books", "2026-10-08", "scheduled", { locked: true }),
          session("books", "2026-10-09", "scheduled", { recoveredFrom: "2026-10-03" }),
        ]
      ),
      true
    );

    expect(plan.goals[0]?.shifts).toEqual([]);
    expect(plan.rows[0]?.date).not.toBe("2026-10-08");
    expect(plan.rows[0]?.date).not.toBe("2026-10-09");
  });

  it("falls back to just the missed session when the window cannot hold the goal", () => {
    const plan = suggest(
      seed(
        [goal("run")],
        [
          session("run", "2026-10-05", "missed"),
          session("run", "2026-10-06", "missed"),
          session("run", "2026-10-07", "done"),
          ...["08", "09", "10"].map((day) => session("run", `2026-10-${day}`)),
        ]
      ),
      true
    );

    expect(plan.goals[0]).toMatchObject({ strategy: "squeeze", shifts: [] });
    expect(plan.goals[0]?.note).not.toBeNull();
    expect(plan.rows.map((row) => row.date)).toEqual(["2026-10-11", null]);
  });
});

describe("copy", () => {
  it("names the window and the count", () => {
    const plan = suggest(seed([goal("run")], [session("run", "2026-10-05", "missed")]));

    expect(windowLabel(plan.goals[0]!)).toBe("Until Sun Oct 11 · this week");
    expect(recoveryPromptText(0)).toBe("Nothing slipped");
    expect(recoveryPromptText(1)).toBe("1 session slipped");
    expect(recoveryPromptText(3)).toBe("3 sessions slipped");
  });
});
