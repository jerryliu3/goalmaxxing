import { format, isValid, parse } from "date-fns";

export type PlannerShellTab = "today" | "not-today" | "calendar";
export type SurfaceKey = "checklist" | "calendar";
export type PlannerCalendarViewMode = "month" | "week" | "three_day" | "day";

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
const datePattern = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function isValidMonth(value: string | null): value is string {
  return Boolean(value && monthPattern.test(value));
}

export function isValidDate(value: string | null): value is string {
  if (!value || !datePattern.test(value)) {
    return false;
  }
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  return isValid(parsed) && format(parsed, "yyyy-MM-dd") === value;
}

export function isValidCalendarViewMode(
  value: string | null | undefined
): value is PlannerCalendarViewMode {
  return (
    value === "month" ||
    value === "week" ||
    value === "three_day" ||
    value === "day"
  );
}

export function getTodayDateParam() {
  return format(new Date(), "yyyy-MM-dd");
}

export function getSurfaceKey(tab: PlannerShellTab): SurfaceKey {
  return tab === "calendar" ? "calendar" : "checklist";
}

export interface CalendarState {
  tab: PlannerShellTab;
  month: string | null;
  day: string | null;
  viewMode: PlannerCalendarViewMode;
}

export function resolveDayInMonth({
  month,
  preferredDay,
  today,
}: {
  month: string;
  preferredDay: string | null;
  today: string;
}): string {
  if (
    preferredDay &&
    isValidDate(preferredDay) &&
    preferredDay.startsWith(`${month}-`)
  ) {
    return preferredDay;
  }
  if (today.startsWith(`${month}-`) && isValidDate(today)) {
    return today;
  }
  if (preferredDay && isValidDate(preferredDay)) {
    const candidate = `${month}-${preferredDay.slice(8, 10)}`;
    if (isValidDate(candidate)) {
      return candidate;
    }
    for (let day = 31; day >= 28; day -= 1) {
      const next = `${month}-${String(day).padStart(2, "0")}`;
      if (isValidDate(next)) {
        return next;
      }
    }
  }
  return `${month}-01`;
}

function applyCalendarViewInvariants(
  month: string | null,
  day: string | null,
  viewMode: PlannerCalendarViewMode
): Pick<CalendarState, "month" | "day" | "viewMode"> {
  const today = getTodayDateParam();
  const validMonth = isValidMonth(month) ? month : null;
  const validDay = isValidDate(day) ? day : null;
  const resolvedDay =
    validDay ??
    (validMonth
      ? resolveDayInMonth({ month: validMonth, preferredDay: null, today })
      : today);
  return {
    day: resolvedDay,
    month: resolvedDay.slice(0, 7),
    viewMode,
  };
}

export function normalizeCalendarState({
  tab = "today",
  month = null,
  day = null,
  viewMode,
  defaultCalendarViewMode,
  surface = "checklist-shell",
}: {
  tab?: string | null;
  month?: string | null;
  day?: string | null;
  viewMode?: string | null;
  defaultCalendarViewMode: PlannerCalendarViewMode;
  surface?: "checklist-shell" | "calendar";
}): CalendarState {
  const validMonth = isValidMonth(month) ? month : null;
  const validDay = isValidDate(day) ? day : null;
  const rawViewValid = isValidCalendarViewMode(viewMode);
  let resolvedView: PlannerCalendarViewMode = rawViewValid
    ? viewMode
    : defaultCalendarViewMode;

  if (surface === "calendar") {
    return {
      tab: "calendar",
      ...applyCalendarViewInvariants(validMonth, validDay, resolvedView),
    };
  }

  const hasExplicitTab =
    tab === "today" || tab === "not-today" || tab === "calendar";
  let resolvedTab: PlannerShellTab = hasExplicitTab ? tab : "today";

  if (validDay && (!hasExplicitTab || resolvedTab === "calendar")) {
    resolvedTab = "calendar";
    if (!rawViewValid && resolvedView !== "day") {
      resolvedView = "day";
    }
  }

  if (resolvedTab === "calendar") {
    return {
      tab: "calendar",
      ...applyCalendarViewInvariants(
        validDay ? validDay.slice(0, 7) : validMonth,
        validDay,
        resolvedView
      ),
    };
  }

  return {
    tab: resolvedTab,
    month: validMonth,
    day: validDay,
    viewMode: resolvedView,
  };
}
