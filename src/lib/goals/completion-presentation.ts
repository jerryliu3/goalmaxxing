import type { XpRefreshRequestDetail } from "@/lib/xp/events";

const listeners = new Set<(detail: XpRefreshRequestDetail) => void>();
export function subscribeCompletionAchievement(listener: (detail: XpRefreshRequestDetail) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function presentCompletionAchievement(detail: XpRefreshRequestDetail) {
  for (const listener of listeners) listener(detail);
}
