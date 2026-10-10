import { TEAM_SESSIONS, TODAY, type TeamSession } from "../model";
export type Relationship =
  | "Paired"
  | "No partner"
  | "Outgoing invitation"
  | "Incoming invitation"
  | "No shared goals";
export type CheckIn = {
  focus: string;
  support: string;
  published: boolean;
  acknowledged: boolean;
};
export const INITIAL_CHECK_IN: CheckIn = {
  focus: "Finish the rough cut before Friday",
  support: "Could you watch the opening and tell me where it drags?",
  published: false,
  acknowledged: false,
};
export function teamBrief(sessions: readonly TeamSession[]) {
  const recorded = sessions.filter((s) => s.done && s.date <= TODAY);
  return {
    recorded,
    latest: [...recorded].sort((a, b) => b.date.localeCompare(a.date))[0],
    next: [...sessions]
      .filter((s) => !s.done && s.date >= TODAY)
      .sort(
        (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
      ),
    people: (["you", "partner"] as const).map((person) => ({
      person,
      count: recorded.filter((s) => s.person === person).length,
    })),
  };
}
export function recordOwnSession(sessions: readonly TeamSession[], id: string) {
  return sessions.map((s) =>
    s.id === id && s.person === "you" && s.date <= TODAY
      ? { ...s, done: !s.done }
      : s,
  );
}
export function publishCheckIn(checkIn: CheckIn): CheckIn {
  return checkIn.focus.trim()
    ? {
        ...checkIn,
        focus: checkIn.focus.trim(),
        support: checkIn.support.trim(),
        published: true,
        acknowledged: false,
      }
    : checkIn;
}
export const INITIAL_TEAM_SESSIONS = [...TEAM_SESSIONS];
