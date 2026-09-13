import { describe, expect, it } from "vitest";
import {
  DEFAULT_ACCEL_GAIN,
  DEFAULT_CAPS,
  DEFAULT_RECOVERY_BIAS,
  DEFAULT_SHOCK_GAIN,
  applyEarnCaps,
  emptyCapState,
  nextBaselineScore,
  nextGraceDecay,
  nextLaggedSlope,
  nextPaceLine,
  rollCalendarDay,
  simulateScore,
  type StepInput,
} from "./formulas";

function baseInput(overrides: Partial<StepInput> = {}): StepInput {
  return {
    previous: 100,
    rawCredits: 0,
    halfLife: 28,
    caps: DEFAULT_CAPS,
    capState: emptyCapState(),
    pace: 0,
    ema: 0,
    idleStreak: 0,
    graceDays: 2,
    paceAlpha: 1 - 2 ** (-1 / 14),
    accelGain: DEFAULT_ACCEL_GAIN,
    shockGain: DEFAULT_SHOCK_GAIN,
    recoveryBias: DEFAULT_RECOVERY_BIAS,
    ...overrides,
  };
}

describe("absolute earn caps", () => {
  it("clips a single day to the daily cap and tracks week/month windows", () => {
    const first = applyEarnCaps(8, emptyCapState());
    expect(first.earned).toBe(5);
    expect(first.next.dayEarned).toBe(5);
    expect(first.next.weekEarned).toBe(5);

    const second = applyEarnCaps(3, first.next);
    expect(second.earned).toBe(0);
  });

  it("enforces the weekly cap even when daily room remains", () => {
    let state = emptyCapState();
    for (let day = 0; day < 7; day++) {
      state = { ...state, dayEarned: 0 };
      const step = applyEarnCaps(5, state);
      state = step.next;
    }
    expect(state.weekEarned).toBe(35);
    state = { ...state, dayEarned: 0 };
    expect(applyEarnCaps(1, state).earned).toBe(0);
  });
});

describe("baseline Grow copy", () => {
  it("halves after 28 idle days and stays within 0–100", () => {
    let score = 64;
    for (let day = 0; day < 28; day++) score = nextBaselineScore(score, 0);
    expect(score).toBeCloseTo(32, 8);
    expect(nextBaselineScore(50, 100)).toBe(nextBaselineScore(50, 3));
    expect(nextBaselineScore(100, 3)).toBe(100);
  });
});

describe("pace line", () => {
  it("grows linearly with capped credits and decays only when idle", () => {
    const earn = nextPaceLine(baseInput({ previous: 10, rawCredits: 2 }));
    expect(earn.score).toBe(12);
    expect(earn.mode).toBe("earn");

    const spam = nextPaceLine(baseInput({ previous: 10, rawCredits: 40 }));
    expect(spam.earned).toBe(5);
    expect(spam.score).toBe(15);

    const idle = nextPaceLine(baseInput({ previous: 64, rawCredits: 0 }));
    expect(idle.mode).toBe("decay");
    expect(idle.score).toBeCloseTo(64 * 2 ** (-1 / 28), 8);
  });
});

describe("lagged slope acceleration model", () => {
  it("settles toward linear growth when activity matches the EMA", () => {
    let score = 0;
    let pace = 0;
    let ema = 0;
    let idle = 0;
    let caps = emptyCapState();
    let lastAccel = 1;

    for (let day = 0; day < 60; day++) {
      caps = rollCalendarDay(caps, day);
      const step = nextLaggedSlope(
        baseInput({
          previous: score,
          rawCredits: 2,
          pace,
          ema,
          idleStreak: idle,
          capState: caps,
        }),
      );
      score = step.score;
      pace = step.pace;
      ema = step.ema;
      idle = step.idleStreak;
      caps = step.capState;
      lastAccel = step.accel;
      expect(step.mode).toBe("earn");
    }

    expect(pace).toBeGreaterThan(1.5);
    expect(pace).toBeLessThan(2.4);
    expect(Math.abs(lastAccel)).toBeLessThan(0.08);
  });

  it("lets a short rest soften the rate without requiring decay", () => {
    const rested = nextLaggedSlope(
      baseInput({
        previous: 200,
        rawCredits: 0,
        pace: 2,
        ema: 2,
        idleStreak: 0,
      }),
    );
    expect(rested.mode).toBe("earn");
    expect(rested.score).toBeGreaterThan(200);
    expect(rested.pace).toBeLessThan(2);
    expect(rested.pace).toBeGreaterThan(0);
    expect(rested.accel).toBeLessThan(0);
  });

  it("lets the growth rate go negative on continued inactivity", () => {
    let score = 200;
    let pace = 2;
    let ema = 2;
    let idle = 0;
    let caps = emptyCapState();
    let sawNegativeRate = false;
    let sawDecay = false;

    for (let day = 0; day < 30; day++) {
      caps = rollCalendarDay(caps, day);
      const step = nextLaggedSlope(
        baseInput({
          previous: score,
          rawCredits: 0,
          pace,
          ema,
          idleStreak: idle,
          capState: caps,
        }),
      );
      if (step.pace < 0) sawNegativeRate = true;
      if (step.mode === "decay") sawDecay = true;
      score = step.score;
      pace = step.pace;
      ema = step.ema;
      idle = step.idleStreak;
      caps = step.capState;
    }

    expect(sawNegativeRate).toBe(true);
    expect(sawDecay).toBe(true);
    expect(score).toBeLessThan(200);
  });

  it("settles a negative rate back toward zero while decaying", () => {
    const step = nextLaggedSlope(
      baseInput({
        previous: 100,
        rawCredits: 0,
        pace: -1.2,
        ema: 0.1,
        halfLife: 28,
      }),
    );
    expect(step.mode).toBe("decay");
    expect(step.score).toBeCloseTo(100 * 2 ** (-1 / 28), 8);
    expect(step.pace).toBeGreaterThan(-1.2);
    expect(step.pace).toBeLessThan(0);
  });

  it("biases recovery when rate is negative", () => {
    const plain = nextLaggedSlope(
      baseInput({
        previous: 50,
        rawCredits: 3,
        pace: -1,
        ema: 0.5,
        recoveryBias: 1,
      }),
    );
    const boosted = nextLaggedSlope(
      baseInput({
        previous: 50,
        rawCredits: 3,
        pace: -1,
        ema: 0.5,
        recoveryBias: 2.5,
      }),
    );
    expect(boosted.accel).toBeGreaterThan(plain.accel);
    expect(boosted.pace).toBeGreaterThan(plain.pace);
  });

  it("keeps accelerating while frequency keeps rising, then consolidates", () => {
    const ramp = simulateScore({
      formula: "lagged-slope",
      daysPerWeek: 7,
      completions: 5,
      difficulty: "medium",
      halfLife: 28,
      breakDays: 0,
      historyDays: 21,
      forecastDays: 56,
    });
    expect(ramp.dailyRateProjected).toBeGreaterThan(ramp.dailyRateNow);
    expect(ramp.projected).toBeGreaterThan(ramp.current);
    expect(Math.abs(ramp.accelProjected)).toBeLessThan(0.15);
  });

  it("keeps score climbing on a hard downshift to 1/day with locked defaults", () => {
    let score = 0;
    let pace = 0;
    let ema = 0;
    let idle = 0;
    let caps = emptyCapState();
    let switchScore = 0;

    for (let day = 0; day < 120; day++) {
      caps = rollCalendarDay(caps, day);
      const step = nextLaggedSlope(
        baseInput({
          previous: score,
          rawCredits: day < 60 ? 7 : 1,
          pace,
          ema,
          idleStreak: idle,
          capState: caps,
        }),
      );
      if (day === 59) switchScore = step.score;
      if (day >= 60) {
        expect(step.pace).toBeGreaterThan(0);
        expect(step.score).toBeGreaterThanOrEqual(switchScore - 1e-9);
        expect(step.mode).toBe("earn");
      }
      score = step.score;
      pace = step.pace;
      ema = step.ema;
      idle = step.idleStreak;
      caps = step.capState;
    }
    expect(score).toBeGreaterThan(switchScore);
  });
});

describe("grace decay", () => {
  it("holds through grace, then decays", () => {
    const day1 = nextGraceDecay(
      baseInput({ previous: 80, rawCredits: 0, idleStreak: 0, graceDays: 2 }),
    );
    expect(day1.mode).toBe("hold");
    expect(day1.score).toBe(80);

    const day2 = nextGraceDecay(
      baseInput({
        previous: 80,
        rawCredits: 0,
        idleStreak: day1.idleStreak,
        graceDays: 2,
      }),
    );
    expect(day2.mode).toBe("hold");

    const day3 = nextGraceDecay(
      baseInput({
        previous: 80,
        rawCredits: 0,
        idleStreak: day2.idleStreak,
        graceDays: 2,
      }),
    );
    expect(day3.mode).toBe("decay");
    expect(day3.score).toBeLessThan(80);
  });
});

describe("simulateScore comparisons", () => {
  it("lets unbounded formulas exceed 100 under sustained pace", () => {
    const shared = {
      daysPerWeek: 7,
      completions: 5,
      difficulty: "medium" as const,
      halfLife: 28,
      breakDays: 0,
    };
    const baseline = simulateScore({ ...shared, formula: "baseline" });
    const pace = simulateScore({ ...shared, formula: "pace-line" });
    expect(baseline.projected).toBeLessThanOrEqual(100);
    expect(pace.projected).toBeGreaterThan(100);
    expect(pace.projected).toBeGreaterThan(baseline.projected);
  });

  it("slows the slope when daily effort drops without requiring a full stop", () => {
    const high = simulateScore({
      formula: "lagged-slope",
      daysPerWeek: 7,
      completions: 5,
      difficulty: "medium",
      halfLife: 28,
      breakDays: 0,
    });
    const low = simulateScore({
      formula: "lagged-slope",
      daysPerWeek: 7,
      completions: 1,
      difficulty: "medium",
      halfLife: 28,
      breakDays: 0,
    });
    expect(high.projected - high.current).toBeGreaterThan(
      low.projected - low.current,
    );
    expect(low.projected).toBeGreaterThan(low.current);
  });

  it("drives rate negative and declines score across a full stop", () => {
    const rest = simulateScore({
      formula: "lagged-slope",
      daysPerWeek: 0,
      completions: 0,
      difficulty: "medium",
      halfLife: 28,
      breakDays: 56,
    });
    expect(Math.min(...rest.rateForecast)).toBeLessThan(0);
    expect(rest.projected).toBeLessThan(rest.current);
  });
});
