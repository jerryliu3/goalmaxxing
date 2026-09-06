import {
  digestSuggestionsSchema,
  type DigestSuggestions,
} from "@/lib/digest/contract";
import type { DigestKind } from "@/lib/digest/period";

export function fallbackDigestSuggestions(kind: DigestKind): DigestSuggestions {
  return digestSuggestionsSchema.parse({
    motivation:
      kind === "weekly"
        ? "Last week is closed. Place the work that still matters this week."
        : "Yesterday is closed. Start with what is already on today.",
    suggestions: [
      {
        title: kind === "weekly" ? "Open this week" : "Open today",
        body:
          kind === "weekly"
            ? "Scan the week, then move anything that no longer fits."
            : "Check off what’s placed, then recover anything still sitting unplaced.",
        action: kind === "weekly" ? "plan" : "today",
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
