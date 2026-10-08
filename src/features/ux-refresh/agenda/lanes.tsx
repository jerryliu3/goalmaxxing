"use client";

import { useState } from "react";
import { Action, AppNav, Heading, StudyDialog } from "../primitives";
import { SAMPLE_GOALS, SAMPLE_SESSIONS, sampleDayLabel } from "../sample";

export function LanesConcept() {
  const [selected, setSelected] = useState<
    (typeof SAMPLE_SESSIONS)[number] | null
  >(null);
  const [dates, setDates] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  return (
    <>
      <AppNav />
      <div className="rf-canvas">
        <Heading eyebrow="Agenda / Goal View" title="A name for every step." />
        <p className="rf-muted">
          Dates lead each session. Open the work to inspect or change its day.
        </p>
        {SAMPLE_GOALS.map((goal) => (
          <section className="rf-lane" key={goal.id}>
            <div className="rf-row">
              <h3 className="type-item">{goal.name}</h3>
              <span className="rf-muted">{goal.category} · ends Oct 31</span>
            </div>
            <div className="rf-lane-items">
              {SAMPLE_SESSIONS.filter(
                (session) => session.goalId === goal.id,
              ).map((session) => (
                <button
                  type="button"
                  key={session.id}
                  onClick={() => {
                    setSelected(session);
                    setDraft(
                      dates[session.id] ??
                        `2026-10-${String(session.day).padStart(2, "0")}`,
                    );
                  }}
                >
                  <span className="type-figure">
                    {dates[session.id] ?? sampleDayLabel(session.day)}
                  </span>
                  <p className="type-item mt-2">{session.name}</p>
                  <small>Open session →</small>
                </button>
              ))}
            </div>
          </section>
        ))}
        <StudyDialog
          open={selected !== null}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
          title={selected?.name ?? "Session"}
          description={
            SAMPLE_GOALS.find((goal) => goal.id === selected?.goalId)?.name ??
            "Goal session"
          }
          footer={
            <>
              <Action variant="outline" onClick={() => setSelected(null)}>
                Cancel
              </Action>
              <Action
                disabled={!draft}
                onClick={() => {
                  if (selected) setDates({ ...dates, [selected.id]: draft });
                  setSelected(null);
                }}
              >
                Use sample date
              </Action>
            </>
          }
        >
          <label className="rf-field">
            Session date
            <input
              type="date"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          </label>
          <p className="rf-muted">
            Changing a date and marking a session complete remain separate
            actions.
          </p>
        </StudyDialog>
      </div>
    </>
  );
}
