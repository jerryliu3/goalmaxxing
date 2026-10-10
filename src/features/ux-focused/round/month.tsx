"use client";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { Action, ProductHeader } from "../common";
import { Notice } from "@/features/ux-refresh/primitives";
import { TODAY, dateLabel } from "../model";
import { MONTH_WORK, monthTitle, monthTotals, shiftMonth } from "./month-model";
import { useMonthRound } from "./use-month-round";
import { MonthCalendar } from "./month-calendar";
import { MonthChapters } from "./month-chapters";
import { DayWork } from "./month-day";
import { MonthDialogs } from "./month-dialogs";
export function MonthRound({ variant }: { variant: number }) {
  const m = useMonthRound();
  const totals = monthTotals(m.visible, m.month);
  const changes = Object.entries(m.state.draft);
  return (
    <div className="fc-product rd-month">
      <ProductHeader title="Agenda" detail="Month / Placed work">
        <Action variant="outline" onClick={() => m.setFilters(true)}>
          <SlidersHorizontal size={16} /> Filters
          {m.filter !== "all" || m.query ? " · active" : ""}
        </Action>
      </ProductHeader>
      <div className="rd-month-toolbar">
        <Action
          variant="outline"
          aria-label="Previous month"
          onClick={() => m.selectDay(`${shiftMonth(m.month, -1)}-01`)}
        >
          <ChevronLeft size={18} />
        </Action>
        <h3 className="type-heading">{monthTitle(m.month)}</h3>
        <Action
          variant="outline"
          aria-label="Next month"
          onClick={() => m.selectDay(`${shiftMonth(m.month, 1)}-01`)}
        >
          <ChevronRight size={18} />
        </Action>
      </div>
      <div className="rd-month-meta">
        <span className="rd-muted">
          {totals.count} sessions · {totals.days} active dates
        </span>
        <Action variant="ghost" onClick={() => m.selectDay(TODAY)}>
          Today
        </Action>
      </div>
      <div className="rd-scopes" role="group" aria-label="Whose placed work">
        {(["Solo", "Partner", "Duo"] as const).map((scope) => (
          <button
            key={scope}
            aria-pressed={m.scope === scope}
            onClick={() => m.setScope(scope)}
          >
            {scope}
          </button>
        ))}
      </div>
      {variant === 2 ? (
        <MonthChapters key={m.month} month={m} />
      ) : (
        <>
          <MonthCalendar
            month={m.month}
            day={m.day}
            sessions={m.visible}
            readable={variant === 1}
            onDay={m.selectDay}
          />
          <DayWork month={m} date={m.day} />
        </>
      )}
      {m.missed.length > 0 && (
        <div className="rd-recovery-entry">
          <div>
            <strong className="type-item">1 missed film session</strong>
            <p className="rd-muted">
              Review when you’re ready. Your plan has not changed.
            </p>
          </div>
          <Action
            variant="outline"
            disabled={changes.length > 0}
            onClick={() => m.setReview(true)}
          >
            Review
          </Action>
          {changes.length > 0 && (
            <small className="rd-muted">
              Save or undo your planner changes before reviewing recovery.
            </small>
          )}
        </div>
      )}
      {changes.length > 0 && (
        <section className="rd-save-dock" aria-label="Unsaved planner changes">
          <details open>
            <summary className="type-item">
              {changes.length} unsaved {changes.length === 1 ? "move" : "moves"}
            </summary>
            <ul>
              {changes.map(([id, date]) => {
                const s = MONTH_WORK.find((s) => s.id === id)!;
                return (
                  <li key={id}>
                    <strong>{s.title}</strong>
                    <span>
                      {dateLabel(m.state.saved[id] ?? s.date)} →{" "}
                      {dateLabel(date)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </details>
          <div className="rf-actions">
            <Action
              variant="outline"
              onClick={() => {
                m.dispatch({ type: "undo" });
                m.setNotice(
                  "All unsaved moves undone. Completion records are unchanged.",
                );
              }}
            >
              Undo changes
            </Action>
            <Action
              onClick={() => {
                m.dispatch({ type: "save" });
                m.setNotice("Plan saved in this sample.");
              }}
            >
              Save plan
            </Action>
          </div>
          <p className="rd-muted">
            Includes changes hidden by your current filters.
          </p>
        </section>
      )}
      {m.notice && <Notice>{m.notice}</Notice>}
      <MonthDialogs month={m} />
    </div>
  );
}
export function MonthBaseline() {
  return (
    <div className="fc-product rd-month rd-month-baseline">
      <ProductHeader title="Agenda" detail="Current month structure" />
      <p className="rd-muted mb-4">
        A seven-column calendar with a 42rem minimum track. This source
        reconstruction preserves its horizontal overflow, not its full planner
        chrome.
      </p>
      <MonthCalendar
        month="2026-10"
        day={TODAY}
        sessions={MONTH_WORK.filter((s) => s.person === "you")}
        readable
        onDay={() => {}}
      />
      <p className="rd-muted mt-4">
        Comparison only; inert dates. The prototypes add their own readable
        selected-day work and staged editing. No claim of browser-verified
        contrast or usability.
      </p>
    </div>
  );
}
