"use client";
import { useState } from "react";
import { MonthHeatmap } from "@/features/insights/month-heatmap";
import { getHeatmapScaleClass } from "@/lib/goals/heatmap";
import { Notice, StudyDialog } from "@/features/ux-refresh/primitives";
import {
  INITIAL_LOG,
  SAMPLE_GOALS,
  toggleSampleCompletion,
  type SampleGoalId,
} from "@/features/ux-refresh/sample";
import { Action, HoldCompletion, ProductHeader } from "./common";
import { TODAY, dateLabel } from "./model";

const MONTH = new Date(2026, 9, 1);
function counts(
  log: Record<SampleGoalId, number[]>,
  ids: readonly SampleGoalId[],
) {
  const result: Record<string, number> = {};
  for (const id of ids)
    for (const day of log[id]) {
      const date = `2026-10-${String(day).padStart(2, "0")}`;
      result[date] = (result[date] ?? 0) + 1;
    }
  return result;
}
export function TrackerBaseline() {
  return (
    <div className="fc-product">
      <ProductHeader title="Progress tracker" detail="Growth / October 2026" />
      <p className="fc-muted mb-4">Run a comfortable 10K · one selected goal</p>
      <MonthHeatmap
        month={MONTH}
        countsByDate={counts(INITIAL_LOG, ["run"])}
        today={TODAY}
      />
      <p className="fc-muted mt-4">
        Current MonthHeatmap component, with read-only sample data. Selection
        controls already changed on main; this study does not redesign them.
      </p>
    </div>
  );
}
export function TrackerStudy({ variant }: { variant: number }) {
  const [scope, setScope] = useState("run");
  const [log, setLog] = useState(INITIAL_LOG);
  const [mode, setMode] = useState("Log");
  const [date, setDate] = useState("2026-10-07");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const ids: SampleGoalId[] =
    scope === "all"
      ? SAMPLE_GOALS.map((goal) => goal.id)
      : [scope as SampleGoalId];
  const editable = ids.length === 1;
  const inspecting = !editable || (variant === 1 && mode === "Inspect");
  const toggle = (selectedDate: string) => {
    if (!editable || selectedDate > TODAY) return;
    setLog((previous) =>
      toggleSampleCompletion(previous, ids[0], Number(selectedDate.slice(-2))),
    );
    setMessage(`Sample completion updated for ${dateLabel(selectedDate)}.`);
  };
  const detail = (
    <div className="fc-tracker-detail">
      <label className="rf-field">
        Inspect date
        <input
          type="date"
          min="2026-10-01"
          max="2026-10-31"
          value={date}
          onChange={(event) => {
            if (/^2026-10-(0[1-9]|[12][0-9]|3[01])$/.test(event.target.value))
              setDate(event.target.value);
          }}
        />
      </label>
      <h3 className="type-heading">{dateLabel(date)}</h3>
      {date > TODAY && (
        <p className="fc-muted my-4">
          A future day. Completions can be logged once the day arrives.
        </p>
      )}
      {ids.map((id) => (
        <div className="fc-line" key={id}>
          <div className="fc-grow">
            <strong className="type-item">
              {SAMPLE_GOALS.find((goal) => goal.id === id)!.name}
            </strong>
            <p className="fc-muted">
              {log[id].includes(Number(date.slice(-2)))
                ? "1 completion logged"
                : "No completion logged"}
            </p>
          </div>
          {editable && (
            <HoldCompletion
              title={`${SAMPLE_GOALS.find((goal) => goal.id === id)!.name} on ${dateLabel(date)}`}
              disabled={date > TODAY}
              done={log[id].includes(Number(date.slice(-2)))}
              onCommit={() => toggle(date)}
            />
          )}
        </div>
      ))}
      <p className="fc-muted mt-4">
        {editable
          ? "Hold the circle to log or remove a completion."
          : "Combined activity is read only. Select one goal to edit its log."}
      </p>
    </div>
  );
  return (
    <div className="fc-product">
      <ProductHeader
        title="Progress tracker"
        detail="Growth / Completion log"
      />
      <label className="rf-field">
        Selected goals
        <select
          value={scope}
          onChange={(event) => {
            setScope(event.target.value);
            setMode("Inspect");
          }}
        >
          <option value="all">All 3 goals · read only</option>
          {SAMPLE_GOALS.map((goal) => (
            <option key={goal.id} value={goal.id}>
              {goal.name}
            </option>
          ))}
        </select>
      </label>
      <div className="fc-between my-5">
        <h3 className="type-heading">October 2026</h3>
        {variant === 0 ? (
          <Action variant="outline" onClick={() => setOpen(true)}>
            Inspect a day
          </Action>
        ) : (
          editable && (
            <div
              className="rf-segments"
              role="group"
              aria-label="Calendar interaction"
            >
              {["Log", "Inspect"].map((value) => (
                <button
                  aria-pressed={mode === value}
                  key={value}
                  onClick={() => setMode(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          )
        )}
      </div>
      <p className="fc-muted mb-4">
        {inspecting
          ? "Tap a day to inspect. Logging stays separate."
          : "Hold a date to log or remove a completion."}
      </p>
      <div className="fc-readable-heatmap">
        <MonthHeatmap
          month={MONTH}
          countsByDate={counts(log, ids)}
          today={TODAY}
          interactive={!inspecting}
          isDayDisabled={(selectedDate) => !inspecting && selectedDate > TODAY}
          onDayClick={(selectedDate) => {
            if (inspecting) {
              setDate(selectedDate);
              if (variant === 0) setOpen(true);
            } else {
              toggle(selectedDate);
              setDate(selectedDate);
            }
          }}
        />
      </div>
      <div className="fc-heatmap-key" aria-label="Completion intensity legend">
        {[0, 1, 2, 3, 4].map((value) => (
          <span key={value}>
            <i className={getHeatmapScaleClass(value)} />
            {value === 4 ? "4+" : value}
          </span>
        ))}
        <span>completions</span>
      </div>
      <p className="fc-muted">
        Today is underlined. Dates after Oct 8 are future days; an empty past
        day means no completion was logged.
      </p>
      {variant === 1 && (
        <section
          className="fc-section mt-6"
          aria-label="Inspected completion day"
        >
          {detail}
        </section>
      )}
      <Notice>{message}</Notice>
      <StudyDialog
        open={open}
        onOpenChange={setOpen}
        title="Inspect a completion day"
        description="Read the log without changing it."
      >
        {detail}
      </StudyDialog>
    </div>
  );
}
