/**
 * Pure suggestion model for the recovery review. Nothing here writes: `suggest`
 * proposes a date for every recoverable session, and recovery mode stages the
 * user's decisions as planner draft moves until Save. The server snapshot
 * and the Agenda/check-in count both go through `findRecoverable`, so the
 * entry point and the review can never disagree.
 */
import { getUtcWeekday } from "@/lib/planner/dates";
import type {
  RecoveryGoal,
  RecoverySession,
  RecoverySnapshot,
} from "@/lib/planner/recovery/contract";
import { dateRange, dayName, formatDay } from "@/lib/planner/recovery/dates";

/** Squeeze ("just the missed") is the default; rebalance is the global Auto-rebalance. */
export type Strategy = "squeeze" | "rebalance";

export interface SeedSession extends RecoverySession {
  /**
   * Saved date, set client-side when recovery mode staged a move for the
   * session. A later rebalance pins it rather than moving it again.
   */
  recoveredFrom?: string;
}

export interface RecoverySeed extends Omit<RecoverySnapshot, "sessions"> {
  sessions: readonly SeedSession[];
}

export interface Stranded {
  session: SeedSession;
  goal: RecoveryGoal;
  /** Last day the session may still land on. */
  windowEnd: string;
}

export interface DayOption {
  date: string;
  available: boolean;
  rest: boolean;
  sameGoal: boolean;
}

export interface Shift {
  sessionId: string;
  label: string;
  from: string;
  to: string;
}

export interface Suggestion {
  sessionId: string;
  goalId: string;
  label: string;
  missedDate: string;
  windowEnd: string;
  /** `null` when no valid day exists; `reason` then says why. */
  date: string | null;
  reason: string;
  rest: boolean;
  /** Valid/invalid days in the window for a manual pick, against the saved plan. */
  options: DayOption[];
}

export interface GoalPlan {
  goal: RecoveryGoal;
  strategy: Strategy;
  /** Set when Auto-rebalance could not be honoured for this goal. */
  note: string | null;
  windowEnd: string;
  rows: Suggestion[];
  /** Later sessions of this goal that move with the rebalance. */
  shifts: Shift[];
}

/** A session the review moves: `sessionId` names it by its saved goal and day. */
export interface RecoveryMove {
  sessionId: string;
  to: string;
}

export interface RecoveryPlan {
  goals: GoalPlan[];
  rows: Suggestion[];
}

export const REBALANCE_REASON = "Spread evenly with this goal’s other sessions.";
export const REBALANCE_FALLBACK =
  "Not enough open days to rebalance, so only the missed sessions move.";

const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export function isRestDay(seed: RecoverySeed, goal: RecoveryGoal, date: string): boolean {
  return (
    goal.restDays.includes(getUtcWeekday(date)) ||
    seed.blackoutRanges.some((range) => date >= range.start && date <= range.end)
  );
}

/**
 * Slipped sessions that can still earn credit, tightest window first so short
 * windows claim days before long ones. The server only sends missed sessions
 * whose credit window still includes today; past-period misses never arrive.
 */
export function findRecoverable(seed: RecoverySeed): Stranded[] {
  const goals = new Map(seed.goals.map((goal) => [goal.id, goal]));
  const order = new Map(seed.goals.map((goal, index) => [goal.id, index]));
  const found: Stranded[] = [];
  for (const session of seed.sessions) {
    if (session.status !== "missed" || !session.windowEnd) continue;
    if (session.windowEnd < seed.today) continue;
    const goal = goals.get(session.goalId);
    if (!goal) continue;
    found.push({ session, goal, windowEnd: session.windowEnd });
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
  occupied: Map<string, Set<string>>;
}

function createContext(seed: RecoverySeed): Context {
  const ctx: Context = { seed, occupied: new Map() };
  for (const goal of seed.goals) {
    for (const date of goal.completedDates) occupiedBy(ctx, goal.id).add(date);
  }
  for (const session of seed.sessions) {
    if (session.date < seed.today || session.status === "missed") continue;
    occupiedBy(ctx, session.goalId).add(session.date);
  }
  return ctx;
}

function occupiedBy(ctx: Context, goalId: string): Set<string> {
  let days = ctx.occupied.get(goalId);
  if (!days) {
    days = new Set();
    ctx.occupied.set(goalId, days);
  }
  return days;
}

function dayOptions(ctx: Context, goal: RecoveryGoal, windowEnd: string): DayOption[] {
  const occupied = occupiedBy(ctx, goal.id);
  return dateRange(ctx.seed.today, windowEnd).map((date) => {
    const sameGoal = occupied.has(date);
    return { date, rest: isRestDay(ctx.seed, goal, date), sameGoal, available: !sameGoal };
  });
}

function listNames(names: string[]): string {
  if (names.length > 4) return `${names.length} days`;
  if (names.length === 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** "Thu already has a session; Sun is a rest day" */
export function describeBlocked(options: DayOption[], today: string): string {
  const names = (filter: (option: DayOption) => boolean) =>
    options.filter(filter).map((option) => dayName(option.date, today));
  const same = names((option) => option.sameGoal);
  const rest = names((option) => option.available && option.rest);
  const parts: string[] = [];
  if (same.length) {
    parts.push(`${listNames(same)} already ${same.length === 1 ? "has" : "have"} a session`);
  }
  if (rest.length) {
    parts.push(`${listNames(rest)} ${rest.length === 1 ? "is a rest day" : "are rest days"}`);
  }
  return parts.join("; ");
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const PERIOD_NAME = { daily: "today", weekly: "this week", monthly: "this month" } as const;

function noRoomReason(item: Stranded, options: DayOption[], today: string): string {
  const { goal, windowEnd } = item;
  const headline =
    goal.kind === "cadence"
      ? goal.interval === "daily" || !goal.interval
        ? "Today has no room left"
        : `${capitalize(PERIOD_NAME[goal.interval])} has no open day left`
      : windowEnd === goal.endDate
        ? `Goal ends ${formatDay(windowEnd)} — no room`
        : "No open day before the plan ends";
  const detail = describeBlocked(options, today);
  return detail ? `${headline}. ${capitalize(detail)}.` : `${headline}.`;
}

/** Earliest open day, preferring non-rest days. Never before today. */
function chooseEarliest(ctx: Context, item: Stranded): { date: string | null; reason: string } {
  const { today } = ctx.seed;
  const options = dayOptions(ctx, item.goal, item.windowEnd);
  const open = options.filter((option) => option.available);
  const pick = open.find((option) => !option.rest) ?? open[0];
  if (!pick) return { date: null, reason: noRoomReason(item, options, today) };
  if (pick.rest) {
    return {
      date: pick.date,
      reason: `Only rest days are open — ${dayName(pick.date, today)} is the earliest.`,
    };
  }
  const skipped = options.filter((option) => option.date < pick.date);
  if (skipped.length) {
    return { date: pick.date, reason: `First open day — ${describeBlocked(skipped, today)}.` };
  }
  return { date: pick.date, reason: pick.date === today ? "Today still has room." : "First open day." };
}

type DraftRow = Omit<Suggestion, "options">;

function draftRow(seed: RecoverySeed, item: Stranded, date: string | null, reason: string): DraftRow {
  return {
    sessionId: item.session.id,
    goalId: item.goal.id,
    label: item.session.label,
    missedDate: item.session.date,
    windowEnd: item.windowEnd,
    date,
    reason,
    rest: date ? isRestDay(seed, item.goal, date) : false,
  };
}

/** Squeeze: move only the stranded sessions, one by one, into the earliest open day. */
function squeezeGoal(ctx: Context, items: Stranded[]): DraftRow[] {
  return items.map((item) => {
    const choice = chooseEarliest(ctx, item);
    if (choice.date) occupiedBy(ctx, item.goal.id).add(choice.date);
    return draftRow(ctx.seed, item, choice.date, choice.reason);
  });
}

/** Evenly spaced open days in the window, non-rest days first. */
function spreadDates(
  ctx: Context,
  goal: RecoveryGoal,
  windowEnd: string,
  count: number,
  excluded: ReadonlySet<string>
): string[] | null {
  if (count === 0) return [];
  const occupied = occupiedBy(ctx, goal.id);
  const days = dateRange(ctx.seed.today, windowEnd).filter(
    (date) => !excluded.has(date) && !occupied.has(date)
  );
  const calm = days.filter((date) => !isRestDay(ctx.seed, goal, date));
  const pool = calm.length >= count ? calm : days;
  if (pool.length < count) return null;
  return Array.from(
    { length: count },
    (_, index) => pool[Math.floor(((index + 0.5) * pool.length) / count)] as string
  );
}

/**
 * Rebalance: stranded + this goal's future unlocked sessions reflow evenly
 * across the remaining window, in original-date order. Sessions this review
 * already moved are pinned: they keep their slot when the spread agrees, and
 * are worked around when it does not. Returns null when the window cannot
 * hold the goal.
 */
function rebalanceGoal(ctx: Context, items: Stranded[]): { rows: DraftRow[]; shifts: Shift[] } | null {
  const first = items[0];
  if (!first) return { rows: [], shifts: [] };
  const { goal, windowEnd } = first;
  const { today } = ctx.seed;
  const occupied = occupiedBy(ctx, goal.id);
  const future = ctx.seed.sessions.filter(
    (session) =>
      session.goalId === goal.id &&
      session.status === "scheduled" &&
      !session.locked &&
      session.date >= today &&
      session.date <= windowEnd
  );
  const pinned = new Map(
    future.filter((session) => session.recoveredFrom).map((session) => [session.id, session.date] as const)
  );
  const movable = future
    .filter((session) => !session.recoveredFrom && session.date > today)
    .sort((a, b) => compare(a.date, b.date));
  const lifted = [...future.filter((session) => pinned.has(session.id)), ...movable];
  for (const session of lifted) occupied.delete(session.date);

  const origin = (session: SeedSession) => session.recoveredFrom ?? session.date;
  const entries = [...items.map((item) => item.session), ...lifted].sort(
    (a, b) => compare(origin(a), origin(b)) || compare(a.id, b.id)
  );
  const assignment = new Map<string, string>();
  const all = spreadDates(ctx, goal, windowEnd, entries.length, new Set());
  const pinsHold =
    all !== null && entries.every((entry, i) => !pinned.has(entry.id) || pinned.get(entry.id) === all[i]);
  if (all && pinsHold) {
    entries.forEach((entry, i) => assignment.set(entry.id, all[i] as string));
  } else {
    const free = entries.filter((entry) => !pinned.has(entry.id));
    const dates = spreadDates(ctx, goal, windowEnd, free.length, new Set(pinned.values()));
    if (dates) {
      free.forEach((entry, i) => assignment.set(entry.id, dates[i] as string));
      for (const [id, date] of pinned) assignment.set(id, date);
    }
  }

  if (assignment.size === 0) {
    for (const session of lifted) occupied.add(session.date);
    return null;
  }
  for (const date of assignment.values()) occupied.add(date);

  const shifts = movable.flatMap((session) => {
    const to = assignment.get(session.id);
    return to && to !== session.date
      ? [{ sessionId: session.id, label: session.label, from: session.date, to }]
      : [];
  });
  const rows = items.map((item) =>
    draftRow(ctx.seed, item, assignment.get(item.session.id) ?? null, REBALANCE_REASON)
  );
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
 * Proposes a date for every recoverable session. With `rebalance` each goal
 * reflows its future sessions too, falling back to just the missed sessions
 * when it cannot. Deterministic for the same inputs.
 */
export function suggest(seed: RecoverySeed, rebalance = false): RecoveryPlan {
  const ctx = createContext(seed);
  const drafts = groupByGoal(findRecoverable(seed)).map((items) => {
    const { goal, windowEnd } = items[0] as Stranded;
    const rebalanced = rebalance ? rebalanceGoal(ctx, items) : null;
    if (rebalanced) {
      return { goal, strategy: "rebalance" as const, note: null, windowEnd, ...rebalanced };
    }
    return {
      goal,
      strategy: "squeeze" as const,
      note: rebalance ? REBALANCE_FALLBACK : null,
      windowEnd,
      rows: squeezeGoal(ctx, items),
      shifts: [] as Shift[],
    };
  });

  // Placement ran tightest window first; the plan lists goals in goal order.
  const order = new Map(seed.goals.map((goal, index) => [goal.id, index]));
  drafts.sort((a, b) => (order.get(a.goal.id) ?? 0) - (order.get(b.goal.id) ?? 0));
  // A manual pick moves only that session, so its options are checked against
  // the saved plan, not against other rows' unsaved suggestions.
  const saved = createContext(seed);
  const goals: GoalPlan[] = drafts.map((draft) => ({
    ...draft,
    rows: draft.rows.map((row) => ({ ...row, options: dayOptions(saved, draft.goal, row.windowEnd) })),
  }));
  return { goals, rows: goals.flatMap((goal) => goal.rows) };
}

/** The moves a goal plan makes: its rows with a day, plus its shifts under rebalance. */
export function goalPlanMoves(plan: GoalPlan): RecoveryMove[] {
  return [
    ...plan.rows.flatMap((row) => (row.date ? [{ sessionId: row.sessionId, to: row.date }] : [])),
    ...(plan.strategy === "rebalance"
      ? plan.shifts.map((shift) => ({ sessionId: shift.sessionId, to: shift.to }))
      : []),
  ];
}

/** "3 sessions slipped" — the calm one-liner for Agenda and the check-in row. */
export function recoveryPromptText(count: number): string {
  return count === 0 ? "Nothing slipped" : `${count} session${count === 1 ? "" : "s"} slipped`;
}

export function windowLabel(goal: GoalPlan): string {
  const until = `Until ${formatDay(goal.windowEnd)}`;
  if (goal.goal.kind === "cadence") {
    return `${until} · ${PERIOD_NAME[goal.goal.interval ?? "daily"]}`;
  }
  return `${until} · ${goal.windowEnd === goal.goal.endDate ? "goal deadline" : "end of plan"}`;
}
