"use client";
import { ChevronLeft, ChevronRight, Link2 } from "lucide-react";
import { addDays, format, parseISO } from "date-fns";
import { Action, Empty, HoldCompletion } from "../common";
import { TODAY, dateLabel } from "../model";
import { MONTH_GOALS, type MonthWork } from "./month-model";
import type { MonthRoundState } from "./use-month-round";
export function DayWork({
  month,
  date,
  compact = false,
}: {
  month: MonthRoundState;
  date: string;
  compact?: boolean;
}) {
  const items = month.visible.filter((s) => s.date === date);
  return (
    <section
      className="rd-day-work"
      aria-label={`Sessions for ${dateLabel(date)}`}
    >
      <div className="rd-between">
        <div>
          <p className="type-eyebrow">
            {date === TODAY
              ? "Today"
              : date < TODAY
                ? "Past placed work"
                : "Planned work"}
          </p>
          <h3 className="type-heading">{dateLabel(date)}</h3>
        </div>
        {!compact && (
          <div className="rf-actions">
            {[-1, 1].map((delta) => (
              <Action
                variant="outline"
                key={delta}
                aria-label={delta < 0 ? "Previous day" : "Next day"}
                onClick={() =>
                  month.selectDay(
                    format(addDays(parseISO(date), delta), "yyyy-MM-dd"),
                  )
                }
              >
                {delta < 0 ? (
                  <ChevronLeft size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </Action>
            ))}
          </div>
        )}
      </div>
      <p className="rd-muted mt-2">
        {items.length} sessions · {items.reduce((n, s) => n + s.duration, 0)}{" "}
        min{month.scope !== "Solo" ? ` · ${month.scope} view` : ""}
      </p>
      {items.length ? (
        <ul>
          {items.map((s) => (
            <WorkRow key={s.id} session={s} month={month} />
          ))}
        </ul>
      ) : (
        <Empty
          title={
            month.filter !== "all" || month.query
              ? "No matching work on this date"
              : "A little room in the plan"
          }
        >
          <p>
            Choose another date
            {month.filter !== "all" || month.query
              ? ", or clear your filters"
              : " to inspect its placed work"}
            .
          </p>
          {(month.filter !== "all" || month.query) && (
            <Action
              variant="outline"
              onClick={() => {
                month.setFilter("all");
                month.setQuery("");
              }}
            >
              Clear goal filters
            </Action>
          )}
        </Empty>
      )}
      <p className="rd-muted mt-4">
        {date > TODAY
          ? "Future work can be inspected or moved; completion is available when its date arrives."
          : "Hold to record; tap the title to inspect or move. Alex’s work is read only."}
      </p>
    </section>
  );
}
function WorkRow({
  session: s,
  month,
}: {
  session: MonthWork;
  month: MonthRoundState;
}) {
  const changed = Boolean(month.state.draft[s.id]);
  return (
    <li className="rd-work-row" data-draft={changed}>
      <HoldCompletion
        done={s.done}
        disabled={s.person !== "you" || s.date > TODAY || changed}
        title={`${s.title} on ${dateLabel(s.date)}`}
        onCommit={() => month.dispatch({ type: "toggle", id: s.id })}
      />
      <button
        className="rd-work-detail"
        onClick={() => month.openSession(s.id)}
      >
        <strong className="type-item">{s.title}</strong>
        <small>
          {s.person === "partner" ? "Alex · " : ""}
          {s.time} · {s.duration} min ·{" "}
          {MONTH_GOALS.find((g) => g.id === s.goal)?.title}
        </small>
        {s.linked && (
          <small className="rd-link-credit">
            <Link2 size={13} /> Also credits {s.linked}
          </small>
        )}
        {changed && <span className="rd-draft-label">Moved · unsaved</span>}
      </button>
      <ChevronRight size={16} aria-hidden />
    </li>
  );
}
