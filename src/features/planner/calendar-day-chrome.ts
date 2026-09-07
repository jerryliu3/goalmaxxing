import { cn } from "@/lib/utils";

/**
 * Calendar tile chrome:
 * - Today: solid today token (Original blue level 3 / Gazetteer rust level 2).
 * - Adjacent months: adjacent token (Original and Gazetteer grey L1 `#e4e4e7`).
 * - Selected day that is not today: day-selected token (Original blue level 2 /
 *   Gazetteer copper level 1).
 */
export function planMonthDaySurfaceClass({
  inMonth,
  isToday,
  isSelected,
  isPastInMonth,
}: {
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isPastInMonth: boolean;
}): string {
  if (isToday) {
    return "border-today bg-today text-today-foreground hover:border-today";
  }
  if (isSelected) {
    return "border-day-selected bg-day-selected text-day-selected-foreground hover:border-day-selected";
  }
  if (!inMonth) {
    return "border-adjacent bg-adjacent text-adjacent-foreground hover:border-adjacent";
  }
  if (isPastInMonth) {
    return "border-border bg-muted/25 hover:border-primary/40";
  }
  return "border-border bg-background hover:border-primary/50";
}

export function planMonthDayNumberClass({
  inMonth,
  isToday,
  isSelected = false,
}: {
  inMonth: boolean;
  isToday: boolean;
  isSelected?: boolean;
}): string {
  if (isToday) {
    return "text-today-foreground";
  }
  if (isSelected) {
    return "text-day-selected-foreground";
  }
  if (!inMonth) {
    return "text-adjacent-foreground";
  }
  return "text-foreground";
}

export function planAgendaDayRowClass({
  inMonth,
  isToday,
  isSelected,
}: {
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}): string {
  return cn(
    "border-b border-border/70 last:border-b-0",
    isToday && "bg-today text-today-foreground",
    !isToday && isSelected && "bg-day-selected text-day-selected-foreground",
    !isToday && !isSelected && !inMonth && "bg-adjacent text-adjacent-foreground"
  );
}

export function planAgendaDayNumberClass({
  isToday,
  isSelected,
}: {
  isToday: boolean;
  isSelected: boolean;
}): string {
  return cn(
    "mt-0.5 inline-flex size-8 items-center justify-center rounded-full text-lg font-semibold leading-none",
    isToday && "bg-today-foreground text-today",
    !isToday && isSelected && "bg-day-selected-foreground text-day-selected"
  );
}

export function planFilledChromeMetaClass({
  inMonth,
  isToday,
  isSelected,
}: {
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}): string {
  return isToday || isSelected || !inMonth
    ? "text-current opacity-75"
    : "text-muted-foreground";
}

export function planSelectedWorkRowClass(selected: boolean) {
  if (!selected) {
    return "";
  }
  return "bg-day-selected text-day-selected-foreground shadow-[inset_3px_0_0_var(--color-selection)]";
}
