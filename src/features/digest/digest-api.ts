import type {
  DigestFacts,
  DigestSuggestionAction,
  DigestSuggestions,
} from "@/lib/digest/contract";
import type { DigestKind } from "@/lib/digest/period";

export interface DigestPayload {
  schemaVersion: "1";
  id: string; factsDigest: string; historicalFacts: DigestFacts; generatedAt: string | null;
  kind: DigestKind;
  periodKey: string;
  localDate: string;
  digestAutoShow: boolean;
  acknowledged: boolean;
  shouldAutoShow: boolean;
  facts: DigestFacts;
  suggestions: DigestSuggestions | null;
  correlationId?: string;
}

export const DIGEST_OPEN_EVENT = "cadence.digest.open";

export function requestDigestOpen() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(DIGEST_OPEN_EVENT));
}

export function digestActionHref(
  action: DigestSuggestionAction | null,
  hrefPrefix = ""
) {
  const prefix = hrefPrefix.endsWith("/") ? hrefPrefix.slice(0, -1) : hrefPrefix;
  if (action === "today") {
    return `${prefix}/calendar?surface=checklist`;
  }
  if (action === "plan") {
    return `${prefix}/calendar?surface=calendar`;
  }
  if (action === "progress") {
    return `${prefix}/insights`;
  }
  if (action === "goals") {
    // No `returnTo`: the goal sheet falls back to `router.back()`, which lands
    // the user wherever the check-in interrupted them.
    return `${prefix}/goals/new`;
  }
  return null;
}
