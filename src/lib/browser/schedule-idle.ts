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

export function scheduleDelayedIdleTask(
  task: () => void,
  delayMs: number,
  idleTimeoutMs = 2000
) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  let cancelIdle: (() => void) | undefined;
  const timeoutId = window.setTimeout(() => {
    cancelIdle = scheduleIdleTask(task, idleTimeoutMs);
  }, delayMs);
  return () => {
    window.clearTimeout(timeoutId);
    cancelIdle?.();
  };
}
