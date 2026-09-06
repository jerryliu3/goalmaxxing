import { format, parse } from "date-fns";
import { NestCompletionMark } from "@/components/ui/nest-completion-mark";
import type { PlannerCompletionFactMarker } from "@/features/planner/calendar-surface.types";
import { cn } from "@/lib/utils";

export function PlannerPartnerWeekDayCell({
  day,
  inMonth,
  isToday,
  isSelected = false,
  layout = "month",
  markers,
}: {
  day: string;
  inMonth: boolean;
  isToday: boolean;
  isSelected?: boolean;
  layout?: "month" | "agenda";
  markers: PlannerCompletionFactMarker[];
}) {
  const parsedDay = parse(day, "yyyy-MM-dd", new Date());
  const weekdayLabel = format(parsedDay, "EEE");
  const dayNumber = format(parsedDay, "d");

  if (layout === "agenda") {
    return (
      <li
        className={cn(
          "border-b border-border/70 last:border-b-0",
          isSelected && "bg-primary/5",
          !inMonth && "opacity-60"
        )}
        data-day={day}
        data-partner-week-cell="true"
      >
        <div className="flex items-start gap-2 py-3">
          <div className="w-14 shrink-0 px-1">
            <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {weekdayLabel}
            </span>
            <span
              className={cn(
                "mt-0.5 inline-flex size-8 items-center justify-center rounded-full text-lg font-semibold leading-none",
                isToday && "bg-primary text-primary-foreground"
              )}
            >
              {dayNumber}
            </span>
          </div>
          <div className="flex min-h-[2.75rem] min-w-0 flex-1 flex-col gap-1.5">
            {markers.length > 0 ? (
              markers.map((marker) => (
                <div
                  key={marker.key}
                  className="flex items-center gap-1.5 rounded-[10px] border-2 border-primary bg-transparent px-1.5 py-1 text-[11px] text-primary"
                >
                  <NestCompletionMark done className="size-3 shrink-0" />
                  <span className="truncate">{marker.goalTitle}</span>
                </div>
              ))
            ) : (
              <p className="py-1 text-sm text-muted-foreground">—</p>
            )}
          </div>
        </div>
      </li>
    );
  }

  return (
    <div
      className={`relative min-h-24 rounded-[10px] border p-2 text-left ${
        inMonth
          ? isToday
            ? "bg-primary/10 ring-1 ring-primary/50"
            : "bg-background"
          : "border-muted-foreground/40 bg-muted/80 text-muted-foreground"
      }`}
      data-day={day}
      data-partner-week-cell="true"
    >
      <p
        className={`text-xs font-semibold leading-none ${
          isToday ? "text-primary" : "text-foreground"
        }`}
      >
        {day.slice(8, 10)}
      </p>
      {markers.length > 0 ? (
        <div className="mt-3 space-y-1">
          {markers.map((marker) => (
            <div
              key={marker.key}
              className="flex items-center gap-1.5 rounded-[10px] border-2 border-primary bg-transparent px-1.5 py-1 text-[11px] text-primary"
            >
              <NestCompletionMark done className="size-3 shrink-0" />
              <span className="truncate">{marker.goalTitle}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
