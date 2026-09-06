import {
  JOURNEY_INTRO_SEEN_KEY,
  JOURNEY_ONBOARDING_COMPLETED_KEY,
} from "@/components/intro/journey-intro-overlay";
import { toLocalDateString } from "@/lib/dates/day";

export function canAutoShowDigestAfterOnboarding(
  storage: Pick<Storage, "getItem">,
  today = toLocalDateString()
) {
  if (storage.getItem(JOURNEY_ONBOARDING_COMPLETED_KEY) !== "done") {
    return false;
  }
  return storage.getItem(JOURNEY_INTRO_SEEN_KEY) !== today;
}
