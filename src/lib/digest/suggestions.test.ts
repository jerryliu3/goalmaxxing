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

  it("returns a static fallback for empty model output", () => {
    expect(parseDigestSuggestions(null)).toBeNull();
    expect(fallbackDigestSuggestions("daily").suggestions.length).toBeGreaterThan(0);
  });
});
