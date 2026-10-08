export const SAMPLE_DATE = "2026-10-08";
export const SAMPLE_GOALS = [
  {
    id: "run",
    name: "Run a comfortable 10K",
    category: "Health",
    target: 12,
    artifact: 0,
  },
  {
    id: "language",
    name: "Practice Japanese",
    category: "Personal",
    target: 20,
    artifact: 1,
  },
  {
    id: "film",
    name: "Finish the short film",
    category: "Career",
    target: 6,
    artifact: 2,
  },
] as const;
export type SampleGoalId = (typeof SAMPLE_GOALS)[number]["id"];
export const INITIAL_LOG: Record<SampleGoalId, number[]> = {
  run: [1, 3, 5, 7],
  language: [1, 2, 3, 4, 6, 7],
  film: [2, 6],
};
export function sampleDayLabel(day: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2026, 9, day)));
}
export function dayCount(
  log: Record<SampleGoalId, number[]>,
  selected: readonly SampleGoalId[],
  day: number,
) {
  return selected.reduce(
    (count, id) => count + Number(log[id].includes(day)),
    0,
  );
}
export function toggleSampleCompletion(
  log: Record<SampleGoalId, number[]>,
  id: SampleGoalId,
  day: number,
) {
  if (!Number.isInteger(day) || day < 1 || day > 8) return log;
  return {
    ...log,
    [id]: log[id].includes(day)
      ? log[id].filter((value) => value !== day)
      : [...log[id], day].sort((a, b) => a - b),
  };
}
export const SAMPLE_SESSIONS = [
  { id: "run-5", goalId: "run", name: "Easy run", day: 5, time: "07:30" },
  {
    id: "language-6",
    goalId: "language",
    name: "Japanese practice",
    day: 6,
    time: "20:00",
  },
  { id: "film-7", goalId: "film", name: "Rough cut", day: 7, time: "18:00" },
  { id: "run-8", goalId: "run", name: "Easy run", day: 8, time: "07:30" },
  {
    id: "language-8",
    goalId: "language",
    name: "Japanese practice",
    day: 8,
    time: "20:00",
  },
  { id: "film-9", goalId: "film", name: "Sound edit", day: 9, time: "18:00" },
  { id: "run-10", goalId: "run", name: "Long run", day: 10, time: "09:00" },
] as const;
export const MISSED_SESSIONS = [
  {
    id: "miss-run",
    name: "Easy run",
    goal: "Run a comfortable 10K",
    missed: "Mon Oct 5",
    suggested: "2026-10-08",
  },
  {
    id: "miss-film",
    name: "Rough cut",
    goal: "Finish the short film",
    missed: "Wed Oct 7",
    suggested: "2026-10-09",
  },
] as const;
export type RecoveryChoice = { date: string } | { letGo: true };
export type RecoveryDraft = Record<string, RecoveryChoice>;
export function recoveryDescription(choice: RecoveryChoice) {
  return "letGo" in choice ? "Let go" : `Move to ${choice.date}`;
}
export const HISTORY = [
  {
    id: "a",
    title: "Finish the first cut",
    year: 2026,
    month: "September",
    outcome: "Accomplished",
    detail: "A film ready to share. Finished Sep 24.",
  },
  {
    id: "b",
    title: "Read six books",
    year: 2026,
    month: "September",
    outcome: "Ended · 4 of 6",
    detail: "Four books read. Two remained when the goal ended Sep 30.",
  },
  {
    id: "c",
    title: "Run a half marathon",
    year: 2026,
    month: "August",
    outcome: "Accomplished",
    detail: "Finished Aug 23. Reward: new trail shoes.",
  },
  {
    id: "d",
    title: "Build a reading habit",
    year: 2025,
    month: "December",
    outcome: "Accomplished",
    detail: "Twelve evenings made room for reading. Finished Dec 28.",
  },
  {
    id: "e",
    title: "Learn the basics of Japanese",
    year: 2025,
    month: "June",
    outcome: "Ended · 16 of 20",
    detail: "Sixteen practice sessions logged by Jun 30.",
  },
];
export const PIN_CATALOG = [
  {
    id: "level8",
    name: "Level 8",
    kind: "Medals",
    detail: "Earned Sep 28, 2026",
  },
  {
    id: "level6",
    name: "Level 6",
    kind: "Medals",
    detail: "Earned Jul 14, 2026",
  },
  {
    id: "streak",
    name: "Best day streak · 21 days",
    kind: "Records",
    detail: "Set in August 2026",
  },
  {
    id: "week",
    name: "Best week · 12 completions",
    kind: "Records",
    detail: "Week of Sep 21, 2026",
  },
  {
    id: "half",
    name: "Run a half marathon",
    kind: "Finished goals",
    detail: "Finished Aug 23, 2026",
  },
  {
    id: "cut",
    name: "Finish the first cut",
    kind: "Finished goals",
    detail: "Finished Sep 24, 2026",
  },
] as const;
