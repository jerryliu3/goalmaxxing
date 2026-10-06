import { cn } from "@/lib/utils";

/**
 * Quiet calendar surfaces keep emphasis on work tiles. Today is a light wash
 * of the today role; selection is an inset outline in the theme's highlight.
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
      "bg-today/10 text-foreground hover:bg-today/15",
      isSelected && "ring-2 ring-inset ring-highlight"
    );
  }
  if (isSelected) {
    return "bg-highlight/5 text-foreground ring-2 ring-inset ring-highlight hover:bg-highlight/10";
  }
  if (!inMonth) {
    return "isolate bg-muted/40 text-muted-foreground hover:bg-muted/60";
  }
  if (isPastInMonth) {
    return "bg-muted/15 text-foreground hover:bg-muted/30";
  }
  return "bg-background text-foreground hover:bg-muted/20";
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
  if (isToday || isSelected) {
    return "text-highlight";
  }
  if (!inMonth) {
    return "text-muted-foreground";
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
    "border-b border-border/70 last:border-b-0 transition-[background-color,box-shadow] motion-reduce:transition-none",
    isToday && "bg-today/10 text-foreground",
    isSelected && "ring-2 ring-inset ring-highlight",
    !isToday && !isSelected && !inMonth && "isolate bg-muted/40 text-muted-foreground"
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
    "mt-0.5 inline-flex size-8 items-center justify-center rounded-lg text-lg font-medium leading-none tracking-tight",
    isToday && "bg-today/10 text-highlight",
    isSelected && !isToday && "text-highlight ring-2 ring-inset ring-highlight"
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
  return "bg-day-selected shadow-[inset_3px_0_0_var(--color-highlight)]";
}

export const planLedgerTitleClass =
  "type-item text-sm tracking-tight";

export const planLedgerSubtitleClass = "font-sans text-sm text-muted-foreground";
