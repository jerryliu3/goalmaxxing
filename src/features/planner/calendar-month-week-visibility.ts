export type MonthWeekBand = "previous" | "current" | "next";

export function groupMonthGridWeeks<T>(cells: readonly T[]): T[][] {
  const weeks: T[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7) as T[]);
  }
  return weeks;
}

export function classifyMonthGridWeeks(
  weeks: ReadonlyArray<ReadonlyArray<{ inMonth: boolean }>>
): MonthWeekBand[] {
  const firstCurrent = weeks.findIndex((week) =>
    week.some((cell) => cell.inMonth)
  );
  const lastCurrent = weeks.findLastIndex((week) =>
    week.some((cell) => cell.inMonth)
  );
  return weeks.map((_, index) => {
    if (firstCurrent < 0) {
      return "current";
    }
    if (index < firstCurrent) {
      return "previous";
    }
    if (index > lastCurrent) {
      return "next";
    }
    return "current";
  });
}

export function isMonthWeekVisible(
  band: MonthWeekBand,
  shown: { previous: boolean; next: boolean }
) {
  if (band === "previous") {
    return shown.previous;
  }
  if (band === "next") {
    return shown.next;
  }
  return true;
}

export function shouldShowAdjacentMonthToggle({
  hasAdjacentWeeks,
  adjacentShown,
  edgeVisible,
}: {
  hasAdjacentWeeks: boolean;
  adjacentShown: boolean;
  edgeVisible: boolean;
}) {
  if (!hasAdjacentWeeks) {
    return false;
  }
  if (adjacentShown) {
    return true;
  }
  return edgeVisible;
}
