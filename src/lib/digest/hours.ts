/**
 * Per-session minutes live on `execution_plan_items`, which is not readable by
 * the authenticated client, so the check-in derives workload from the session
 * count and the planner's own default session length. The UI states the rate so
 * the number reads as the estimate it is.
 */
export const DIGEST_DEFAULT_SESSION_MINUTES = 30;

export function estimateSessionMinutes(sessions: number) {
  return Math.max(0, Math.trunc(sessions)) * DIGEST_DEFAULT_SESSION_MINUTES;
}

export function formatEstimatedDuration(minutes: number) {
  const total = Math.max(0, Math.trunc(minutes));
  if (total === 0) {
    return "0m";
  }
  const hours = Math.floor(total / 60);
  const remainder = total % 60;
  if (hours === 0) {
    return `${remainder}m`;
  }
  if (remainder === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainder}m`;
}
