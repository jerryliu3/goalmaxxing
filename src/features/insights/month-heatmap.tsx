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
  showMonthLabel?: boolean;
}

const weekdayHeaders = ["M", "T", "W", "Th", "F", "S", "Su"];
const DAY_FRAME_CLASS =
  "relative flex h-[var(--month-cell-size)] w-[var(--month-cell-size)] items-center justify-center rounded-[8px] border border-border p-[3px] text-[10px] text-muted-foreground";

function MonthHeatmapDay({
  date,
  dayNumber,
  value,
  pinned,
  interactive,
  disabled,
  onDayClick,
}: {
  date: string;
  dayNumber: string;
  value: number;
  pinned: boolean;
  interactive: boolean;
  disabled: boolean;
  onDayClick?: (date: string, sourceElement: HTMLButtonElement) => void;
}) {
  const title = `${date}: ${value} completion${value === 1 ? "" : "s"}`;
  const body = (
    <>
      <span
        className={cn(
          "flex h-full w-full items-center justify-center rounded-[4px]",
          getHeatmapScaleClass(value)
        )}
      >
        {dayNumber}
      </span>
      {pinned ? (
        <span
          data-testid={`milestone-pin-${date}`}
          className="absolute right-1 top-1 size-1.5 rounded-full bg-foreground"
          aria-hidden
        />
      ) : null}
    </>
  );

  if (interactive && onDayClick) {
    return (
      <button
        type="button"
        title={title}
        disabled={disabled}
        onClick={(event) => onDayClick(date, event.currentTarget)}
        className={cn(
          DAY_FRAME_CLASS,
          "transition-colors hover:border-primary/50 disabled:opacity-60"
        )}
      >
        {body}
      </button>
    );
  }

  return (
    <div title={title} className={DAY_FRAME_CLASS}>
      {body}
    </div>
  );
}

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
  showMonthLabel = true,
}: MonthHeatmapProps) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstWeekdayOffset = getISODay(monthStart) - 1;
  const pinDates = new Set(milestoneDates ?? []);

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
      ) : showMonthLabel ? (
        <p className="text-sm font-medium">{format(month, "MMMM yyyy")}</p>
      ) : null}
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
            return (
              <MonthHeatmapDay
                key={key}
                date={key}
                dayNumber={format(day, "d")}
                value={countsByDate[key] ?? 0}
                pinned={pinDates.has(key)}
                interactive={Boolean(interactive && onDayClick)}
                disabled={
                  pendingDate === key || Boolean(isDayDisabled?.(key))
                }
                onDayClick={onDayClick}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
