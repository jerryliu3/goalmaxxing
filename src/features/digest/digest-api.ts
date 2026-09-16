import type { DigestFacts, DigestSuggestions } from "@/lib/digest/contract";
import type { DigestKind } from "@/lib/digest/period";

export interface DigestPayload {
  schemaVersion: "1";
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
  action: "plan" | "today" | "progress" | null,
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
  return null;
}
