import { toLocalDateString } from "@/lib/dates/day";

export function canAutoShowDigestAfterOnboarding(completedAt: string | null | undefined, today = toLocalDateString()) {
  return Boolean(completedAt && toLocalDateString(new Date(completedAt)) < today);
}
