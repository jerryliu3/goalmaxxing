"use client";

import { useState } from "react";
import { Action, AppNav, Heading, Panel, StudyDialog } from "../primitives";
import { SlidersHorizontal } from "lucide-react";
import { SAMPLE_SESSIONS, sampleDayLabel } from "../sample";
import { DayWork, toggleId } from "./work";

export function PhoneAgendaConcept() {
  const [day, setDay] = useState(8);
  const [filter, setFilter] = useState("All");
  const [open, setOpen] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);
  return (
    <>
      <AppNav />
      <div className="rf-canvas">
        <Heading eyebrow="October 2026" title="Agenda">
          <Action variant="outline" onClick={() => setOpen(true)}>
            <SlidersHorizontal aria-hidden size={16} />
            {filter === "All" ? "Filters" : filter}
          </Action>
        </Heading>
        <div className="rf-calendar mb-6">
          <>
            {["M", "T", "W", "T", "F", "S", "S"].map((label, index) => (
              <span key={index}>{label}</span>
            ))}
            {[0, 1, 2].map((index) => (
              <span key={`blank-${index}`} aria-hidden />
            ))}
            {Array.from({ length: 31 }, (_, index) => index + 1).map((date) => (
              <button
                type="button"
                className="rf-day"
                key={date}
                aria-label={`${sampleDayLabel(date)}, ${SAMPLE_SESSIONS.filter((item) => item.day === date).length} planned sessions`}
                aria-pressed={day === date}
                onClick={() => setDay(date)}
              >
                <span>{date}</span>
                <small>
                  {date === 8
                    ? "Today"
                    : SAMPLE_SESSIONS.some((item) => item.day === date)
                      ? "• planned"
                      : ""}
                </small>
              </button>
            ))}
          </>
        </div>
        <Panel>
          <DayWork
            day={day}
            category={filter}
            completed={completed}
            onToggle={(id) => setCompleted(toggleId(completed, id))}
          />
        </Panel>
        <StudyDialog
          open={open}
          onOpenChange={setOpen}
          title="Filter the agenda"
          description="One clear filter instead of off-screen chip rails."
        >
          <label className="rf-field">
            Category
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option>All</option>
              <option>Health</option>
              <option>Personal</option>
              <option>Career</option>
            </select>
          </label>
        </StudyDialog>
      </div>
    </>
  );
}
