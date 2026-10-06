/** Calendar projection: what each day shows before and after the pending review. */
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
  /** A past miss that is not recoverable (past period) — muted, never amber. */
  | "past"
  | "let-go"
  /** Recoverable miss, sitting on its original day. */
  | "slipped"
  /** Ghost at the suggested day. */
  | "suggested"
  | "shift-from"
  | "shift-to";

export interface CalendarEntry {
  key: string;
  sessionId: string;
  goal: RecoveryGoal;
  label: string;
  kind: CalendarEntryKind;
  /** The decision is made (accepted/edited, or its goal has an accepted row). */
  accepted: boolean;
  /** The other end of a move: suggestion date for a slip, origin for a ghost. */
  counterpart: IsoDate | null;
  row: Suggestion | null;
}

export function projectDays(
  seed: RecoverySeed,
  plan: RecoveryPlan,
  dates: readonly IsoDate[]
): Map<IsoDate, CalendarEntry[]> {
  const days = new Map<IsoDate, CalendarEntry[]>(dates.map((date) => [date, []]));
  const goals = new Map(seed.goals.map((goal) => [goal.id, goal]));
  const order = new Map(seed.goals.map((goal, index) => [goal.id, index]));
  const rows = new Map(plan.rows.map((row) => [row.sessionId, row]));
  const dismissed = new Set(plan.dismissedIds);
  const shifts = new Map(
    plan.goals.flatMap((goal) => {
      const accepted = goal.rows.some((row) => row.status !== "pending");
      return goal.shifts.map((shift) => [shift.sessionId, { shift, accepted }] as const);
    })
  );

  const push = (date: IsoDate, entry: Omit<CalendarEntry, "key">) => {
    days.get(date)?.push({ ...entry, key: `${entry.sessionId}:${entry.kind}` });
  };

  for (const session of seed.sessions) {
    const goal = goals.get(session.goalId);
    if (!goal) continue;
    const base = { sessionId: session.id, goal, label: session.label, row: null };
    const row = rows.get(session.id);
    const moved = shifts.get(session.id);
    if (row) {
      const accepted = row.status !== "pending";
      push(session.date, { ...base, row, kind: "slipped", accepted, counterpart: row.date });
      if (row.date) {
        push(row.date, { ...base, row, kind: "suggested", accepted, counterpart: session.date });
      }
    } else if (moved) {
      const { shift, accepted } = moved;
      push(shift.from, { ...base, kind: "shift-from", accepted, counterpart: shift.to });
      push(shift.to, { ...base, kind: "shift-to", accepted, counterpart: shift.from });
    } else {
      const kind =
        session.status === "done"
          ? "done"
          : dismissed.has(session.id) || session.dismissed
            ? "let-go"
            : session.status === "missed"
              ? "past"
              : "scheduled";
      push(session.date, { ...base, kind, accepted: false, counterpart: null });
    }
  }

  for (const entries of days.values()) {
    entries.sort((a, b) => (order.get(a.goal.id) ?? 0) - (order.get(b.goal.id) ?? 0));
  }
  return days;
}

/** Same plan with suggestions hidden: slipped chips stay, ghosts and shifts go. */
export function withoutPreview(plan: RecoveryPlan): RecoveryPlan {
  const rows = plan.rows.map((row) => ({ ...row, date: null, shifts: [] }));
  return {
    ...plan,
    rows,
    goals: plan.goals.map((goal) => ({
      ...goal,
      shifts: [],
      rows: rows.filter((row) => row.goalId === goal.goal.id),
    })),
  };
}
