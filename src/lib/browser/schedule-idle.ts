export function scheduleIdleTask(task: () => void, timeoutMs = 2000) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  if (typeof window.requestIdleCallback === "function") {
    const idleId = window.requestIdleCallback(task, { timeout: timeoutMs });
    return () => {
      window.cancelIdleCallback(idleId);
    };
  }

  const timeoutId = window.setTimeout(task, 1);
  return () => {
    window.clearTimeout(timeoutId);
  };
}
