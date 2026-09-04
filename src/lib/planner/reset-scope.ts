import { addMonths, format } from "date-fns";
import { parseMonth } from "@/features/planner/calendar-format";

export function buildPlannerHorizonScopeMonths({
  asOfDate,
  scopeMonth,
  viewedMonth,
  horizonMonths = 24,
}: {
  asOfDate: string;
  scopeMonth: string;
  viewedMonth: string | null;
  horizonMonths?: number;
}) {
  const asOfMonth = asOfDate.slice(0, 7);
  const scopeMonthsToProcess = new Set<string>([
    scopeMonth,
    ...(viewedMonth ? [viewedMonth] : []),
  ]);
  for (let monthOffset = 0; monthOffset < horizonMonths; monthOffset += 1) {
    scopeMonthsToProcess.add(
      format(addMonths(parseMonth(asOfMonth), monthOffset), "yyyy-MM")
    );
  }
  return Array.from(scopeMonthsToProcess).sort((left, right) =>
    left.localeCompare(right)
  );
}
