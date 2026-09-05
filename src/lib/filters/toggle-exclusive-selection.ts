export function toggleExclusiveSelection<T>(selected: readonly T[], value: T): T[] {
  return selected.length === 1 && selected[0] === value ? [] : [value];
}
