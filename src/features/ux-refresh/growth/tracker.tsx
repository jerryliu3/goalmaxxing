"use client";

import { useState } from "react";
import {
  Action,
  AppNav,
  Heading,
  Notice,
  Panel,
  Search,
  StudyDialog,
} from "../primitives";
import { ChevronDown } from "lucide-react";
import {
  dayCount,
  INITIAL_LOG,
  SAMPLE_GOALS,
  sampleDayLabel,
  toggleSampleCompletion,
  type SampleGoalId,
} from "../sample";

export function TrackerConcept({
  variant = 0,
  selectionStudy = false,
  embedded = false,
}: {
  variant?: number;
  selectionStudy?: boolean;
  embedded?: boolean;
}) {
  const [selected, setSelected] = useState<SampleGoalId[]>(
    selectionStudy ? SAMPLE_GOALS.map((goal) => goal.id) : ["run"],
  );
  const [log, setLog] = useState(INITIAL_LOG);
  const [day, setDay] = useState(7);
  const [query, setQuery] = useState("");
  const [picker, setPicker] = useState(false);
  const [message, setMessage] = useState("");
  const focus =
    selected.length === 1
      ? SAMPLE_GOALS.find((goal) => goal.id === selected[0])
      : undefined;
  const scope =
    focus?.name ??
    (selected.length
      ? `${selected.length} selected goals`
      : "No goals selected");
  const total = selected.reduce((sum, id) => sum + log[id].length, 0);
  const ledger = (
    <div>
      <Search value={query} onChange={setQuery} />
      <div className="rf-row my-4">
        <span className="type-figure">{selected.length} selected</span>
        <div className="rf-actions">
          <Action
            variant="ghost"
            onClick={() => setSelected(SAMPLE_GOALS.map((goal) => goal.id))}
          >
            All
          </Action>
          <Action variant="ghost" onClick={() => setSelected([])}>
            Clear
          </Action>
        </div>
      </div>
      {SAMPLE_GOALS.filter((goal) =>
        goal.name.toLowerCase().includes(query.toLowerCase()),
      ).map((goal) => (
        <div className="rf-check-row" key={goal.id}>
          <label>
            <input
              type="checkbox"
              checked={selected.includes(goal.id)}
              onChange={() =>
                setSelected(
                  selected.includes(goal.id)
                    ? selected.filter((id) => id !== goal.id)
                    : [...selected, goal.id],
                )
              }
            />
            <span>
              <strong className="type-item">{goal.name}</strong>
              <small>{log[goal.id].length} completions · October 2026</small>
            </span>
          </label>
          <Action
            variant="ghost"
            onClick={() => {
              setSelected([goal.id]);
              setPicker(false);
            }}
            aria-label={`Focus ${goal.name}`}
          >
            Focus
          </Action>
        </div>
      ))}
      {!SAMPLE_GOALS.some((goal) =>
        goal.name.toLowerCase().includes(query.toLowerCase()),
      ) && <p className="rf-muted mt-4">No matching goals.</p>}
    </div>
  );
  const calendar = (
    <>
      <div className="rf-row mb-5">
        <div>
          <p className="type-eyebrow rf-muted">Completion log</p>
          <h3 className="type-heading mt-1">October 2026</h3>
        </div>
        <span className="type-figure">{total} completions</span>
      </div>
      <button
        type="button"
        className="rf-scope"
        aria-label={`Change tracker scope, ${scope}`}
        onClick={() => setPicker(true)}
      >
        <span>
          <strong className="type-item">{scope}</strong>
          <small className="block rf-muted mt-1">
            {focus
              ? "One goal · editable completion log"
              : selected.length
                ? "Combined activity · read only"
                : "Choose goals to see activity"}
          </small>
        </span>
        <ChevronDown aria-hidden size={18} />
      </button>
      <div
        className="rf-calendar"
        data-compact={!selectionStudy && variant === 1}
      >
        <>
          {["M", "T", "W", "T", "F", "S", "S"].map((label, index) => (
            <span key={index}>{label}</span>
          ))}
          {[0, 1, 2].map((index) => (
            <span key={`blank-${index}`} aria-hidden />
          ))}
          {Array.from({ length: 31 }, (_, index) => index + 1).map((date) => {
            const count = dayCount(log, selected, date);
            return (
              <button
                type="button"
                className="rf-day"
                key={date}
                aria-label={`${sampleDayLabel(date)}${date === 8 ? ", Today" : ""}, ${count} completions${date > 8 ? ", Future" : ""}`}
                aria-pressed={day === date}
                disabled={date > 8}
                data-active={count > 0}
                onClick={() => setDay(date)}
              >
                <span>{date}</span>
                {!(!selectionStudy && variant === 1) && (
                  <small>{date > 8 ? "Future" : `${count} done`}</small>
                )}
              </button>
            );
          })}
        </>
      </div>
      <div className="rf-legend">
        <span>Number = completions logged</span>
        <span>Future days are unavailable</span>
        <span>Today: Oct 8</span>
      </div>
      {!selectionStudy && variant === 1 && (
        <div className="rf-week mt-6">
          {Array.from(
            { length: 7 },
            (_, index) => 1 + Math.floor((day - 1) / 7) * 7 + index,
          )
            .filter((date) => date <= 31)
            .map((date) => (
              <button
                type="button"
                key={date}
                aria-label={`Inspect ${sampleDayLabel(date)}`}
                disabled={date > 8}
                aria-pressed={date === day}
                onClick={() => setDay(date)}
              >
                <small>{sampleDayLabel(date).split(",")[0]}</small>
                <strong className="type-stat">{date}</strong>
                <small>
                  {date > 8
                    ? "Future"
                    : `${dayCount(log, selected, date)} done`}
                </small>
              </button>
            ))}
        </div>
      )}
      <section className="rf-day-detail" aria-label="Selected day">
        <h3 className="type-heading">{sampleDayLabel(day)}</h3>
        {selected.length ? (
          <>
            {selected.map((id) => {
              const goal = SAMPLE_GOALS.find((item) => item.id === id)!;
              const done = log[id].includes(day);
              return (
                <div className="rf-check-row" key={id}>
                  <span className="flex-1">
                    <strong className="type-item">{goal.name}</strong>
                    <small>
                      {done ? "1 completion logged" : "No completion logged"}
                    </small>
                  </span>
                  {focus && (
                    <Action
                      variant={done ? "outline" : "default"}
                      onClick={() => {
                        setLog(toggleSampleCompletion(log, id, day));
                        setMessage(
                          `${done ? "Removed" : "Logged"} a sample completion for ${goal.name} on ${sampleDayLabel(day)}.`,
                        );
                      }}
                    >
                      {done ? "Remove" : "Log completion"}
                    </Action>
                  )}
                </div>
              );
            })}
            {!focus && (
              <p className="rf-muted mt-4">
                Focus one goal to log or remove its completions.
              </p>
            )}
          </>
        ) : (
          <p className="rf-muted">
            Choose at least one goal to inspect the log.
          </p>
        )}
        <div className="mt-4">
          <Notice>{message}</Notice>
        </div>
      </section>
    </>
  );
  return (
    <>
      {!embedded && <AppNav active="Growth" />}
      <div className={embedded ? "" : "rf-canvas"}>
        {!embedded && (
          <Heading
            eyebrow="Growth / Activity"
            title="A clear view of showing up."
          />
        )}
        {selectionStudy && variant === 0 ? (
          <div className="rf-split">
            <Panel label="Goal selection">{ledger}</Panel>
            <Panel>{calendar}</Panel>
          </div>
        ) : (
          <Panel>{calendar}</Panel>
        )}
        <StudyDialog
          open={picker}
          onOpenChange={setPicker}
          side={selectionStudy && variant === 1}
          title="Choose goals"
          description="Select several to compare activity, or focus one to edit its log."
        >
          <div className="mt-6">{ledger}</div>
        </StudyDialog>
      </div>
    </>
  );
}
