import { addMonths, format, parseISO } from "date-fns";
import { buildMonthCells } from "@cadence/shared/planner/month-cells";
import { isValidDate } from "@cadence/shared/planner/calendar-state";
import { TODAY, type Person } from "../model";
export type MonthWork = {
  id: string;
  goal: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  person: Person;
  done: boolean;
  end: string;
  linked?: string;
  recoverable?: boolean;
};
export const MONTH_GOALS = [
  { id: "run", title: "Run a comfortable 10K", letter: "R" },
  { id: "film", title: "Finish the short film", letter: "F" },
  { id: "language", title: "Practice Japanese", letter: "J" },
  {
    id: "storyboard",
    title: "Storyboard the opening — linked to Finish the short film",
    letter: "S",
  },
  { id: "task", title: "One-off tasks", letter: "T" },
] as const;
function work(
  id: string,
  goal: string,
  title: string,
  date: string,
  time: string,
  duration: number,
  person: Person = "you",
): MonthWork {
  return {
    id,
    goal,
    title,
    date,
    time,
    duration,
    person,
    done: date < TODAY,
    end: goal === "run" ? "2026-10-31" : "2026-11-30",
  };
}
export const MONTH_WORK: readonly MonthWork[] = [
  ...[1, 5, 7, 8, 12, 14, 17, 19, 21, 24, 26, 28, 31].map((day, i) =>
    work(
      `run-${day}`,
      "run",
      i % 3 === 2 ? "Long easy run" : "Easy run",
      `2026-10-${String(day).padStart(2, "0")}`,
      "07:30",
      i % 3 === 2 ? 45 : 25,
    ),
  ),
  ...[2, 8, 9, 13, 16, 20, 23, 27, 30].map((day) =>
    work(
      `j-${day}`,
      "language",
      day === 8
        ? "Japanese conversation with a language partner"
        : "Vocabulary & listening",
      `2026-10-${String(day).padStart(2, "0")}`,
      "20:00",
      20,
    ),
  ),
  ...[3, 8, 15, 22, 29, 31].map((day) =>
    work(
      `film-${day}`,
      "film",
      day === 8
        ? "Build the rough cut and refine the opening sequence"
        : "Edit the short film",
      `2026-10-${String(day).padStart(2, "0")}`,
      "18:00",
      50,
    ),
  ),
  ...[5, 8, 10, 12, 17, 19, 24, 26, 31].map((day) =>
    work(
      `alex-${day}`,
      "run",
      "Alex’s easy run",
      `2026-10-${String(day).padStart(2, "0")}`,
      "18:30",
      25,
      "partner",
    ),
  ),
  {
    ...work(
      "linked-8",
      "storyboard",
      "Storyboard the opening sequence",
      "2026-10-08",
      "12:00",
      30,
    ),
    linked: "Finish the short film",
  },
  work(
    "task-8",
    "task",
    "Book the community screening room",
    "2026-10-08",
    "16:00",
    10,
  ),
  {
    ...work(
      "missed-film",
      "film",
      "Choose music for the closing scene",
      "2026-10-06",
      "18:00",
      35,
    ),
    done: false,
    recoverable: true,
  },
  work(
    "sep-film",
    "film",
    "Collect the reference shots",
    "2026-09-29",
    "18:00",
    30,
  ),
  work("nov-film", "film", "Screen the final cut", "2026-11-02", "18:00", 60),
  work(
    "nov-language",
    "language",
    "Conversation practice",
    "2026-11-05",
    "20:00",
    20,
  ),
];
export type MonthState = {
  saved: Record<string, string>;
  draft: Record<string, string>;
  completed: string[];
  letGo: string[];
};
export const INITIAL_MONTH_STATE: MonthState = {
  saved: {},
  draft: {},
  completed: MONTH_WORK.filter((s) => s.done).map((s) => s.id),
  letGo: [],
};
export type MonthAction =
  | { type: "move"; id: string; date: string }
  | { type: "toggle"; id: string }
  | { type: "save" }
  | { type: "undo" }
  | { type: "recover"; id: string; date: string }
  | { type: "let-go"; id: string };
export function monthSessions(state: MonthState) {
  return MONTH_WORK.filter((s) => !state.letGo.includes(s.id))
    .map((s) => ({
      ...s,
      date: state.draft[s.id] ?? state.saved[s.id] ?? s.date,
      done: state.completed.includes(s.id),
    }))
    .sort(
      (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
    );
}
export function canPlace(s: MonthWork, date: string) {
  return (
    s.person === "you" &&
    !s.done &&
    isValidDate(date) &&
    date >= TODAY &&
    date <= s.end
  );
}
export function monthReducer(
  state: MonthState,
  action: MonthAction,
): MonthState {
  if (action.type === "save")
    return { ...state, saved: { ...state.saved, ...state.draft }, draft: {} };
  if (action.type === "undo") return { ...state, draft: {} };
  const s = monthSessions(state).find((s) => s.id === action.id);
  if (!s) return state;
  if (action.type === "toggle") {
    if (s.person !== "you" || s.date > TODAY || state.draft[s.id]) return state;
    return {
      ...state,
      completed: s.done
        ? state.completed.filter((id) => id !== s.id)
        : [...state.completed, s.id],
    };
  }
  if (action.type === "let-go")
    return s.recoverable &&
      s.date < TODAY &&
      !s.done &&
      !Object.keys(state.draft).length
      ? { ...state, letGo: [...state.letGo, s.id] }
      : state;
  if (!canPlace(s, action.date)) return state;
  if (action.type === "recover")
    return s.recoverable && s.date < TODAY && !Object.keys(state.draft).length
      ? { ...state, saved: { ...state.saved, [s.id]: action.date } }
      : state;
  const draft = { ...state.draft };
  if (
    action.date ===
    (state.saved[s.id] ?? MONTH_WORK.find((w) => w.id === s.id)!.date)
  )
    delete draft[s.id];
  else draft[s.id] = action.date;
  return { ...state, draft };
}
export function visibleMonthWork(
  sessions: readonly MonthWork[],
  scope: "Solo" | "Partner" | "Duo",
  goal: string,
) {
  return sessions.filter(
    (s) =>
      (scope === "Duo" ||
        s.person === (scope === "Solo" ? "you" : "partner")) &&
      (goal === "all" || s.goal === goal),
  );
}
export function monthWeeks(month: string) {
  const cells = buildMonthCells(month, 1);
  return Array.from({ length: 6 }, (_, i) =>
    cells.slice(i * 7, i * 7 + 7),
  ).filter((week) => week.some((d) => d.inMonth));
}
export function shiftMonth(month: string, delta: number) {
  return format(addMonths(parseISO(`${month}-01`), delta), "yyyy-MM");
}
export function monthTitle(month: string) {
  return format(parseISO(`${month}-01`), "MMMM yyyy");
}
export function monthTotals(sessions: readonly MonthWork[], month: string) {
  const work = sessions.filter((s) => s.date.startsWith(month));
  return {
    count: work.length,
    minutes: work.reduce((n, s) => n + s.duration, 0),
    days: new Set(work.map((s) => s.date)).size,
  };
}
