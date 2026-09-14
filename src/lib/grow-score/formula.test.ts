import { describe, expect, it } from "vitest";
import {
  GROW_SETTLE_GAIN,
  GROW_SHOCK_GAIN,
  emptyGrowCapState,
  nextGrowLaggedSlope,
  rollGrowCalendarDay,
} from "./formula";
import { buildDailyGrowCredits, buildGrowScoreSeries } from "./series";

describe("nextGrowLaggedSlope", () => {
  it("grows while active and decays when rate goes negative on a stop", () => {
    let score = 0;
    let pace = 0;
    let ema = 0;
    let caps = emptyGrowCapState();

    for (let day = 0; day < 40; day++) {
      caps = rollGrowCalendarDay(caps, day % 7 === 0);
      const step = nextGrowLaggedSlope({
        previous: score,
        rawCredits: 2,
        capState: caps,
        pace,
        ema,
        settleGain: GROW_SETTLE_GAIN,
        shockGain: GROW_SHOCK_GAIN,
      });
      score = step.score;
      pace = step.pace;
      ema = step.ema;
      caps = step.capState;
      expect(step.mode).toBe("earn");
    }
    expect(score).toBeGreaterThan(20);
    expect(pace).toBeGreaterThan(1);

    let sawDecay = false;
    for (let day = 0; day < 40; day++) {
      caps = rollGrowCalendarDay(caps, day % 7 === 0);
      const step = nextGrowLaggedSlope({
        previous: score,
        rawCredits: 0,
        capState: caps,
        pace,
        ema,
        settleGain: GROW_SETTLE_GAIN,
        shockGain: GROW_SHOCK_GAIN,
      });
      if (step.mode === "decay") sawDecay = true;
      score = step.score;
      pace = step.pace;
      ema = step.ema;
      caps = step.capState;
    }
    expect(sawDecay).toBe(true);
  });
});

describe("buildDailyGrowCredits", () => {
  it("weights completions by goal difficulty", () => {
    const daily = buildDailyGrowCredits({
      from: "2026-09-01",
      to: "2026-09-03",
      goals: [
        { id: "easy", difficulty: "easy" },
        { id: "hard", difficulty: "hard" },
      ],
      completions: [
        { goal_id: "easy", completed_on: "2026-09-01" },
        { goal_id: "hard", completed_on: "2026-09-01" },
        { goal_id: "hard", completed_on: "2026-09-02" },
      ],
    });
    expect(daily.get("2026-09-01")).toBeCloseTo(0.75 + 1.5, 8);
    expect(daily.get("2026-09-02")).toBeCloseTo(1.5, 8);
    expect(daily.get("2026-09-03")).toBe(0);
  });
});

describe("buildGrowScoreSeries", () => {
  it("returns the trailing display window and keeps climbing on steady effort", () => {
    const explicit: { goal_id: string; completed_on: string }[] = [];
    for (let i = 0; i < 80; i++) {
      const date = new Date(2026, 5, 1 + i);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      explicit.push({ goal_id: "g1", completed_on: `${y}-${m}-${d}` });
    }

    const series = buildGrowScoreSeries({
      completions: explicit,
      goals: [{ id: "g1", difficulty: "medium" }],
      asOfDate: explicit.at(-1)!.completed_on,
      displayDays: 28,
      warmupDays: 40,
    });

    expect(series).toHaveLength(28);
    expect(series[0]!.date < series.at(-1)!.date).toBe(true);
    expect(series.at(-1)!.score).toBeGreaterThan(series[0]!.score);
  });

  it("keeps score non-decreasing across a 5/day → 1/day downshift", () => {
    const points: { goal_id: string; completed_on: string }[] = [];
    for (let i = 0; i < 90; i++) {
      const date = new Date(2026, 0, 1 + i);
      const stamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const count = i < 50 ? 5 : 1;
      for (let n = 0; n < count; n++) {
        points.push({ goal_id: `g${n}`, completed_on: stamp });
      }
    }
    const goals = Array.from({ length: 5 }, (_, i) => ({
      id: `g${i}`,
      difficulty: "medium" as const,
    }));
    const series = buildGrowScoreSeries({
      completions: points,
      goals,
      asOfDate: points.at(-1)!.completed_on,
      displayDays: 40,
      warmupDays: 50,
    });
    for (let i = 1; i < series.length; i++) {
      expect(series[i]!.score).toBeGreaterThanOrEqual(series[i - 1]!.score - 1e-6);
    }
  });
});
