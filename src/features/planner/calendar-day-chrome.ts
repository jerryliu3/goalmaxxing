import { cn } from "@/lib/utils";

/**
 * Calendar tile chrome:
 * - Today: solid secondary pair.
 * - Adjacent months: opaque Zinc grey (Original 200/700, Gazetteer 300/600).
 * - Selected day: selection outline on top of the fill, including today.
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
    return cn(
      "border-today bg-today text-today-foreground hover:border-today",
      isSelected && "ring-2 ring-inset ring-today-foreground"
    );
  }
  if (isSelected) {
    return "border-selection bg-background text-foreground ring-2 ring-inset ring-selection hover:border-selection";
  }
  if (!inMonth) {
    return "isolate border-adjacent bg-adjacent text-adjacent-foreground hover:border-adjacent";
  }
  if (isPastInMonth) {
    return "border-border bg-muted/25 hover:border-selection/40";
  }
  return "border-border bg-background hover:border-selection/50";
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
    return "text-foreground";
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
    isSelected && (isToday ? "ring-2 ring-inset ring-today-foreground" : "ring-2 ring-inset ring-selection"),
    !isToday && !isSelected && !inMonth && "isolate bg-adjacent text-adjacent-foreground"
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
    isSelected && !isToday && "text-foreground ring-2 ring-inset ring-selection"
  );
}

export function planFilledChromeMetaClass({
  inMonth,
  isToday,
}: {
  inMonth: boolean;
  isToday: boolean;
  isSelected?: boolean;
}): string {
  return isToday || !inMonth
    ? "text-current opacity-75"
    : "text-muted-foreground";
}

export function planHiddenItemCountLabel(hiddenCount: number) {
  return `+${Math.max(0, hiddenCount)} more`;
}

export function planSelectedWorkRowClass(selected: boolean) {
  if (!selected) {
    return "";
  }
  return "bg-day-selected shadow-[inset_3px_0_0_var(--color-selection)]";
}

export const planLedgerTitleClass =
  "font-display text-sm font-medium tracking-tight";

export const planLedgerSubtitleClass = "font-sans text-sm text-muted-foreground";
