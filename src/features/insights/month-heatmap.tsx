"use client";

import { eachDayOfInterval, endOfMonth, format, getISODay, startOfMonth } from "date-fns";
import { getHeatmapScaleClass } from "@/lib/goals/heatmap";
import { PeriodStepper } from "@/components/ui/period-stepper";
import { cn } from "@/lib/utils";

interface MonthHeatmapProps {
  month: Date;
  countsByDate: Record<string, number>;
  interactive?: boolean;
  pendingDate?: string | null;
  isDayDisabled?: (date: string) => boolean;
  milestoneDates?: ReadonlySet<string> | readonly string[];
  onDayClick?: (date: string, sourceElement: HTMLButtonElement) => void;
  onPreviousMonth?: () => void;
  onNextMonth?: () => void;
}

const weekdayHeaders = ["M", "T", "W", "Th", "F", "S", "Su"];

export function MonthHeatmap({
  month,
  countsByDate,
  interactive = false,
  pendingDate = null,
  isDayDisabled,
  milestoneDates,
  onDayClick,
  onPreviousMonth,
  onNextMonth,
}: MonthHeatmapProps) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstWeekdayOffset = getISODay(monthStart) - 1;
  const pinDates =
    milestoneDates instanceof Set
      ? milestoneDates
      : new Set(milestoneDates ?? []);

  return (
    <div className="w-full space-y-2">
      {onPreviousMonth || onNextMonth ? (
        <PeriodStepper
          onPrevious={onPreviousMonth}
          onNext={onNextMonth}
          center={
            <p className="min-w-[120px] text-center text-sm font-medium">
              {format(month, "MMMM yyyy")}
            </p>
          }
          previousAriaLabel="Previous month"
          nextAriaLabel="Next month"
        />
      ) : (
        <p className="text-sm font-medium">{format(month, "MMMM yyyy")}</p>
      )}
      <div className="w-full space-y-1 [--month-cell-size:clamp(2.2rem,4.1vw,3rem)]">
        <div className="grid w-full grid-cols-[repeat(7,var(--month-cell-size))] justify-between gap-y-1">
          {weekdayHeaders.map((label) => (
            <div
              key={label}
              className="flex h-4 w-[var(--month-cell-size)] items-end justify-center text-[10px] font-medium text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid w-full grid-cols-[repeat(7,var(--month-cell-size))] justify-between gap-y-1">
          {Array.from({ length: firstWeekdayOffset }).map((_, index) => (
            <div
              key={`offset-${index}`}
              className="h-[var(--month-cell-size)] w-[var(--month-cell-size)] rounded-md bg-transparent"
            />
          ))}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const value = countsByDate[key] ?? 0;
            const pin = pinDates.has(key) ? (
              <span
                data-testid={`milestone-pin-${key}`}
                className="absolute right-1 top-1 size-1.5 rounded-full bg-foreground"
                aria-hidden
              />
            ) : null;

            if (interactive && onDayClick) {
              const dayDisabled = pendingDate === key || Boolean(isDayDisabled?.(key));
              return (
                <button
                  key={key}
                  type="button"
                  title={`${key}: ${value} completion${value === 1 ? "" : "s"}`}
                  onClick={(event) => onDayClick(key, event.currentTarget)}
                  disabled={dayDisabled}
                  className={cn(
                    "group relative flex h-[var(--month-cell-size)] w-[var(--month-cell-size)] items-center justify-center rounded-[8px] border border-border p-[3px] text-[10px] text-muted-foreground transition-colors hover:border-primary/50 disabled:opacity-60",
                    dayDisabled && "opacity-60"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-full w-full items-center justify-center rounded-[4px]",
                      getHeatmapScaleClass(value)
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {pin}
                </button>
              );
            }

            return (
              <div
                key={key}
                title={`${key}: ${value} completion${value === 1 ? "" : "s"}`}
                className="relative flex h-[var(--month-cell-size)] w-[var(--month-cell-size)] items-center justify-center rounded-[8px] border border-border p-[3px] text-[10px] text-muted-foreground"
              >
                <span
                  className={cn(
                    "flex h-full w-full items-center justify-center rounded-[4px]",
                    getHeatmapScaleClass(value)
                  )}
                >
                  {format(day, "d")}
                </span>
                {pin}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
