import { TEAM_SESSIONS, TODAY, type TeamSession } from "./model";
export const APP_GOALS = [
  { id: "run", title: "Run a comfortable 10K", category: "Health" },
  { id: "film", title: "Finish the short film", category: "Career" },
  { id: "language", title: "Practice Japanese", category: "Personal" },
] as const;
export const APP_SESSIONS: readonly TeamSession[] = [
  ...TEAM_SESSIONS.filter((session) => session.person === "you"),
  {
    id: "r6",
    goal: "run",
    title: "Easy run",
    date: TODAY,
    time: "07:30",
    person: "you",
    done: false,
  },
  {
    id: "j1",
    goal: "language",
    title: "Conversation practice",
    date: TODAY,
    time: "20:00",
    person: "you",
    done: false,
  },
  {
    id: "j2",
    goal: "language",
    title: "Vocabulary review",
    date: "2026-10-09",
    time: "20:00",
    person: "you",
    done: false,
  },
];
export function appSessions(
  dates: Record<string, string>,
  completed: readonly string[],
) {
  return APP_SESSIONS.map((session) => ({
    ...session,
    date: dates[session.id] ?? session.date,
    done: completed.includes(session.id),
  })).sort(
    (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
  );
}
export const INITIAL_COMPLETED = APP_SESSIONS.filter(
  (session) => session.done,
).map((session) => session.id);
export const STORY_PLAN = [
  { id: "mon", date: "2026-10-05", title: "Easy run", duration: "25 min" },
  { id: "wed", date: "2026-10-07", title: "Tempo run", duration: "30 min" },
  { id: "thu", date: TODAY, title: "Easy run", duration: "25 min" },
];
export function storyPlan(twoSessions: boolean, moved: boolean) {
  return STORY_PLAN.filter(
    (session) => !twoSessions || session.id !== "wed",
  ).map((session) => ({
    ...session,
    date: moved && session.id === "thu" ? "2026-10-09" : session.date,
  }));
}
