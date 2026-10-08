"use client";

import { useState } from "react";
import { AppNav, Heading, Panel, Segments, StudyDialog } from "../primitives";

const RECORDS = [
  {
    name: "Best day streak",
    value: "21 days",
    definition: "The longest run of consecutive days with a logged completion.",
    window: "Set in August 2026",
  },
  {
    name: "Active-week streak",
    value: "9 weeks",
    definition:
      "Consecutive calendar weeks with at least one completion, ending this week.",
    window: "Current · through Oct 8",
  },
  {
    name: "Goals accomplished",
    value: "4 goals",
    definition: "Goals whose outcome is accomplished, counted once per goal.",
    window: "All time",
  },
] as const;
export function RecordsConcept({ embedded = false }: { embedded?: boolean }) {
  const [record, setRecord] = useState<(typeof RECORDS)[number] | null>(null);
  const [window, setWindow] = useState("This month");
  return (
    <>
      {!embedded && <AppNav active="Growth" />}
      <div className={embedded ? "" : "rf-canvas"}>
        {!embedded && (
          <Heading
            eyebrow="Growth / Records"
            title="Different rhythms. Clear names."
          />
        )}
        <Panel>
          <div className="rf-stat-grid">
            {RECORDS.map((item) => (
              <button
                type="button"
                className="rf-stat"
                key={item.name}
                onClick={() => setRecord(item)}
              >
                <span className="type-heading">{item.name}</span>
                <strong className="type-stat">{item.value}</strong>
                <small className="rf-muted">{item.window} · What counts?</small>
              </button>
            ))}
          </div>
          <div className="rf-foot">
            <h3 className="type-heading">Completions</h3>
            <Segments
              label="Statistics window"
              values={["This week", "This month"]}
              value={window}
              onChange={setWindow}
            />
          </div>
          <div className="rf-row">
            <p className="type-stat text-4xl">
              {window === "This month" ? "12" : "5"}
            </p>
            <p className="rf-muted">
              {window === "This month"
                ? "October 1–8, 2026"
                : "October 5–8, 2026"}{" "}
              · includes unscheduled activity
            </p>
          </div>
        </Panel>
        <StudyDialog
          open={record !== null}
          onOpenChange={(open) => {
            if (!open) setRecord(null);
          }}
          title={record?.name ?? "Record"}
          description={record?.window ?? "Sample record"}
        >
          <p className="mt-6">{record?.definition}</p>
        </StudyDialog>
      </div>
    </>
  );
}
