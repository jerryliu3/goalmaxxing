"use client";
import { useState } from "react";
import { ArrowRight, ChevronRight, SlidersHorizontal } from "lucide-react";
import { Notice, StudyDialog } from "@/features/ux-refresh/primitives";
import { Action, Empty, HoldCompletion, ProductHeader } from "./common";
import { TODAY, WEEK, dateLabel } from "./model";
import {
  APP_GOALS,
  APP_SESSIONS,
  INITIAL_COMPLETED,
  appSessions,
} from "./mobile-model";

export function MobileBaseline() {
  return (
    <div className="fc-product">
      <ProductHeader title="Agenda" detail="October 2026" />
      <div className="fc-baseline-controls" aria-label="Current control groups">
        <span>Month</span>
        <span>End date</span>
        <span>Search goals</span>
        <span>Selected goals</span>
        <span>Filters</span>
        <span>Settings</span>
      </div>
      <p className="fc-muted mt-5">Month browsing · horizontal calendar</p>
      <div className="fc-baseline-calendar">
        {WEEK.map((date) => (
          <div key={date}>
            <strong>
              {dateLabel(date).slice(0, 3)} {Number(date.slice(-2))}
            </strong>
            {APP_SESSIONS.filter((session) => session.date === date).map(
              (session) => (
                <p key={session.id} title={session.title}>
                  {session.title}
                </p>
              ),
            )}
          </div>
        ))}
      </div>
      <p className="fc-muted mt-4">
        Same week's placed work; this reconstruction isolates the dense calendar
        and control groups.
      </p>
    </div>
  );
}

export function MobileStudy({ variant }: { variant: number }) {
  const [day, setDay] = useState(TODAY);
  const [filter, setFilter] = useState("All goals");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [savedDates, setSavedDates] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(INITIAL_COMPLETED);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [proposedDate, setProposedDate] = useState(TODAY);
  const [message, setMessage] = useState("");
  const sessions = appSessions({ ...savedDates, ...draft }, completed);
  const visible = sessions.filter(
    (session) => filter === "All goals" || session.goal === filter,
  );
  const selected = sessions.find((session) => session.id === selectedId);
  const changes = Object.entries(draft);
  function openSession(id: string) {
    const session = sessions.find((item) => item.id === id)!;
    setSelectedId(id);
    setProposedDate(session.date);
  }
  function rows(date: string) {
    const items = visible.filter((session) => session.date === date);
    return (
      <section
        className="fc-day-work"
        aria-label={`Work for ${dateLabel(date)}`}
      >
        <div className="fc-between">
          <h3 className="type-heading">
            {date === TODAY ? "Today" : dateLabel(date)}
          </h3>
          <span className="fc-muted">
            {items.length} {items.length === 1 ? "session" : "sessions"}
          </span>
        </div>
        {date === TODAY && <p className="fc-muted">Thursday, October 8</p>}
        {items.length ? (
          <ul className="fc-list">
            {items.map((session) => (
              <li className="fc-line" key={session.id}>
                <HoldCompletion
                  title={session.title}
                  done={session.done}
                  disabled={date > TODAY}
                  onCommit={() => {
                    setCompleted((previous) =>
                      previous.includes(session.id)
                        ? previous.filter((id) => id !== session.id)
                        : [...previous, session.id],
                    );
                    setMessage(
                      `${session.title}: ${session.done ? "completion removed" : "completed"} in the sample.`,
                    );
                  }}
                />
                <div className="fc-grow">
                  <button
                    className="fc-text-button type-item"
                    onClick={() => openSession(session.id)}
                  >
                    {session.title}
                    <ChevronRight size={16} aria-hidden />
                  </button>
                  <p className="fc-muted">
                    {APP_GOALS.find((goal) => goal.id === session.goal)?.title}
                  </p>
                  <p className="fc-muted">
                    {session.time} · {session.done ? "Completed" : "Planned"}
                    {draft[session.id] ? " · Moved, unsaved" : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty
            title={
              filter === "All goals"
                ? "A little breathing room"
                : "No matching sessions"
            }
          >
            <p>
              {filter === "All goals"
                ? "Nothing is placed on this day."
                : "Try all goals to see the rest of your day."}
            </p>
            {filter !== "All goals" && (
              <Action variant="outline" onClick={() => setFilter("All goals")}>
                Clear filter
              </Action>
            )}
          </Empty>
        )}
      </section>
    );
  }
  return (
    <div className="fc-product">
      <ProductHeader title="Agenda" detail="Your placed work">
        <Action
          variant="outline"
          onClick={() => setFiltersOpen(true)}
          aria-label="Filter agenda"
        >
          <SlidersHorizontal size={16} />
          {filter === "All goals" ? "Filters" : "1 filter"}
        </Action>
      </ProductHeader>
      <div className="fc-between mb-4">
        <strong className="type-heading">October 2026</strong>
        <span className="fc-muted">
          {variant === 0 ? "Calendar + day" : "Date-grouped agenda"}
        </span>
      </div>
      {variant === 0 ? (
        <>
          <div className="fc-date-rail" role="group" aria-label="Choose a day">
            {WEEK.map((date) => (
              <button
                key={date}
                onClick={() => setDay(date)}
                aria-label={dateLabel(date)}
                aria-pressed={day === date}
                aria-current={date === TODAY ? "date" : undefined}
              >
                <small>{dateLabel(date).slice(0, 3)}</small>
                <strong className="type-figure">
                  {Number(date.slice(-2))}
                </strong>
                <small>
                  {visible.filter((session) => session.date === date).length}{" "}
                  planned
                </small>
              </button>
            ))}
          </div>
          <p className="fc-muted mt-2 mb-6">
            Swipe dates to browse the week{" "}
            <ArrowRight size={12} aria-hidden className="inline" />
          </p>
          {rows(day)}
        </>
      ) : (
        <>
          <p className="fc-muted mb-6">
            Today and the days ahead. Hold a circle to complete; open a title to
            change its date.
          </p>
          {WEEK.filter((date) => date >= TODAY).map((date) => (
            <div key={date}>{rows(date)}</div>
          ))}
          <details className="fc-section">
            <summary className="fc-text-button">Earlier this week</summary>
            {WEEK.filter((date) => date < TODAY).map((date) => (
              <div key={date}>{rows(date)}</div>
            ))}
          </details>
        </>
      )}
      {variant === 0 && (
        <p className="fc-muted mt-4">
          Hold a circle to complete. Open a title to inspect or move it.
        </p>
      )}
      <Notice>{message}</Notice>
      {changes.length > 0 && (
        <aside className="fc-draft" aria-label="Planning changes">
          <strong className="type-item">
            {changes.length} unsaved {changes.length === 1 ? "move" : "moves"}
          </strong>
          {changes.map(([id, date]) => (
            <p key={id} className="fc-muted">
              {sessions.find((session) => session.id === id)?.title} →{" "}
              {dateLabel(date)}
            </p>
          ))}
          <div className="rf-actions mt-3">
            <Action
              variant="outline"
              onClick={() => {
                setDraft({});
                setMessage("Sample moves undone.");
              }}
            >
              Undo changes
            </Action>
            <Action
              onClick={() => {
                setSavedDates((previous) => ({ ...previous, ...draft }));
                setDraft({});
                setMessage("Sample plan saved. Your account was not changed.");
              }}
            >
              Save changes
            </Action>
          </div>
        </aside>
      )}
      <StudyDialog
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        title="Filter agenda"
        description="Choose which placed work to show."
      >
        <label className="rf-field">
          Goals
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="All goals">All goals</option>
            {APP_GOALS.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </select>
        </label>
        {filter !== "All goals" && (
          <Action variant="outline" onClick={() => setFilter("All goals")}>
            Clear filter
          </Action>
        )}
      </StudyDialog>
      <StudyDialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        title={selected?.title ?? "Session"}
        description={
          selected
            ? `${APP_GOALS.find((goal) => goal.id === selected.goal)?.title} · ${dateLabel(selected.date)} at ${selected.time}`
            : ""
        }
        footer={
          <>
            <Action variant="outline" onClick={() => setSelectedId(null)}>
              Close
            </Action>
            {selected && !selected.done && (
              <Action
                disabled={proposedDate === selected.date}
                onClick={() => {
                  const original =
                    savedDates[selected.id] ??
                    APP_SESSIONS.find((session) => session.id === selected.id)!
                      .date;
                  setDraft((previous) => {
                    const next = { ...previous };
                    if (proposedDate === original) delete next[selected.id];
                    else next[selected.id] = proposedDate;
                    return next;
                  });
                  setDay(proposedDate);
                  setSelectedId(null);
                }}
              >
                Use this date
              </Action>
            )}
          </>
        }
      >
        {selected?.done ? (
          <p className="my-5">
            This session is complete. Its completion is separate from the plan's
            placement.
          </p>
        ) : (
          <label className="rf-field">
            Move session to
            <select
              value={proposedDate}
              onChange={(event) => setProposedDate(event.target.value)}
            >
              {WEEK.filter(
                (date) => date >= TODAY || date === selected?.date,
              ).map((date) => (
                <option value={date} key={date} disabled={date < TODAY}>
                  {dateLabel(date)}
                </option>
              ))}
            </select>
          </label>
        )}
      </StudyDialog>
    </div>
  );
}
