export const COMPLETION_STAMP_SECONDS = 0.45;
export const COMPLETION_STAMP_IMPACT_MS = 60;
import type { ViewportRectSnapshot } from "@/lib/xp/events";

export interface CompletionMotionStart { sourceRect: ViewportRectSnapshot; startedAt: number }
const listeners = new Set<(detail: CompletionMotionStart) => void>();
export function startCompletionMotion(sourceRect: ViewportRectSnapshot) {
  const detail = { sourceRect, startedAt: performance.now() };
  for (const listener of listeners) listener(detail);
  return detail.startedAt;
}
export function subscribeCompletionMotion(listener: (detail: CompletionMotionStart) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
