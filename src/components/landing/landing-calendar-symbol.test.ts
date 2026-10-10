import { describe, expect, it } from "vitest";
import { landingCalendarSymbol } from "./landing-calendar-symbol";

describe("marketing month short labels", () => {
  it.each([["Tempo run", "🏃"], ["Strength", "🏋️"], ["Read 10 pages", "📖"], ["Deep work", "💻"], ["Budget review", "📝"], ["A custom goal", "✦"]])("keeps %s identifiable in a narrow cell", (label, symbol) => {
    expect(landingCalendarSymbol(label)).toBe(symbol);
  });
});
