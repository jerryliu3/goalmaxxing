import {
  digestSuggestionsSchema,
  type DigestSuggestions,
} from "@/lib/digest/contract";
import type { DigestKind } from "@/lib/digest/period";

const FALLBACK_BY_KIND: Record<
  DigestKind,
  { motivation: string; title: string; body: string; action: "plan" | "today" }
> = {
  monthly: {
    motivation: "Last month is closed. Decide what this month is actually for.",
    title: "Set up the month",
    body: "Place work for the goals that have nothing on the calendar yet.",
    action: "plan",
  },
  weekly: {
    motivation: "Last week is closed. Place the work that still matters this week.",
    title: "Open this week",
    body: "Scan the week, then move anything that no longer fits.",
    action: "plan",
  },
  daily: {
    motivation: "Yesterday is closed. Start with what is already on today.",
    title: "Open today",
    body: "Check off what’s placed, then recover anything still sitting unplaced.",
    action: "today",
  },
};

export function fallbackDigestSuggestions(kind: DigestKind): DigestSuggestions {
  const fallback = FALLBACK_BY_KIND[kind];
  return digestSuggestionsSchema.parse({
    motivation: fallback.motivation,
    suggestions: [
      {
        title: fallback.title,
        body: fallback.body,
        action: fallback.action,
      },
    ],
  });
}

export function parseDigestSuggestions(value: unknown): DigestSuggestions | null {
  const parsed = digestSuggestionsSchema.safeParse(normalizeSuggestionPayload(value));
  return parsed.success ? parsed.data : null;
}

function normalizeSuggestionPayload(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }
  const record = value as Record<string, unknown>;
  const suggestions = Array.isArray(record.suggestions)
    ? record.suggestions.map((entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
          return entry;
        }
        const suggestion = entry as Record<string, unknown>;
        const action = suggestion.action;
        if (action === "plan" || action === "today" || action === "progress") {
          return suggestion;
        }
        return { ...suggestion, action: null };
      })
    : record.suggestions;
  return { ...record, suggestions };
}
