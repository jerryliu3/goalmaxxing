import { describe, expect, it } from "vitest";
import { nextScore, simulateScore } from "./score-model";

describe("proposed goal effort score", () => {
  it("halves after 28 inactive days and never erases the whole score on a missed day", () => {
    let score = 64;
    expect(nextScore(score, 0)).toBeGreaterThan(62);
    for (let day = 0; day < 28; day++) score = nextScore(score, 0);
    expect(score).toBeCloseTo(32, 8);
  });
  it("caps daily credit and stays within 0–100", () => {
    expect(nextScore(50, 100)).toBe(nextScore(50, 3));
    expect(nextScore(100, 3)).toBe(100);
    expect(nextScore(0, 0)).toBe(0);
  });
  it("rewards returning more often and higher effort, while a break decays monotonically", () => {
    const baseline = {
      daysPerWeek: 3,
      completions: 1,
      difficulty: "medium" as const,
      halfLife: 28,
      breakDays: 0,
    };
    const regular = simulateScore(baseline);
    expect(
      simulateScore({ ...baseline, daysPerWeek: 5 }).projected,
    ).toBeGreaterThan(regular.projected);
    expect(
      simulateScore({ ...baseline, difficulty: "hard" }).projected,
    ).toBeGreaterThan(regular.projected);
    const rest = simulateScore({ ...baseline, breakDays: 56 });
    expect(rest.projected).toBeCloseTo(rest.current / 4, 8);
    expect(
      rest.forecast.every((v, i, values) => i === 0 || v < values[i - 1]),
    ).toBe(true);
  });
});
