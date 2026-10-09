export const TODAY = "2026-10-08";
export type Person = "you" | "partner";
export type TeamSession = {
  id: string;
  goal: string;
  title: string;
  date: string;
  time: string;
  person: Person;
  done: boolean;
};
export const TEAM_GOALS = [
  {
    id: "run",
    title: "Run a comfortable 10K",
    detail: "Three runs a week · October",
    target: 12,
  },
  {
    id: "film",
    title: "Finish the short film",
    detail: "Six editing sessions · October",
    target: 6,
  },
] as const;
export const TEAM_SESSIONS: readonly TeamSession[] = [
  {
    id: "r1",
    goal: "run",
    title: "Easy run",
    date: "2026-10-05",
    time: "07:30",
    person: "you",
    done: true,
  },
  {
    id: "r2",
    goal: "run",
    title: "Easy run",
    date: "2026-10-05",
    time: "18:00",
    person: "partner",
    done: true,
  },
  {
    id: "f1",
    goal: "film",
    title: "Select the opening shots",
    date: "2026-10-06",
    time: "18:00",
    person: "partner",
    done: true,
  },
  {
    id: "r3",
    goal: "run",
    title: "Tempo run",
    date: "2026-10-07",
    time: "07:30",
    person: "you",
    done: true,
  },
  {
    id: "f2",
    goal: "film",
    title: "Build the rough cut",
    date: TODAY,
    time: "18:00",
    person: "you",
    done: false,
  },
  {
    id: "r4",
    goal: "run",
    title: "Easy run",
    date: TODAY,
    time: "07:30",
    person: "partner",
    done: true,
  },
  {
    id: "f3",
    goal: "film",
    title: "Review the rough cut",
    date: "2026-10-09",
    time: "18:00",
    person: "partner",
    done: false,
  },
  {
    id: "r5",
    goal: "run",
    title: "Long run",
    date: "2026-10-10",
    time: "09:00",
    person: "you",
    done: false,
  },
];
export const WEEK = Array.from(
  { length: 7 },
  (_, i) => `2026-10-${String(i + 5).padStart(2, "0")}`,
);
export function dateLabel(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}
export function weekActivity(sessions: readonly TeamSession[]) {
  return WEEK.map((date) => ({
    date,
    future: date > TODAY,
    you: sessions.filter((s) => s.date === date && s.person === "you" && s.done)
      .length,
    partner: sessions.filter(
      (s) => s.date === date && s.person === "partner" && s.done,
    ).length,
    planned: sessions.filter((s) => s.date === date && !s.done).length,
  }));
}
export function moveSession(
  sessions: readonly TeamSession[],
  id: string,
  date: string,
): TeamSession[] {
  if (!WEEK.includes(date) || date < TODAY) return [...sessions];
  return sessions.map((s) =>
    s.id === id && s.person === "you" && !s.done ? { ...s, date } : s,
  );
}
