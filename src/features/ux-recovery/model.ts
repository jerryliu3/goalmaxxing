/**
 * Pure suggestion model for the recovery study. Nothing here moves a session
 * on its own: `suggest` proposes, the user decides, `applyDecisions` writes.
 */
import {
  addDays,
  dateRange,
  dayName,
  earliest,
  formatDay,
  startOfWeek,
  weekdayOf,
  type IsoDate,
  type Weekday,
} from "@/features/ux-recovery/dates";

export type Strategy = "squeeze" | "rebalance";

export const STRATEGY_LABEL: Record<Strategy, string> = {
  squeeze: "Just the missed",
  rebalance: "Rebalance",
};

interface GoalBase {
  id: string;
  title: string;
  /** Chip-sized name, e.g. "Run". */
  short: string;
  /** Running-copy noun, e.g. "a run" in "Thu already has a run". */
  noun: string;
  color: string;
  target: string;
  window: { start: IsoDate; end: IsoDate | null };
  /** Soft: avoided unless nothing else in the window is open. */
  restDays: readonly Weekday[];
}

export type RecoveryGoal =
  | (GoalBase & { kind: "cadence"; interval: "day" | "week" })
  | (GoalBase & { kind: "lifetime"; shape: "milestone" | "deadline_total" });

export type SessionStatus = "scheduled" | "done" | "missed";

export interface RecoverySession {
  id: string;
  goalId: string;
  date: IsoDate;
  status: SessionStatus;
  label: string;
  /** Locked sessions never shift during a rebalance. */
  locked?: boolean;
  /** "Let it go": stays missed, never prompts again. */
  dismissed?: boolean;
}

export interface RecoverySeed {
  goals: readonly RecoveryGoal[];
  sessions: readonly RecoverySession[];
  /** Max sessions per day across all goals. */
  dailyCap: number;
  /** Last planned day; nothing is suggested past it. */
  horizonEnd: IsoDate;
}

export interface Stranded {
  session: RecoverySession;
  goal: RecoveryGoal;
  /** Last day the session may still land on. */
  windowEnd: IsoDate;
}

export type RowDecision =
  | { kind: "accept"; date: IsoDate; edited: boolean; reason?: string }
  | { kind: "dismiss" };

export interface Decisions {
  rows: Readonly<Record<string, RowDecision>>;
  strategyByGoal: Readonly<Record<string, Strategy>>;
}

export const NO_DECISIONS: Decisions = { rows: {}, strategyByGoal: {} };

export interface DayOption {
  date: IsoDate;
  available: boolean;
  rest: boolean;
  full: boolean;
  sameGoal: boolean;
}

export interface Shift {
  sessionId: string;
  label: string;
  from: IsoDate;
  to: IsoDate;
}

export type SuggestionStatus = "pending" | "accepted" | "edited";

export interface Suggestion {
  sessionId: string;
  goalId: string;
  label: string;
  missedDate: IsoDate;
  windowEnd: IsoDate;
  /** `null` when no valid day exists; `reason` then says why. */
  date: IsoDate | null;
  reason: string;
  rest: boolean;
  status: SuggestionStatus;
  /** Valid/invalid days in the window, for "pick another day". */
  options: DayOption[];
  /** Future sessions of this goal that move with the rebalance (shared per goal). */
  shifts: Shift[];
}

export interface GoalPlan {
  goal: RecoveryGoal;
  requested: Strategy;
  strategy: Strategy;
  /** Set when the requested strategy could not be honoured. */
  note: string | null;
  windowEnd: IsoDate;
  rows: Suggestion[];
  shifts: Shift[];
}

export interface RecoveryPlan {
  goals: GoalPlan[];
  rows: Suggestion[];
  dismissedIds: string[];
}

export const REBALANCE_REASON = "Spread evenly with this goal’s other sessions.";
export const REBALANCE_FALLBACK =
  "Not enough open days to rebalance, so only the missed sessions move.";
const PICKED_REASON = "Your pick.";

const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export function isRestDay(goal: RecoveryGoal, date: IsoDate): boolean {
  return goal.restDays.includes(weekdayOf(date));
}

/** Last day of the credit period containing `date`; lifetime goals have none. */
export function creditPeriodEnd(goal: RecoveryGoal, date: IsoDate): IsoDate | null {
  if (goal.kind === "lifetime") return null;
  return goal.interval === "day" ? date : addDays(startOfWeek(date), 6);
}

export function placementWindowEnd(
  seed: RecoverySeed,
  goal: RecoveryGoal,
  session: RecoverySession
): IsoDate {
  const ends = [seed.horizonEnd];
  if (goal.window.end) ends.push(goal.window.end);
  const periodEnd = creditPeriodEnd(goal, session.date);
  if (periodEnd) ends.push(periodEnd);
  return earliest(ends);
}

export function isStranded(session: RecoverySession, today: IsoDate): boolean {
  return session.status !== "done" && !session.dismissed && session.date < today;
}

/**
 * Stranded sessions that can still earn credit. Past-period cadence misses and
 * misses on finished goals are excluded silently: no row, no warning.
 * Ordered tightest window first so short windows claim days before long ones.
 */
export function findRecoverable(seed: RecoverySeed, today: IsoDate): Stranded[] {
  const goals = new Map(seed.goals.map((goal) => [goal.id, goal]));
  const order = new Map(seed.goals.map((goal, index) => [goal.id, index]));
  const found: Stranded[] = [];
  for (const session of seed.sessions) {
    if (!isStranded(session, today)) continue;
    const goal = goals.get(session.goalId);
    if (!goal) continue;
    const windowEnd = placementWindowEnd(seed, goal, session);
    if (windowEnd < today) continue;
    found.push({ session, goal, windowEnd });
  }
  return found.sort(
    (a, b) =>
      compare(a.windowEnd, b.windowEnd) ||
      (order.get(a.goal.id) ?? 0) - (order.get(b.goal.id) ?? 0) ||
      compare(a.session.date, b.session.date) ||
      compare(a.session.id, b.session.id)
  );
}

interface Context {
  seed: RecoverySeed;
  today: IsoDate;
  load: Map<IsoDate, number>;
  occupied: Map<string, Set<IsoDate>>;
}

function createContext(seed: RecoverySeed, today: IsoDate): Context {
  const ctx: Context = { seed, today, load: new Map(), occupied: new Map() };
  for (const session of seed.sessions) {
    if (session.date < today || session.status === "missed" || session.dismissed) continue;
    bump(ctx, session.date, 1);
    occupiedBy(ctx, session.goalId).add(session.date);
  }
  return ctx;
}

function bump(ctx: Context, date: IsoDate, by: number) {
  ctx.load.set(date, (ctx.load.get(date) ?? 0) + by);
}

function occupiedBy(ctx: Context, goalId: string): Set<IsoDate> {
  let days = ctx.occupied.get(goalId);
  if (!days) {
    days = new Set();
    ctx.occupied.set(goalId, days);
  }
  return days;
}

function acceptOf(decisions: Decisions, sessionId: string) {
  const decision = decisions.rows[sessionId];
  return decision?.kind === "accept" ? decision : null;
}

function dayOptions(
  ctx: Context,
  goal: RecoveryGoal,
  windowEnd: IsoDate,
  own: IsoDate | null = null
): DayOption[] {
  const occupied = occupiedBy(ctx, goal.id);
  return dateRange(ctx.today, windowEnd).map((date) => {
    const load = (ctx.load.get(date) ?? 0) - (date === own ? 1 : 0);
    const full = load >= ctx.seed.dailyCap;
    const sameGoal = occupied.has(date) && date !== own;
    return { date, rest: isRestDay(goal, date), full, sameGoal, available: !full && !sameGoal };
  });
}

function listNames(names: string[]): string {
  if (names.length > 4) return `${names.length} days`;
  if (names.length === 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** "today and Fri are full; Thu already has a run; Sun is a rest day" */
export function describeBlocked(
  options: DayOption[],
  goal: RecoveryGoal,
  today: IsoDate
): string {
  const names = (filter: (option: DayOption) => boolean) =>
    options.filter(filter).map((option) => dayName(option.date, today));
  const full = names((option) => option.full);
  const same = names((option) => !option.full && option.sameGoal);
  const rest = names((option) => option.available && option.rest);
  const parts: string[] = [];
  if (full.length) parts.push(`${listNames(full)} ${full.length === 1 ? "is" : "are"} full`);
  if (same.length) {
    parts.push(`${listNames(same)} already ${same.length === 1 ? "has" : "have"} ${goal.noun}`);
  }
  if (rest.length) {
    parts.push(`${listNames(rest)} ${rest.length === 1 ? "is a rest day" : "are rest days"}`);
  }
  return parts.join("; ");
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function noRoomReason(item: Stranded, options: DayOption[], today: IsoDate): string {
  const { goal, windowEnd } = item;
  const headline =
    goal.kind === "cadence"
      ? goal.interval === "week"
        ? "This week has no open day left"
        : "Today has no room left"
      : windowEnd === goal.window.end
        ? `Goal ends ${formatDay(windowEnd)} — no room`
        : "No open day before the plan ends";
  const detail = describeBlocked(options, goal, today);
  return detail ? `${headline}. ${capitalize(detail)}.` : `${headline}.`;
}

/** Earliest open day, preferring non-rest days. Never before today. */
function chooseEarliest(ctx: Context, item: Stranded): { date: IsoDate | null; reason: string } {
  const options = dayOptions(ctx, item.goal, item.windowEnd);
  const open = options.filter((option) => option.available);
  const pick = open.find((option) => !option.rest) ?? open[0];
  if (!pick) return { date: null, reason: noRoomReason(item, options, ctx.today) };
  if (pick.rest) {
    return {
      date: pick.date,
      reason: `Only rest days are open — ${dayName(pick.date, ctx.today)} is the earliest.`,
    };
  }
  const skipped = options.filter((option) => option.date < pick.date);
  if (skipped.length) {
    return {
      date: pick.date,
      reason: `First open day — ${describeBlocked(skipped, item.goal, ctx.today)}.`,
    };
  }
  return {
    date: pick.date,
    reason: pick.date === ctx.today ? "Today still has room." : "First open day.",
  };
}

type DraftRow = Omit<Suggestion, "options" | "shifts">;

function draftRow(
  item: Stranded,
  date: IsoDate | null,
  reason: string,
  status: SuggestionStatus
): DraftRow {
  return {
    sessionId: item.session.id,
    goalId: item.goal.id,
    label: item.session.label,
    missedDate: item.session.date,
    windowEnd: item.windowEnd,
    date,
    reason,
    rest: date ? isRestDay(item.goal, date) : false,
    status,
  };
}

function pinnedRow(item: Stranded, pin: Extract<RowDecision, { kind: "accept" }>, fallback: string) {
  return draftRow(
    item,
    pin.date,
    pin.edited ? PICKED_REASON : (pin.reason ?? fallback),
    pin.edited ? "edited" : "accepted"
  );
}

/** Squeeze: move only the stranded sessions, one by one, into the earliest open day. */
function squeezeGoal(ctx: Context, items: Stranded[], decisions: Decisions): DraftRow[] {
  return items.map((item) => {
    const occupied = occupiedBy(ctx, item.goal.id);
    const pin = acceptOf(decisions, item.session.id);
    if (pin) {
      // Load was reserved up front so earlier rows could see it.
      occupied.add(pin.date);
      return pinnedRow(item, pin, "First open day.");
    }
    const choice = chooseEarliest(ctx, item);
    if (choice.date) {
      bump(ctx, choice.date, 1);
      occupied.add(choice.date);
    }
    return draftRow(item, choice.date, choice.reason, "pending");
  });
}

/** Evenly spaced open days in the window, non-rest days first. */
function spreadDates(
  ctx: Context,
  goal: RecoveryGoal,
  windowEnd: IsoDate,
  count: number,
  excluded: ReadonlySet<IsoDate>
): IsoDate[] | null {
  if (count === 0) return [];
  const occupied = occupiedBy(ctx, goal.id);
  const days = dateRange(ctx.today, windowEnd).filter(
    (date) =>
      !excluded.has(date) &&
      !occupied.has(date) &&
      (ctx.load.get(date) ?? 0) < ctx.seed.dailyCap
  );
  const calm = days.filter((date) => !isRestDay(goal, date));
  const pool = calm.length >= count ? calm : days;
  if (pool.length < count) return null;
  return Array.from(
    { length: count },
    (_, index) => pool[Math.floor(((index + 0.5) * pool.length) / count)] as IsoDate
  );
}

/**
 * Rebalance: stranded + this goal's future unlocked sessions reflow evenly
 * across the remaining window, in order. Returns null when it cannot fit.
 */
function rebalanceGoal(
  ctx: Context,
  items: Stranded[],
  decisions: Decisions
): { rows: DraftRow[]; shifts: Shift[] } | null {
  const first = items[0];
  if (!first) return { rows: [], shifts: [] };
  const { goal, windowEnd } = first;
  const occupied = occupiedBy(ctx, goal.id);
  const movable = ctx.seed.sessions
    .filter(
      (session) =>
        session.goalId === goal.id &&
        session.status === "scheduled" &&
        !session.dismissed &&
        !session.locked &&
        session.date > ctx.today &&
        session.date <= windowEnd
    )
    .sort((a, b) => compare(a.date, b.date));
  const pins = new Map(
    items.flatMap((item) => {
      const pin = acceptOf(decisions, item.session.id);
      return pin ? [[item.session.id, pin] as const] : [];
    })
  );

  const lift = (by: 1 | -1) => {
    for (const session of movable) {
      bump(ctx, session.date, by);
      if (by < 0) occupied.delete(session.date);
      else occupied.add(session.date);
    }
    for (const pin of pins.values()) bump(ctx, pin.date, by);
  };
  lift(-1);

  const entries = [...items.map((item) => item.session), ...movable];
  const assignment = new Map<string, IsoDate>();
  const all = spreadDates(ctx, goal, windowEnd, entries.length, new Set());
  const pinsHold =
    all !== null && entries.every((entry, i) => !pins.has(entry.id) || pins.get(entry.id)?.date === all[i]);
  if (all && pinsHold) {
    entries.forEach((entry, i) => assignment.set(entry.id, all[i] as IsoDate));
  } else {
    const free = entries.filter((entry) => !pins.has(entry.id));
    const fixed = new Set([...pins.values()].map((pin) => pin.date));
    const dates = spreadDates(ctx, goal, windowEnd, free.length, fixed);
    if (dates) {
      free.forEach((entry, i) => assignment.set(entry.id, dates[i] as IsoDate));
      for (const [id, pin] of pins) assignment.set(id, pin.date);
    }
  }

  if (assignment.size === 0) {
    lift(1);
    return null;
  }
  for (const date of assignment.values()) {
    bump(ctx, date, 1);
    occupied.add(date);
  }

  const shifts = movable.flatMap((session) => {
    const to = assignment.get(session.id);
    return to && to !== session.date
      ? [{ sessionId: session.id, label: session.label, from: session.date, to }]
      : [];
  });
  const rows = items.map((item) => {
    const pin = pins.get(item.session.id);
    if (pin) return pinnedRow(item, pin, REBALANCE_REASON);
    return draftRow(item, assignment.get(item.session.id) ?? null, REBALANCE_REASON, "pending");
  });
  return { rows, shifts };
}

function groupByGoal(items: Stranded[]): Stranded[][] {
  const groups = new Map<string, Stranded[]>();
  for (const item of items) {
    const group = groups.get(item.goal.id);
    if (group) group.push(item);
    else groups.set(item.goal.id, [item]);
  }
  return [...groups.values()];
}

/**
 * Proposes a date for every recoverable, non-dismissed session.
 * Accepted/edited rows keep their decided date; everything else is fitted
 * around them. Deterministic for the same inputs.
 */
export function suggest(
  seed: RecoverySeed,
  today: IsoDate,
  strategy: Strategy,
  decisions: Decisions = NO_DECISIONS
): RecoveryPlan {
  const stranded = findRecoverable(seed, today);
  const isDismissed = (item: Stranded) => decisions.rows[item.session.id]?.kind === "dismiss";
  const active = stranded.filter((item) => !isDismissed(item));
  const ctx = createContext(seed, today);
  for (const item of active) {
    const pin = acceptOf(decisions, item.session.id);
    if (pin) bump(ctx, pin.date, 1);
  }

  const drafts = groupByGoal(active).map((items) => {
    const { goal, windowEnd } = items[0] as Stranded;
    const requested = decisions.strategyByGoal[goal.id] ?? strategy;
    const rebalanced = requested === "rebalance" ? rebalanceGoal(ctx, items, decisions) : null;
    if (rebalanced) {
      return { goal, requested, strategy: "rebalance" as const, note: null, windowEnd, ...rebalanced };
    }
    return {
      goal,
      requested,
      strategy: "squeeze" as const,
      note: requested === "rebalance" ? REBALANCE_FALLBACK : null,
      windowEnd,
      rows: squeezeGoal(ctx, items, decisions),
      shifts: [] as Shift[],
    };
  });

  // Options are computed against the final placement so edits stay valid.
  const goals: GoalPlan[] = drafts.map((draft) => ({
    ...draft,
    rows: draft.rows.map((row) => ({
      ...row,
      options: dayOptions(ctx, draft.goal, row.windowEnd, row.date),
      shifts: draft.shifts,
    })),
  }));
  return {
    goals,
    rows: goals.flatMap((goal) => goal.rows),
    dismissedIds: stranded.filter(isDismissed).map((item) => item.session.id),
  };
}

export interface ApplySummary {
  moved: number;
  shifted: number;
  letGo: number;
  leftForLater: number;
}

/**
 * Writes accepted moves (and their goal's shifts) and dismissals.
 * Pending rows stay missed and will be suggested again next time.
 */
export function applyDecisions(
  seed: RecoverySeed,
  today: IsoDate,
  strategy: Strategy,
  decisions: Decisions
): { seed: RecoverySeed; summary: ApplySummary } {
  const plan = suggest(seed, today, strategy, decisions);
  const moves = new Map<string, IsoDate>();
  let moved = 0;
  let shifted = 0;
  for (const goal of plan.goals) {
    const accepted = goal.rows.filter((row) => row.status !== "pending" && row.date);
    for (const row of accepted) moves.set(row.sessionId, row.date as IsoDate);
    moved += accepted.length;
    if (accepted.length && goal.strategy === "rebalance") {
      for (const shift of goal.shifts) moves.set(shift.sessionId, shift.to);
      shifted += goal.shifts.length;
    }
  }
  const letGo = new Set(plan.dismissedIds);
  const sessions = seed.sessions.map((session) => {
    const to = moves.get(session.id);
    if (to) return { ...session, date: to, status: "scheduled" as const };
    if (letGo.has(session.id)) return { ...session, dismissed: true };
    return session;
  });
  return {
    seed: { ...seed, sessions },
    summary: {
      moved,
      shifted,
      letGo: letGo.size,
      leftForLater: plan.rows.filter((row) => row.status === "pending").length,
    },
  };
}

export interface RecoveryPrompt {
  count: number;
  fit: number;
  text: string;
}

/** Calm one-liner for Agenda and the check-in row. */
export function recoveryPrompt(plan: RecoveryPlan, today: IsoDate): RecoveryPrompt {
  const count = plan.rows.length;
  const fit = plan.rows.filter((row) => row.date).length;
  const weekStart = startOfWeek(today);
  const thisWeek = count > 0 && plan.rows.every((row) => row.missedDate >= weekStart);
  const text =
    count === 0
      ? "Nothing slipped"
      : `${count} session${count === 1 ? "" : "s"} slipped${thisWeek ? " this week" : ""}`;
  return { count, fit, text };
}

export function windowLabel(goal: GoalPlan): string {
  if (goal.goal.kind === "cadence") return `Until ${formatDay(goal.windowEnd)} · this week`;
  const deadline = goal.windowEnd === goal.goal.window.end;
  return `Until ${formatDay(goal.windowEnd)} · ${deadline ? "goal deadline" : "end of plan"}`;
}
