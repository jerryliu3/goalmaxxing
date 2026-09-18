/** Normalize presentation counts; eligibility comes from canonical goal summaries. */
export function getRewardProgress(completed: number, target: number) {
  const required = Number.isFinite(target) ? Math.max(1, Math.floor(target)) : 1;
  const credited = Number.isFinite(completed) ? Math.max(0, Math.min(required, Math.floor(completed))) : 0;
  return { required, credited, fraction: credited / required, earned: credited === required };
}

