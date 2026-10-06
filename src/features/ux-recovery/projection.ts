/** Calendar projection: what each day shows, with or without a recovery preview. */
import type { IsoDate } from "@/features/ux-recovery/dates";
import type {
  RecoveryGoal,
  RecoveryPlan,
  RecoverySeed,
  Suggestion,
} from "@/features/ux-recovery/model";

export type CalendarEntryKind =
  | "done"
  | "scheduled"
  /** A past miss shown as the plain calendar shows it — muted, never amber. */
  | "past"
  | "let-go"
  /** Recoverable miss under review, sitting on its original day. */
  | "slipped"
  /** Ghost at the suggested day. */
  | "suggested"
  | "shift-from"
  | "shift-to"
  /** Saved by recovery, at its new day (shown while reviewing). */
  | "recovered";

export interface CalendarEntry {
  key: string;
  sessionId: string;
  goal: RecoveryGoal;
  label: string;
  kind: CalendarEntryKind;
  /** The other end of a move: suggestion date for a slip, origin for a ghost. */
  counterpart: IsoDate | null;
  row: Suggestion | null;
}

/**
 * Entries per day. Without a `preview` plan the calendar looks as it always
 * does: misses are quiet past entries, nothing is suggested. With `marks`
 * (while reviewing) sessions recovery already moved show as recovered.
 */
export function projectDays(
  seed: RecoverySeed,
  preview: RecoveryPlan | null,
  dates: readonly IsoDate[],
  marks = preview !== null
): Map<IsoDate, CalendarEntry[]> {
  const days = new Map<IsoDate, CalendarEntry[]>(dates.map((date) => [date, []]));
  const goals = new Map(seed.goals.map((goal) => [goal.id, goal]));
  const order = new Map(seed.goals.map((goal, index) => [goal.id, index]));
  const rows = new Map((preview?.rows ?? []).map((row) => [row.sessionId, row]));
  const shifts = new Map(
    (preview?.goals ?? []).flatMap((goal) => goal.shifts.map((shift) => [shift.sessionId, shift] as const))
  );

  const push = (date: IsoDate, entry: Omit<CalendarEntry, "key">) => {
    days.get(date)?.push({ ...entry, key: `${entry.sessionId}:${entry.kind}` });
  };

  for (const session of seed.sessions) {
    const goal = goals.get(session.goalId);
    if (!goal) continue;
    const base = { sessionId: session.id, goal, label: session.label, row: null };
    const row = rows.get(session.id);
    const shift = shifts.get(session.id);
    if (row) {
      push(session.date, { ...base, row, kind: "slipped", counterpart: row.date });
      if (row.date) push(row.date, { ...base, row, kind: "suggested", counterpart: session.date });
    } else if (shift) {
      push(shift.from, { ...base, kind: "shift-from", counterpart: shift.to });
      push(shift.to, { ...base, kind: "shift-to", counterpart: shift.from });
    } else if (marks && session.recoveredFrom && session.status === "scheduled") {
      push(session.date, { ...base, kind: "recovered", counterpart: session.recoveredFrom });
    } else {
      const kind =
        session.status === "done"
          ? "done"
          : session.dismissed
            ? "let-go"
            : session.status === "missed"
              ? "past"
              : "scheduled";
      push(session.date, { ...base, kind, counterpart: null });
    }
  }

  for (const entries of days.values()) {
    entries.sort((a, b) => (order.get(a.goal.id) ?? 0) - (order.get(b.goal.id) ?? 0));
  }
  return days;
}

/** The plan narrowed to one goal: only its slips, ghosts and shifts preview. */
export function onlyGoal(plan: RecoveryPlan, goalId: string): RecoveryPlan {
  const goals = plan.goals.filter((goal) => goal.goal.id === goalId);
  return { goals, rows: goals.flatMap((goal) => goal.rows) };
}
