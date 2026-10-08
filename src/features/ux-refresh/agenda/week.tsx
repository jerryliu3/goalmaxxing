"use client";

import { useState } from "react";
import { AppNav, Heading, Panel } from "../primitives";
import { DayWork, WeekStrip, toggleId } from "./work";

export function WeekConcept() {
  const [day, setDay] = useState(8);
  const [completed, setCompleted] = useState<string[]>(["run-5", "language-6"]);
  return (
    <>
      <AppNav />
      <div className="rf-canvas">
        <Heading
          eyebrow="October 5–11, 2026"
          title="This week, one day at a time."
        />
        <WeekStrip selected={day} onSelect={setDay} />
        <Panel>
          <DayWork
            day={day}
            completed={completed}
            onToggle={(id) => setCompleted(toggleId(completed, id))}
          />
        </Panel>
      </div>
    </>
  );
}
