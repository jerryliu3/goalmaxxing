"use client";

import { format, parse } from "date-fns";
import { CalendarPartnerChip } from "@/features/planner/calendar-partner-chip";
import {
  planAgendaDayNumberClass,
  planAgendaDayRowClass,
  planFilledChromeMetaClass,
  planMonthDayNumberClass,
  planMonthDaySurfaceClass,
} from "@/features/planner/calendar-day-chrome";
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
        className={planAgendaDayRowClass({ inMonth, isToday, isSelected })}
        data-day={day}
        data-partner-week-cell="true"
      >
        <div className="flex items-start gap-2 py-3">
          <div className="w-14 shrink-0 px-1">
            <span
              className={cn(
                "block text-[11px] font-medium uppercase tracking-wide",
                planFilledChromeMetaClass({ inMonth, isToday, isSelected })
              )}
            >
              {weekdayLabel}
            </span>
            <span
              className={planAgendaDayNumberClass({ isToday, isSelected })}
            >
              {dayNumber}
            </span>
          </div>
          <div className="flex min-h-[2.75rem] min-w-0 flex-1 flex-col gap-1.5">
            {markers.length > 0 ? (
              markers.map((marker) => (
                <CalendarPartnerChip
                  key={marker.key}
                  title={marker.goalTitle}
                  completed
                />
              ))
            ) : (
              <p
                className={cn(
                  "py-1 text-sm",
                  planFilledChromeMetaClass({ inMonth, isToday, isSelected })
                )}
              >
                —
              </p>
            )}
          </div>
        </div>
      </li>
    );
  }

  return (
    <div
      className={cn(
        "relative min-h-24 rounded-[10px] border p-2 text-left",
        planMonthDaySurfaceClass({
          inMonth,
          isToday,
          isSelected,
          isPastInMonth: false,
        })
      )}
      data-day={day}
      data-partner-week-cell="true"
    >
      <p
        className={`text-xs font-semibold leading-none ${planMonthDayNumberClass({
          inMonth,
          isToday,
          isSelected,
        })}`}
      >
        {day.slice(8, 10)}
      </p>
      {markers.length > 0 ? (
        <div className="mt-3 space-y-1">
          {markers.map((marker) => (
            <CalendarPartnerChip
              key={marker.key}
              title={marker.goalTitle}
              completed
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
