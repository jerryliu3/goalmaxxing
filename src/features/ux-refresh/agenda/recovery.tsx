"use client";

import { useState } from "react";
import {
  Action,
  AppNav,
  Heading,
  Notice,
  Panel,
  Segments,
  StudyDialog,
} from "../primitives";
import { ChevronRight, Undo2 } from "lucide-react";
import {
  MISSED_SESSIONS,
  recoveryDescription,
  sampleDayLabel,
  type RecoveryDraft,
} from "../sample";

function DraftBar({
  count,
  onUndo,
  onDiscard,
  onSave,
  planner = false,
}: {
  count: number;
  onUndo: () => void;
  onDiscard: () => void;
  onSave: () => void;
  planner?: boolean;
}) {
  return (
    <footer className="rf-foot rf-sticky-foot">
      <p className="type-figure" role="status">
        {count
          ? `${count} unsaved ${count === 1 ? "change" : "changes"}`
          : "No unsaved changes"}
      </p>
      <div className="rf-actions">
        <Action variant="ghost" disabled={!count} onClick={onUndo}>
          <Undo2 aria-hidden size={16} />
          Undo
        </Action>
        <Action variant="outline" disabled={!count} onClick={onDiscard}>
          Discard
        </Action>
        <Action disabled={!count} onClick={onSave}>
          {planner ? "Save plan" : "Save review"}
        </Action>
      </div>
    </footer>
  );
}

export function RecoveryConcept({ variant }: { variant: number }) {
  const [mode, setMode] = useState("Recovery");
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState<RecoveryDraft>({});
  const [saved, setSaved] = useState<RecoveryDraft>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [date, setDate] = useState("2026-10-08");
  const [rebalance, setRebalance] = useState(false);
  const [message, setMessage] = useState(
    "Decisions stay in this sample draft until you save.",
  );
  const [plannerDay, setPlannerDay] = useState(8);
  const [savedPlannerDay, setSavedPlannerDay] = useState(8);
  const keys = Object.keys(draft);
  const undo = (id: string) => {
    const next = { ...draft };
    delete next[id];
    setDraft(next);
  };
  const visible = variant === 0 ? [MISSED_SESSIONS[index]] : MISSED_SESSIONS;
  return (
    <>
      <AppNav />
      <div className="rf-canvas">
        <Heading eyebrow="Agenda / Review" title="Make room for what matters.">
          <Segments
            label="Draft workflow"
            values={["Recovery", "Planner"]}
            value={mode}
            onChange={setMode}
          />
        </Heading>
        {mode === "Recovery" ? (
          <Panel>
            <div className="rf-row">
              <p className="type-eyebrow rf-muted">
                {variant === 0
                  ? `Goal ${index + 1} of 2`
                  : "2 slipped sessions"}
              </p>
              <label className="rf-actions text-sm">
                <input
                  type="checkbox"
                  checked={rebalance}
                  onChange={(event) => setRebalance(event.target.checked)}
                />
                Auto-rebalance
              </label>
            </div>
            {rebalance && (
              <p className="rf-muted mt-3">
                Sample preview: the chosen moves fit without moving any other
                sessions.
              </p>
            )}
            <div className="rf-review-body">
              {visible.map((item) => {
                const choice = draft[item.id] ?? saved[item.id];
                return (
                  <article className="rf-choice" key={item.id}>
                    <p className="rf-muted">{item.goal}</p>
                    <h3 className="type-heading mt-2">{item.name}</h3>
                    <p className="rf-muted">Missed {item.missed}</p>
                    {choice ? (
                      <div className="rf-row mt-5">
                        <p className="type-item">
                          {recoveryDescription(choice)} ·{" "}
                          {draft[item.id] ? "Draft" : "Saved in sample"}
                        </p>
                        {draft[item.id] && (
                          <Action variant="ghost" onClick={() => undo(item.id)}>
                            Undo choice
                          </Action>
                        )}
                      </div>
                    ) : (
                      <>
                        <p className="my-5">
                          Suggested: {item.suggested} · room in the sample plan.
                        </p>
                        <div className="rf-actions">
                          <Action
                            onClick={() =>
                              setDraft({
                                ...draft,
                                [item.id]: { date: item.suggested },
                              })
                            }
                          >
                            Accept date
                          </Action>
                          <Action
                            variant="outline"
                            onClick={() => {
                              setDate(item.suggested);
                              setEditing(item.id);
                            }}
                          >
                            Edit date
                          </Action>
                          <Action
                            variant="ghost"
                            onClick={() =>
                              setDraft({ ...draft, [item.id]: { letGo: true } })
                            }
                          >
                            Let it go
                          </Action>
                        </div>
                      </>
                    )}
                  </article>
                );
              })}
              {variant === 0 && (
                <div className="rf-foot">
                  <Action
                    variant="ghost"
                    disabled={index === 0}
                    onClick={() => setIndex(index - 1)}
                  >
                    Previous goal
                  </Action>
                  <Action
                    variant="outline"
                    disabled={index === 1}
                    onClick={() => setIndex(index + 1)}
                  >
                    Next goal
                    <ChevronRight aria-hidden size={16} />
                  </Action>
                </div>
              )}
              {keys.length > 0 && (
                <div className="mt-5">
                  <p className="type-eyebrow rf-muted mb-3">Draft recap</p>
                  {keys.map((id) => (
                    <p key={id} className="text-sm py-2">
                      {MISSED_SESSIONS.find((item) => item.id === id)?.name} →{" "}
                      {recoveryDescription(draft[id])}
                    </p>
                  ))}
                </div>
              )}
              <Notice>{message}</Notice>
            </div>
            <DraftBar
              count={keys.length}
              onUndo={() => undo(keys[keys.length - 1])}
              onDiscard={() => {
                setDraft({});
                setMessage(
                  "Draft discarded. Previously saved sample choices are kept.",
                );
              }}
              onSave={() => {
                setSaved({ ...saved, ...draft });
                setDraft({});
                setMessage(
                  "Review saved in the sample. No real sessions changed.",
                );
              }}
            />
          </Panel>
        ) : (
          <Panel>
            <div className="rf-row">
              <h3 className="type-heading">Planner draft</h3>
              <span className="rf-muted">Drag alternative: choose a date</span>
            </div>
            <div className="rf-choice">
              <p className="type-item">Easy run</p>
              <p className="rf-muted mt-3">
                Currently {sampleDayLabel(savedPlannerDay)}
              </p>
              <label className="rf-field">
                Proposed day
                <select
                  value={plannerDay}
                  onChange={(event) =>
                    setPlannerDay(Number(event.target.value))
                  }
                >
                  {[8, 9, 10, 11].map((day) => (
                    <option key={day} value={day}>
                      {sampleDayLabel(day)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <Notice>
              {plannerDay === savedPlannerDay
                ? "Your sample plan has no draft moves."
                : `Easy run will move to ${sampleDayLabel(plannerDay)}.`}
            </Notice>
            <DraftBar
              planner
              count={Number(plannerDay !== savedPlannerDay)}
              onUndo={() => setPlannerDay(savedPlannerDay)}
              onDiscard={() => setPlannerDay(savedPlannerDay)}
              onSave={() => {
                setSavedPlannerDay(plannerDay);
              }}
            />
          </Panel>
        )}
        <StudyDialog
          open={editing !== null}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          title="Choose a new day"
          description="This changes the proposal. Save review commits the sample draft."
          footer={
            <>
              <Action variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Action>
              <Action
                disabled={!date || date < "2026-10-08" || date > "2026-10-31"}
                onClick={() => {
                  if (editing) setDraft({ ...draft, [editing]: { date } });
                  setEditing(null);
                }}
              >
                Use this date
              </Action>
            </>
          }
        >
          <label className="rf-field">
            New date
            <input
              type="date"
              min="2026-10-08"
              max="2026-10-31"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
        </StudyDialog>
      </div>
    </>
  );
}
