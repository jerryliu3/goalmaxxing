"use client";

import { useMemo } from "react";
import { addDays, dateRange, dayOfMonth, monthShort, type IsoDate } from "@/features/ux-recovery/dates";
import type { RecoveryPlan, RecoverySeed } from "@/features/ux-recovery/model";
import { projectDays } from "@/features/ux-recovery/projection";
import { SessionChip } from "@/features/ux-recovery/primitives";

const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Compact month grid with ghost previews. Chips collapse to dots on phones. */
export function MonthGrid({
  seed,
  plan,
  today,
  from,
  weeks,
}: {
  seed: RecoverySeed;
  plan: RecoveryPlan;
  today: IsoDate;
  from: IsoDate;
  weeks: number;
}) {
  const dates = useMemo(() => dateRange(from, addDays(from, weeks * 7 - 1)), [from, weeks]);
  const days = useMemo(() => projectDays(seed, plan, dates), [seed, plan, dates]);

  return (
    <div className="rc-card overflow-hidden" aria-label="Calendar preview">
      <div className="grid grid-cols-7 border-b border-[color:var(--rc-rule)] text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--rc-muted)]">
        {WEEKDAY_HEADERS.map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {dates.map((date) => {
          const entries = days.get(date) ?? [];
          const isToday = date === today;
          return (
            <div
              key={date}
              className={`min-h-20 border-b border-r border-[color:var(--rc-rule)]/60 p-1 sm:min-h-28 sm:p-1.5 ${
                date < today ? "bg-black/[0.025]" : ""
              }`}
            >
              <p
                className={`mb-1 flex items-center gap-1 text-[11px] font-semibold ${
                  isToday ? "text-[color:var(--rc-stamp)]" : "text-[color:var(--rc-muted)]"
                }`}
              >
                <span
                  className={`grid size-5 place-items-center rounded-full ${
                    isToday ? "bg-[color:var(--rc-stamp)] text-[color:var(--rc-paper)]" : ""
                  }`}
                >
                  {dayOfMonth(date)}
                </span>
                {dayOfMonth(date) === 1 ? <span>{monthShort(date)}</span> : null}
              </p>
              <ul className="flex flex-wrap gap-0.5 sm:flex-col sm:flex-nowrap sm:gap-1">
                {entries.map((entry) => (
                  <li key={entry.key} className="sm:w-full">
                    <SessionChip entry={entry} today={today} compact />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
