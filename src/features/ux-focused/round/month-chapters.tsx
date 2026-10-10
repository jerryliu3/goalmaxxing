"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { dateLabel } from "../model";
import { monthTotals, monthWeeks } from "./month-model";
import { DayWork } from "./month-day";
import type { MonthRoundState } from "./use-month-round";
export function MonthChapters({ month }: { month: MonthRoundState }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="rd-month-chapters">
      {monthWeeks(month.month).map((week, i) => {
        const dates = week.filter((d) => d.inMonth).map((d) => d.date);
        const expanded =
          open === week[0].date || (open === null && dates.includes(month.day));
        const work = month.visible.filter((s) => dates.includes(s.date));
        const total = monthTotals(work, month.month);
        return (
          <section className="rd-week-chapter" key={week[0].date}>
            <button
              className="rd-week-toggle"
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? "closed" : week[0].date)}
            >
              <span>
                <small className="type-eyebrow">
                  Week {i + 1} · {Number(dates[0].slice(-2))}–
                  {Number(dates[dates.length - 1].slice(-2))}
                </small>
                <strong className="type-heading">
                  {total.count} sessions ·{" "}
                  {Math.round((total.minutes / 60) * 10) / 10} hours
                </strong>
              </span>
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            <div className="rd-chapter-dates">
              {week.map((cell) => (
                <button
                  key={cell.date}
                  disabled={!cell.inMonth}
                  aria-label={dateLabel(cell.date)}
                  aria-pressed={month.day === cell.date}
                  onClick={() => {
                    month.selectDay(cell.date);
                    setOpen(week[0].date);
                  }}
                >
                  <small>{dateLabel(cell.date).slice(0, 3)}</small>
                  <strong>{Number(cell.date.slice(-2))}</strong>
                  <span>
                    {work.filter((s) => s.date === cell.date).length || "·"}
                  </span>
                </button>
              ))}
            </div>
            {expanded && (
              <div className="rd-chapter-work">
                <DayWork
                  month={month}
                  date={dates.includes(month.day) ? month.day : dates[0]}
                  compact
                />
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
