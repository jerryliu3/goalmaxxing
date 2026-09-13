// Study-only hypothesis. No production progress or XP dependencies.
export const DIFFICULTY_WEIGHT = { easy: 0.75, medium: 1, hard: 1.5 } as const;
export type Difficulty = keyof typeof DIFFICULTY_WEIGHT;
export const DAILY_CAP = 3;
export const DEFAULT_HALF_LIFE = 28;
export function nextScore(
  previous: number,
  credits: number,
  halfLife = DEFAULT_HALF_LIFE,
): number {
  const retention = 2 ** (-1 / halfLife);
  return Math.max(
    0,
    Math.min(
      100,
      retention * previous +
        ((1 - retention) * 100 * Math.min(DAILY_CAP, Math.max(0, credits))) /
          DAILY_CAP,
    ),
  );
}
export function simulateScore({
  daysPerWeek,
  completions,
  difficulty,
  halfLife,
  breakDays,
}: {
  daysPerWeek: number;
  completions: number;
  difficulty: Difficulty;
  halfLife: number;
  breakDays: number;
}) {
  // Same 12-week history in every concept. Two medium completions on five days/week.
  const history: number[] = [0];
  let earnedCompletions = 0;
  for (let day = 0; day < 84; day++) {
    const dailyCompletions = day % 7 < 5 ? 2 : 0;
    earnedCompletions += dailyCompletions;
    history.push(nextScore(history.at(-1)!, dailyCompletions, halfLife));
  }
  const forecast = [history.at(-1)!];
  for (let day = 0; day < 56; day++) {
    const active =
      day >= breakDays &&
      Math.floor(((((day - breakDays) % 7) + 1) * daysPerWeek) / 7) >
        Math.floor((((day - breakDays) % 7) * daysPerWeek) / 7);
    forecast.push(
      nextScore(
        forecast.at(-1)!,
        active ? completions * DIFFICULTY_WEIGHT[difficulty] : 0,
        halfLife,
      ),
    );
  }
  return {
    history,
    forecast,
    earnedCompletions,
    current: history.at(-1)!,
    projected: forecast.at(-1)!,
  };
}
export function scoreBand(score: number) {
  if (score < 20) return "Taking root";
  if (score < 40) return "Building";
  if (score < 60) return "Steady";
  if (score < 80) return "Strong";
  return "Flourishing";
}
