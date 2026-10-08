"use client";

import { useState } from "react";
import { Action, StudyDialog, WorkRow } from "../primitives";
import { SAMPLE_GOALS, SAMPLE_SESSIONS, sampleDayLabel } from "../sample";

export function DayWork({
  day,
  query = "",
  category = "All",
  completed,
  onToggle,
}: {
  day: number;
  query?: string;
  category?: string;
  completed: string[];
  onToggle: (id: string) => void;
}) {
  const [showDone, setShowDone] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const sessions = SAMPLE_SESSIONS.filter(
    (item) =>
      item.day === day &&
      item.name.toLowerCase().includes(query.toLowerCase()) &&
      (category === "All" ||
        SAMPLE_GOALS.find((goal) => goal.id === item.goalId)?.category ===
          category),
  );
  const open = sessions.filter((item) => !completed.includes(item.id));
  const done = sessions.filter((item) => completed.includes(item.id));
  const render = (item: (typeof SAMPLE_SESSIONS)[number]) => (
    <WorkRow
      key={item.id}
      title={item.name}
      meta={`${item.time} · ${SAMPLE_GOALS.find((goal) => goal.id === item.goalId)?.name}`}
      done={completed.includes(item.id)}
      onToggle={() => onToggle(item.id)}
      onOpen={() => setDetail(item.name)}
    />
  );
  return (
    <>
      <div className="rf-row">
        <h3 className="type-heading">
          {sampleDayLabel(day)}
          {day === 8 ? " · Today" : ""}
        </h3>
        <span className="type-figure rf-muted">{open.length} open</span>
      </div>
      {open.map(render)}
      {!sessions.length && (
        <p className="rf-muted py-8">No sessions match this day and filter.</p>
      )}
      {sessions.length > 0 && open.length === 0 && (
        <p className="rf-muted py-6">Everything planned here is done.</p>
      )}
      {done.length > 0 && (
        <>
          <Action
            variant="ghost"
            className="mt-4"
            aria-expanded={showDone}
            onClick={() => setShowDone(!showDone)}
          >
            Done · {done.length} {showDone ? "−" : "+"}
          </Action>
          {showDone && done.map(render)}
        </>
      )}
      <StudyDialog
        open={detail !== null}
        onOpenChange={(value) => {
          if (!value) setDetail(null);
        }}
        title={detail ?? "Session"}
        description={`${sampleDayLabel(day)} · placed work`}
      >
        <p className="rf-muted mt-6">
          Inspecting a session is separate from completing it. Close this detail
          to return to the completion row.
        </p>
      </StudyDialog>
    </>
  );
}
export function toggleId(items: string[], id: string) {
  return items.includes(id)
    ? items.filter((item) => item !== id)
    : [...items, id];
}
export function WeekStrip({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (day: number) => void;
}) {
  return (
    <div className="rf-week" role="group" aria-label="Week of October 5">
      {[5, 6, 7, 8, 9, 10, 11].map((day) => (
        <button
          type="button"
          key={day}
          aria-pressed={selected === day}
          aria-label={`${sampleDayLabel(day)}${day === 8 ? ", Today" : ""}`}
          onClick={() => onSelect(day)}
        >
          <small>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][day - 5]}
          </small>
          <span className="type-stat text-xl">{day}</span>
          <small>
            {day === 8
              ? "Today"
              : `${SAMPLE_SESSIONS.filter((item) => item.day === day).length} planned`}
          </small>
        </button>
      ))}
    </div>
  );
}
