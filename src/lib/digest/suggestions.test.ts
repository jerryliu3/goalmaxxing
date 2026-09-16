import { describe, expect, it } from "vitest";
import { fallbackDigestSuggestions, parseDigestSuggestions } from "./suggestions";

describe("parseDigestSuggestions", () => {
  it("accepts a valid Gemini payload", () => {
    expect(
      parseDigestSuggestions({
        motivation: "Keep Strength on the calendar.",
        suggestions: [
          {
            title: "Recover Strength",
            body: "Move yesterday’s open session onto a day that still has room.",
            action: "plan",
          },
        ],
      })
    ).toMatchObject({
      motivation: "Keep Strength on the calendar.",
    });
  });

  it("drops unknown actions instead of failing the digest", () => {
    const parsed = parseDigestSuggestions({
      motivation: "Start with today.",
      suggestions: [
        {
          title: "Open today",
          body: "Check off what’s already placed.",
          action: "unknown",
        },
      ],
    });
    expect(parsed?.suggestions[0]?.action).toBeNull();
  });

  it("keeps the goal-creation action the monthly check-in can use", () => {
    const parsed = parseDigestSuggestions({
      motivation: "New month.",
      suggestions: [
        { title: "Add a goal", body: "Decide what this month is for.", action: "goals" },
      ],
    });
    expect(parsed?.suggestions[0]?.action).toBe("goals");
  });

  it("returns a static fallback for empty model output", () => {
    expect(parseDigestSuggestions(null)).toBeNull();
    expect(fallbackDigestSuggestions("daily").suggestions.length).toBeGreaterThan(0);
  });

  it("has a fallback for every cadence, each pointing somewhere useful", () => {
    for (const kind of ["daily", "weekly", "monthly"] as const) {
      const fallback = fallbackDigestSuggestions(kind);
      expect(fallback.motivation.length).toBeGreaterThan(0);
      expect(fallback.suggestions).toHaveLength(1);
      expect(fallback.suggestions[0]?.action).not.toBeNull();
    }
  });

  it("sends the monthly fallback at setting the month up", () => {
    expect(fallbackDigestSuggestions("monthly").suggestions[0]).toMatchObject({
      title: "Set up the month",
      action: "plan",
    });
  });
});
