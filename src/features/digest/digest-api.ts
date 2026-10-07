import type { DigestSuggestionAction } from "@/lib/digest/contract";
import {
  RECOVERY_REVIEW_PARAM,
  RECOVERY_REVIEW_VALUE,
} from "@/features/planner/recovery/review-link";
export type { DigestPayload } from "@cadence/shared/coach/check-in";

export const DIGEST_OPEN_EVENT = "cadence.digest.open";

export function requestDigestOpen() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(DIGEST_OPEN_EVENT));
}

function trimPrefix(hrefPrefix: string) {
  return hrefPrefix.endsWith("/") ? hrefPrefix.slice(0, -1) : hrefPrefix;
}

/** The recover row opens Agenda straight into the recovery review. */
export function recoveryReviewHref(hrefPrefix = "") {
  return `${trimPrefix(hrefPrefix)}/calendar?surface=calendar&${RECOVERY_REVIEW_PARAM}=${RECOVERY_REVIEW_VALUE}`;
}

export function digestActionHref(
  action: DigestSuggestionAction | null,
  hrefPrefix = ""
) {
  const prefix = trimPrefix(hrefPrefix);
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
