/**
 * Product Grow score (Lagged Slope).
 * Activity drives acceleration; steady pace → linear climb; stop → exponential decay.
 */

export const GROW_DIFFICULTY_WEIGHT = {
  easy: 0.75,
  medium: 1,
  hard: 1.5,
} as const;

export type GrowDifficulty = keyof typeof GROW_DIFFICULTY_WEIGHT;

/** Medium-equivalent credits. Anchor: ~5 medium goals / day. */
export const GROW_REFERENCE_DAILY_CREDITS = 5;
export const GROW_HALF_LIFE_DAYS = 28;
export const GROW_PACE_HALF_LIFE_DAYS = 14;
export const GROW_POINTS_PER_CREDIT = 1;
/** Settle-to-average gain (locked study default). */
export const GROW_SETTLE_GAIN = 0.15;
/** Today-vs-average shock gain (locked study default). */
export const GROW_SHOCK_GAIN = 0.2;
/** Comeback boost while rate is negative (locked study default). */
export const GROW_RECOVERY_BIAS = 1.5;

export const GROW_CAPS = {
  day: GROW_REFERENCE_DAILY_CREDITS,
  week: GROW_REFERENCE_DAILY_CREDITS * 7,
  month: GROW_REFERENCE_DAILY_CREDITS * 30,
} as const;

export type GrowCapWindow = {
  day: number;
  week: number;
  month: number;
};

export type GrowCapState = {
  dayEarned: number;
  weekEarned: number;
  monthWindow: number[];
};

export function emptyGrowCapState(): GrowCapState {
  return { dayEarned: 0, weekEarned: 0, monthWindow: Array(30).fill(0) };
}

function monthEarned(state: GrowCapState): number {
  return state.monthWindow.reduce((sum, value) => sum + value, 0);
}

export function applyGrowEarnCaps(
  rawCredits: number,
  state: GrowCapState,
  caps: GrowCapWindow = GROW_CAPS,
): { earned: number; next: GrowCapState } {
  const positive = Math.max(0, rawCredits);
  const room = Math.min(
    Math.max(0, caps.day - state.dayEarned),
    Math.max(0, caps.week - state.weekEarned),
    Math.max(0, caps.month - monthEarned(state)),
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

/** Reset daily (always) and weekly earnings when `resetWeek` is true. */
export function rollGrowCalendarDay(
  state: GrowCapState,
  resetWeek: boolean,
): GrowCapState {
  return {
    dayEarned: 0,
    weekEarned: resetWeek ? 0 : state.weekEarned,
    monthWindow: state.monthWindow,
  };
}

export type GrowStepInput = {
  previous: number;
  rawCredits: number;
  halfLife?: number;
  caps?: GrowCapWindow;
  capState: GrowCapState;
  pace: number;
  ema: number;
  settleGain?: number;
  shockGain?: number;
  recoveryBias?: number;
  paceAlpha?: number;
};

export type GrowStepResult = {
  score: number;
  earned: number;
  cappedAway: number;
  pace: number;
  ema: number;
  accel: number;
  mode: "earn" | "hold" | "decay";
  capState: GrowCapState;
};

function retentionFor(halfLife: number) {
  return 2 ** (-1 / halfLife);
}

export function growPaceAlpha(halfLifeDays = GROW_PACE_HALF_LIFE_DAYS) {
  return 1 - 2 ** (-1 / halfLifeDays);
}

/**
 * Lagged Slope day step.
 * a = shock*(earned − ema) + settle*(ema − v)
 * v > 0 → score += v; v < 0 → score and v *= retention
 */
export function nextGrowLaggedSlope(input: GrowStepInput): GrowStepResult {
  const caps = input.caps ?? GROW_CAPS;
  const halfLife = input.halfLife ?? GROW_HALF_LIFE_DAYS;
  const settleGain = input.settleGain ?? GROW_SETTLE_GAIN;
  const shockGain = input.shockGain ?? GROW_SHOCK_GAIN;
  const recoveryBias = input.recoveryBias ?? GROW_RECOVERY_BIAS;
  const paceAlpha = input.paceAlpha ?? growPaceAlpha();

  const { earned, next } = applyGrowEarnCaps(
    input.rawCredits,
    input.capState,
    caps,
  );
  const cappedAway = Math.max(0, input.rawCredits) - earned;

  const ema = paceAlpha * earned + (1 - paceAlpha) * input.ema;
  let accel = shockGain * (earned - ema) + settleGain * (ema - input.pace);
  if (input.pace < 0 && accel > 0) {
    accel *= recoveryBias;
  }

  let rate = input.pace + accel;
  const rateBound = caps.day * GROW_POINTS_PER_CREDIT;
  if (rate > rateBound) rate = rateBound;
  if (rate < -rateBound) rate = -rateBound;

  if (rate > 1e-9) {
    return {
      score: input.previous + rate * GROW_POINTS_PER_CREDIT,
      earned,
      cappedAway,
      pace: rate,
      ema,
      accel,
      mode: "earn",
      capState: next,
    };
  }

  if (rate < -1e-9) {
    const retention = retentionFor(halfLife);
    return {
      score: input.previous * retention,
      earned,
      cappedAway,
      pace: rate * retention,
      ema,
      accel,
      mode: "decay",
      capState: next,
    };
  }

  return {
    score: input.previous,
    earned,
    cappedAway,
    pace: 0,
    ema,
    accel,
    mode: "hold",
    capState: next,
  };
}

export function growDifficultyWeight(
  difficulty: string | null | undefined,
): number {
  if (difficulty === "easy" || difficulty === "hard" || difficulty === "medium") {
    return GROW_DIFFICULTY_WEIGHT[difficulty];
  }
  return GROW_DIFFICULTY_WEIGHT.medium;
}
