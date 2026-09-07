import { cn } from "@/lib/utils";

/**
 * Calendar tile chrome:
 * - Today: solid identity, even when that date sits in an adjacent month.
 * - Adjacent months: solid selection (high-contrast secondary).
 * - Selected day that is not today: muted (low-contrast secondary).
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
    return "border-primary bg-primary text-primary-foreground hover:border-primary";
  }
  if (isSelected) {
    return "border-border bg-muted text-foreground hover:border-border";
  }
  if (!inMonth) {
    return "border-selection bg-selection text-selection-foreground hover:border-selection";
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
    return "text-primary-foreground";
  }
  if (isSelected) {
    return "text-foreground";
  }
  if (!inMonth) {
    return "text-selection-foreground";
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
    isToday && "bg-primary text-primary-foreground",
    !isToday && isSelected && "bg-muted text-foreground",
    !isToday && !isSelected && !inMonth && "bg-selection text-selection-foreground"
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
    isToday && "bg-primary-foreground text-primary",
    !isToday && isSelected && "bg-background text-foreground"
  );
}
