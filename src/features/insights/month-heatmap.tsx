"use client";

import { eachDayOfInterval, endOfMonth, format, getISODay, startOfMonth } from "date-fns";
import { useCompletionHold } from "@/components/ui/use-completion-hold";
import { getHeatmapScaleClass } from "@/lib/goals/heatmap";
import { PeriodStepper } from "@/components/ui/period-stepper";
import { cn } from "@/lib/utils";
import styles from "./month-heatmap.module.css";

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

function heatmapFillClipPath(fillProgress: number) {
  const inset = (1 - fillProgress) * 50;
  return `inset(${inset}%)`;
}

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
  const completed = value > 0;
  const interactiveEditable = interactive && Boolean(onDayClick);
  const drilldownOnly = !interactive && Boolean(onDayClick);
  const title = `${date}: ${value} completion${value === 1 ? "" : "s"}`;
  const {
    holding,
    fillTransition,
    fillProgress,
    holdProps,
  } = useCompletionHold({
    completed,
    disabled: disabled || !interactiveEditable,
    onCommit: interactiveEditable
      ? (_event, sourceElement) => {
          onDayClick?.(date, sourceElement ?? _event.currentTarget);
        }
      : undefined,
  });
  const fillScaleClass = getHeatmapScaleClass(Math.max(value, 1));

  const body = (
    <>
      {interactiveEditable ? (
        <span
          className={cn(
            "overflow-hidden heatmap-scale-0",
            styles.fill
          )}
        >
          <span
            aria-hidden
            data-fill-progress={fillProgress}
            data-fill-transition={fillTransition ? "true" : "false"}
            className={cn("absolute inset-0", fillScaleClass)}
            style={{
              clipPath: heatmapFillClipPath(fillProgress),
              transition: fillTransition
                ? "clip-path var(--motion-duration-hold, 480ms) linear"
                : "none",
            }}
          />
          <span className={cn("relative z-[1] font-display", styles.number)}>{dayNumber}</span>
        </span>
      ) : (
        <span
          className={cn(
            styles.fill,
            "font-display",
            getHeatmapScaleClass(value)
          )}
        >
          <span className={styles.number}>{dayNumber}</span>
        </span>
      )}
      {pinned ? (
        <span
          data-testid={`milestone-pin-${date}`}
          className="absolute right-1 top-1 z-[2] size-1.5 rounded-full bg-foreground"
          aria-hidden
        />
      ) : null}
    </>
  );

  if (interactiveEditable) {
    return (
      <button
        type="button"
        title={title}
        disabled={disabled}
        data-motion="completion-toggle"
        className={cn(
          styles.day,
          holding && styles.holding
        )}
        {...holdProps}
      >
        {body}
      </button>
    );
  }

  if (drilldownOnly) {
    return (
      <button
        type="button"
        title={title}
        className={cn(
          styles.day,
          "cursor-pointer"
        )}
        onClick={(event) => onDayClick?.(date, event.currentTarget)}
      >
        {body}
      </button>
    );
  }

  return (
    <div title={title} className={styles.day}>
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
  const trailingDayCount = (7 - ((firstWeekdayOffset + days.length) % 7)) % 7;
  const pinDates = new Set(milestoneDates ?? []);

  return (
    <div className="w-full space-y-2">
      {onPreviousMonth || onNextMonth ? (
        <PeriodStepper
          onPrevious={onPreviousMonth}
          onNext={onNextMonth}
          center={
            <p className="min-w-[120px] text-center type-heading text-sm">
              {format(month, "MMMM yyyy")}
            </p>
          }
          previousAriaLabel="Previous month"
          nextAriaLabel="Next month"
        />
      ) : showMonthLabel ? (
        <p className="type-heading text-sm">{format(month, "MMMM yyyy")}</p>
      ) : null}
      <div className="w-full">
        <div className={styles.weekdays}>
          {weekdayHeaders.map((label) => (
            <div
              key={label}
              className="type-eyebrow text-[10px] text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>
        <div className={styles.grid} data-testid="month-heatmap-grid">
          {Array.from({ length: firstWeekdayOffset }).map((_, index) => (
            <div
              key={`offset-${index}`}
              className={styles.blank}
              aria-hidden="true"
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
          {Array.from({ length: trailingDayCount }).map((_, index) => (
            <div key={`trailing-${index}`} className={styles.blank} aria-hidden="true" />
          ))}
        </div>
      </div>
    </div>
  );
}
