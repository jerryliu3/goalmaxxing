"use client";

import { useState } from "react";
import {
  Action,
  AppNav,
  Heading,
  Notice,
  Panel,
  StudyDialog,
} from "../primitives";
import { toggleId } from "./work";

export function PlannerSettingsConcept() {
  const [days, setDays] = useState<string[]>(["Sun"]);
  const [message, setMessage] = useState("");
  const [advanced, setAdvanced] = useState(false);
  return (
    <>
      <AppNav />
      <div className="rf-canvas">
        <Heading
          eyebrow="Agenda / Calendar settings"
          title="Keep some space free."
        />
        <Panel>
          <h3 className="type-heading">Rest weekdays</h3>
          <p className="rf-muted my-4">
            Choose the weekdays you normally keep free. Existing sessions are
            not moved by this sample preference.
          </p>
          <div className="rf-actions">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <Action
                variant={days.includes(day) ? "default" : "outline"}
                key={day}
                aria-pressed={days.includes(day)}
                onClick={() => setDays(toggleId(days, day))}
              >
                {day}
              </Action>
            ))}
          </div>
          <footer className="rf-foot">
            <Notice>
              {message ||
                `${days.length} rest ${days.length === 1 ? "day" : "days"} selected`}
            </Notice>
            <Action
              onClick={() => setMessage("Rest weekdays saved in this sample.")}
            >
              Save preferences
            </Action>
          </footer>
        </Panel>
        <Panel>
          <h3 className="type-heading">Advanced planning tools</h3>
          <p className="rf-muted my-4">
            Refresh or rebuild placement when you intend to change the plan.
          </p>
          <Action variant="outline" onClick={() => setAdvanced(true)}>
            Review planning tools
          </Action>
        </Panel>
        <StudyDialog
          open={advanced}
          onOpenChange={setAdvanced}
          title="Advanced planning tools"
          description="Plan maintenance is separate from calendar preferences."
        >
          <div className="mt-6 rf-stack">
            <div>
              <h3 className="type-heading">Refresh unlocked sessions</h3>
              <p className="rf-muted mt-2">
                Find open days for sessions that are allowed to move.
              </p>
            </div>
            <div>
              <h3 className="type-heading">Rebuild selected goals</h3>
              <p className="rf-muted mt-2">
                Replace future placements for the goals you choose. A production
                version should preview the affected work before applying it.
              </p>
            </div>
            <p className="rf-muted">
              This concept explains the tools; it does not execute maintenance.
            </p>
          </div>
        </StudyDialog>
      </div>
    </>
  );
}
