/**
 * Study-only Grow score revisions.
 * Does not modify `/ux/journeys` — those files stay on the journeys study branch.
 *
 * Baseline (journeys Grow): capped EMA asymptoting to 100.
 * Revisions: unbounded scores; absolute earn caps per day / week / month.
 *
 * Lagged Slope (leading take): activity drives acceleration (2nd derivative).
 * Maintain your EMA → accel ≈ 0 → constant linear growth.
 * Slow / rest → negative accel → rate falls; it may stay positive (slower climb)
 * or cross below zero (exponential score decay, while rate settles back toward 0).
 * Recovery bias: when rate is negative, positive accel is amplified.
 */

export const DIFFICULTY_WEIGHT = {
  easy: 0.75,
  medium: 1,
  hard: 1.5,
} as const;

export type Difficulty = keyof typeof DIFFICULTY_WEIGHT;

/** Medium-equivalent credits. Anchor: ~5 medium goals / day, forever. */
export const REFERENCE_DAILY_CREDITS = 5;
export const DEFAULT_HALF_LIFE = 28;
export const POINTS_PER_CREDIT = 1;
export const DEFAULT_ACCEL_GAIN = 0.15;
export const DEFAULT_SHOCK_GAIN = 0.2;
export const DEFAULT_RECOVERY_BIAS = 1.5;

export const DEFAULT_CAPS = {
  day: REFERENCE_DAILY_CREDITS,
  week: REFERENCE_DAILY_CREDITS * 7,
  month: REFERENCE_DAILY_CREDITS * 30,
} as const;

export type FormulaId = "baseline" | "pace-line" | "lagged-slope" | "grace-decay";

export const FORMULAS = [
  {
    id: "baseline" as const,
    name: "Baseline Grow",
    number: "00",
    headline: "The capped pulse.",
    summary:
      "Original journeys Grow: exponential moving average, daily cap of 3, hard ceiling at 100.",
    behavior:
      "Consistent effort approaches 100 and stalls. Any quiet day soft-decays. Good readability; no long-horizon growth.",
  },
  {
    id: "pace-line" as const,
    name: "Pace Line",
    number: "01",
    headline: "Earn linearly. Idle decays.",
    summary:
      "Each capped credit adds a fixed point. Slowing lowers the slope. Only zero-credit days decay exponentially.",
    behavior:
      "Five mediums a day forever → +5 / day with no ceiling. Miss a day → half-life decay. Spam is clipped by day/week/month caps.",
  },
  {
    id: "lagged-slope" as const,
    name: "Lagged Slope",
    number: "02",
    headline: "Activity turns acceleration.",
    summary:
      "Credits update an activity EMA. Today vs that average pushes acceleration; a weaker chase settles your growth rate to the average. Hold the EMA → linear climb. Rest softens the slope; enough quiet lets the rate go negative and the score decay exponentially while the rate settles back toward zero.",
    behavior:
      "Weekend rest: rate dips, score can still rise. Full stop: rate crosses below zero, score decays, rate eases back to 0. Keep raising frequency: rate accelerates until the EMA settles, then linear again. Caps bound the EMA and the max |rate|.",
  },
  {
    id: "grace-decay" as const,
    name: "Grace Decay",
    number: "03",
    headline: "Rest without instant fade.",
    summary:
      "Same linear earn as Pace Line, but exponential decay waits for a short grace window so a weekend does not tax the score.",
    behavior:
      "Zero-credit days inside grace: hold. After grace: decay like Pace Line. Slowing (still earning) never decays — only true stops do.",
  },
] as const;

export type CapWindow = {
  day: number;
  week: number;
  month: number;
};

export type CapState = {
  dayEarned: number;
  weekEarned: number;
  /** Rolling 30 calendar days of earned credits (index 0 = oldest). */
  monthWindow: number[];
};

export function emptyCapState(): CapState {
  return { dayEarned: 0, weekEarned: 0, monthWindow: Array(30).fill(0) };
}

export function monthEarned(state: CapState): number {
  return state.monthWindow.reduce((sum, value) => sum + value, 0);
}

export function applyEarnCaps(
  rawCredits: number,
  state: CapState,
  caps: CapWindow = DEFAULT_CAPS,
): { earned: number; next: CapState } {
  const positive = Math.max(0, rawCredits);
  const monthUsed = monthEarned(state);
  const room = Math.min(
    Math.max(0, caps.day - state.dayEarned),
    Math.max(0, caps.week - state.weekEarned),
    Math.max(0, caps.month - monthUsed),
  );
  const earned = Math.min(positive, room);
  const monthWindow = state.monthWindow.slice(1);
  monthWindow.push(earned);
  return {
    earned,
    next: {
      dayEarned: state.dayEarned + earned,
      weekEarned: state.weekEarned + earned,
      monthWindow,
    },
  };
}

export function rollCalendarDay(state: CapState, dayIndex: number): CapState {
  return {
    dayEarned: 0,
    weekEarned: dayIndex % 7 === 0 ? 0 : state.weekEarned,
    monthWindow: state.monthWindow,
  };
}

/** Original journeys Grow formula (study copy; not imported from ux-journeys). */
export function nextBaselineScore(
  previous: number,
  credits: number,
  halfLife = DEFAULT_HALF_LIFE,
  dailyCap = 3,
): number {
  const retention = 2 ** (-1 / halfLife);
  const capped = Math.min(dailyCap, Math.max(0, credits));
  return Math.max(
    0,
    Math.min(
      100,
      retention * previous + ((1 - retention) * 100 * capped) / dailyCap,
    ),
  );
}

export type StepInput = {
  previous: number;
  rawCredits: number;
  halfLife: number;
  caps: CapWindow;
  capState: CapState;
  /**
   * Shared state:
   * - Pace Line / Grace: last earned (display)
   * - Lagged Slope: growth rate v (1st derivative, pts/day)
   */
  pace: number;
  /** Lagged Slope: EMA of capped daily credits (activity level). */
  ema: number;
  /** Grace Decay: consecutive idle days. Lagged Slope: consecutive zero-earn days. */
  idleStreak: number;
  graceDays: number;
  paceAlpha: number;
  /** Chase: how fast rate settles toward the activity EMA. */
  accelGain: number;
  /** Shock: how hard today vs EMA pushes acceleration. */
  shockGain: number;
  /** Comeback boost while rate is negative and accel is positive. */
  recoveryBias: number;
};

export type StepResult = {
  score: number;
  earned: number;
  cappedAway: number;
  /** Growth rate v after this day (pts/day). */
  pace: number;
  ema: number;
  accel: number;
  idleStreak: number;
  capState: CapState;
  mode: "earn" | "hold" | "decay";
};

function retentionFor(halfLife: number) {
  return 2 ** (-1 / halfLife);
}

export function nextPaceLine(input: StepInput): StepResult {
  const { earned, next } = applyEarnCaps(
    input.rawCredits,
    input.capState,
    input.caps,
  );
  const cappedAway = Math.max(0, input.rawCredits) - earned;
  if (earned > 0) {
    return {
      score: input.previous + earned * POINTS_PER_CREDIT,
      earned,
      cappedAway,
      pace: earned,
      ema: earned,
      accel: 0,
      idleStreak: 0,
      capState: next,
      mode: "earn",
    };
  }
  return {
    score: input.previous * retentionFor(input.halfLife),
    earned: 0,
    cappedAway,
    pace: 0,
    ema: 0,
    accel: 0,
    idleStreak: input.idleStreak + 1,
    capState: next,
    mode: "decay",
  };
}

/**
 * Activity → acceleration (2nd derivative) → rate (1st) → score.
 *
 * ema  = EMA(earned)
 * a    = shockGain * (earned - ema)   // today vs your recent average
 *      + accelGain * (ema - rate)     // settle rate toward that average
 *        × recoveryBias when rate < 0 and a > 0
 * rate = rate + a                     // may be negative — no floor at 0
 *
 * if rate > 0:  score += rate                    // linear growth
 * if rate < 0:  score *= retention; rate *= retention
 *               // exponential score decay; rate settles back toward 0
 */
export function nextLaggedSlope(input: StepInput): StepResult {
  const { earned, next } = applyEarnCaps(
    input.rawCredits,
    input.capState,
    input.caps,
  );
  const cappedAway = Math.max(0, input.rawCredits) - earned;

  const ema =
    input.paceAlpha * earned + (1 - input.paceAlpha) * input.ema;

  let accel =
    input.shockGain * (earned - ema) + input.accelGain * (ema - input.pace);
  if (input.pace < 0 && accel > 0) {
    accel *= input.recoveryBias;
  }

  let rate = input.pace + accel;
  const idleStreak = earned <= 0 ? input.idleStreak + 1 : 0;

  // Symmetric bound: rate cannot outrun the absolute daily earn cap either way.
  const rateBound = input.caps.day * POINTS_PER_CREDIT;
  if (rate > rateBound) rate = rateBound;
  if (rate < -rateBound) rate = -rateBound;

  if (rate > 1e-9) {
    return {
      score: input.previous + rate * POINTS_PER_CREDIT,
      earned,
      cappedAway,
      pace: rate,
      ema,
      accel,
      idleStreak,
      capState: next,
      mode: "earn",
    };
  }

  if (rate < -1e-9) {
    const retention = retentionFor(input.halfLife);
    return {
      score: input.previous * retention,
      earned,
      cappedAway,
      // Same half-life settles the 1st derivative back toward 0 from below.
      pace: rate * retention,
      ema,
      accel,
      idleStreak,
      capState: next,
      mode: "decay",
    };
  }

  return {
    score: input.previous,
    earned,
    cappedAway,
    pace: 0,
    ema,
    accel,
    idleStreak,
    capState: next,
    mode: "hold",
  };
}

export function nextGraceDecay(input: StepInput): StepResult {
  const { earned, next } = applyEarnCaps(
    input.rawCredits,
    input.capState,
    input.caps,
  );
  const cappedAway = Math.max(0, input.rawCredits) - earned;
  if (earned > 0) {
    return {
      score: input.previous + earned * POINTS_PER_CREDIT,
      earned,
      cappedAway,
      pace: earned,
      ema: earned,
      accel: 0,
      idleStreak: 0,
      capState: next,
      mode: "earn",
    };
  }
  const idleStreak = input.idleStreak + 1;
  if (idleStreak <= input.graceDays) {
    return {
      score: input.previous,
      earned: 0,
      cappedAway,
      pace: 0,
      ema: 0,
      accel: 0,
      idleStreak,
      capState: next,
      mode: "hold",
    };
  }
  return {
    score: input.previous * retentionFor(input.halfLife),
    earned: 0,
    cappedAway,
    pace: 0,
    ema: 0,
    accel: 0,
    idleStreak,
    capState: next,
    mode: "decay",
  };
}

export function nextScore(formula: FormulaId, input: StepInput): StepResult {
  switch (formula) {
    case "baseline": {
      const dailyCap = 3;
      const capped = Math.min(dailyCap, Math.max(0, input.rawCredits));
      return {
        score: nextBaselineScore(
          input.previous,
          input.rawCredits,
          input.halfLife,
          dailyCap,
        ),
        earned: capped,
        cappedAway: Math.max(0, input.rawCredits) - capped,
        pace: capped,
        ema: capped,
        accel: 0,
        idleStreak: capped > 0 ? 0 : input.idleStreak + 1,
        capState: input.capState,
        mode: capped > 0 ? "earn" : "decay",
      };
    }
    case "pace-line":
      return nextPaceLine(input);
    case "lagged-slope":
      return nextLaggedSlope(input);
    case "grace-decay":
      return nextGraceDecay(input);
  }
}

export type SimulateOptions = {
  formula: FormulaId;
  daysPerWeek: number;
  completions: number;
  difficulty: Difficulty;
  halfLife: number;
  breakDays: number;
  caps?: CapWindow;
  graceDays?: number;
  /** EMA half-life for activity memory, in days. */
  paceHalfLife?: number;
  /** Chase gain: settle rate toward EMA. */
  accelGain?: number;
  /** Shock gain: today vs EMA → acceleration. */
  shockGain?: number;
  recoveryBias?: number;
  historyDays?: number;
  forecastDays?: number;
};

export type SimulateResult = {
  history: number[];
  forecast: number[];
  rateHistory: number[];
  rateForecast: number[];
  accelHistory: number[];
  accelForecast: number[];
  earnedCredits: number;
  cappedAway: number;
  current: number;
  projected: number;
  dailyRateNow: number;
  dailyRateProjected: number;
  accelNow: number;
  accelProjected: number;
  emaNow: number;
};

function activeOnDay(day: number, daysPerWeek: number, offset = 0): boolean {
  const local = ((day - offset) % 7 + 7) % 7;
  if (daysPerWeek <= 0) return false;
  return (
    Math.floor(((local + 1) * daysPerWeek) / 7) >
    Math.floor((local * daysPerWeek) / 7)
  );
}

function stepOptions(options: SimulateOptions) {
  const caps = options.caps ?? DEFAULT_CAPS;
  const graceDays = options.graceDays ?? 2;
  const paceHalfLife = options.paceHalfLife ?? 14;
  return {
    caps,
    graceDays,
    paceAlpha: 1 - 2 ** (-1 / paceHalfLife),
    accelGain: options.accelGain ?? DEFAULT_ACCEL_GAIN,
    shockGain: options.shockGain ?? DEFAULT_SHOCK_GAIN,
    recoveryBias: options.recoveryBias ?? DEFAULT_RECOVERY_BIAS,
  };
}

export function simulateScore(options: SimulateOptions): SimulateResult {
  const historyDays = options.historyDays ?? 84;
  const forecastDays = options.forecastDays ?? 56;
  const shared = stepOptions(options);
  const weight = DIFFICULTY_WEIGHT[options.difficulty];

  let score = 0;
  let pace = 0;
  let ema = 0;
  let idleStreak = 0;
  let accel = 0;
  let capState = emptyCapState();
  let earnedCredits = 0;
  let cappedAway = 0;
  const history: number[] = [0];
  const rateHistory: number[] = [0];
  const accelHistory: number[] = [0];

  for (let day = 0; day < historyDays; day++) {
    capState = rollCalendarDay(capState, day);
    const raw = day % 7 < 5 ? 2 : 0;
    const step = nextScore(options.formula, {
      previous: score,
      rawCredits: raw,
      halfLife: options.halfLife,
      capState,
      pace,
      ema,
      idleStreak,
      ...shared,
    });
    score = step.score;
    pace = step.pace;
    ema = step.ema;
    idleStreak = step.idleStreak;
    accel = step.accel;
    capState = step.capState;
    earnedCredits += step.earned;
    cappedAway += step.cappedAway;
    history.push(score);
    rateHistory.push(pace);
    accelHistory.push(accel);
  }

  const current = score;
  const dailyRateNow = pace;
  const accelNow = accel;
  const emaNow = ema;
  const forecast: number[] = [current];
  const rateForecast: number[] = [pace];
  const accelForecast: number[] = [accel];

  for (let day = 0; day < forecastDays; day++) {
    const absoluteDay = historyDays + day;
    capState = rollCalendarDay(capState, absoluteDay);
    const inBreak = day < options.breakDays;
    const active =
      !inBreak && activeOnDay(day, options.daysPerWeek, options.breakDays);
    const raw = active ? options.completions * weight : 0;
    const step = nextScore(options.formula, {
      previous: score,
      rawCredits: raw,
      halfLife: options.halfLife,
      capState,
      pace,
      ema,
      idleStreak,
      ...shared,
    });
    score = step.score;
    pace = step.pace;
    ema = step.ema;
    idleStreak = step.idleStreak;
    accel = step.accel;
    capState = step.capState;
    earnedCredits += step.earned;
    cappedAway += step.cappedAway;
    forecast.push(score);
    rateForecast.push(pace);
    accelForecast.push(accel);
  }

  return {
    history,
    forecast,
    rateHistory,
    rateForecast,
    accelHistory,
    accelForecast,
    earnedCredits,
    cappedAway,
    current,
    projected: forecast.at(-1)!,
    dailyRateNow,
    dailyRateProjected: pace,
    accelNow,
    accelProjected: accel,
    emaNow,
  };
}

export function scoreBand(score: number, formula: FormulaId): string {
  if (formula === "baseline") {
    if (score < 20) return "Taking root";
    if (score < 40) return "Building";
    if (score < 60) return "Steady";
    if (score < 80) return "Strong";
    return "Flourishing";
  }
  if (score < 40) return "Taking root";
  if (score < 120) return "Building";
  if (score < 300) return "Steady";
  if (score < 700) return "Strong";
  if (score < 1500) return "Flourishing";
  return "Enduring";
}

export function equivalentLabel(credits: number): string {
  const medium = credits;
  const easy = credits / DIFFICULTY_WEIGHT.easy;
  const hard = credits / DIFFICULTY_WEIGHT.hard;
  return `${medium.toFixed(0)} medium · ~${easy.toFixed(1)} easy · ~${hard.toFixed(1)} hard`;
}
