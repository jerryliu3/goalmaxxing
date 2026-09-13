import { useRef, useState } from "react";
import { ArrowUpRight, Check, BookOpen, Archive, Minus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { CONCEPTS, HISTORY, type Concept, type HistoryItem } from "./model";

const VIEWS = [
  "Day",
  "Week",
  "Month",
  "Checklist",
  "Progress",
  "Goals",
] as const;
type View = (typeof VIEWS)[number];
function Seal({ status }: { status: string }) {
  return (
    <span className={`j-history-seal ${status.toLowerCase()}`}>
      {status === "Achieved" ? (
        <Check size={17} />
      ) : status === "Archived" ? (
        <Archive size={15} />
      ) : (
        <Minus size={17} />
      )}
    </span>
  );
}
export function History({ concept }: { concept: Concept }) {
  const [view, setView] = useState<View>("Week");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<HistoryItem | null>(null);
  const [sessionDate, setSessionDate] = useState<string | null>(null);
  const recordTrigger = useRef<HTMLElement | null>(null);
  const inspect = (item: HistoryItem, date: string | null = null) => {
    recordTrigger.current = document.activeElement as HTMLElement;
    setSelected(item);
    setSessionDate(date);
  };
  const [expanded, setExpanded] = useState(false);
  const current = CONCEPTS.find((c) => c.id === concept)!;
  const items = HISTORY.filter((x) => filter === "All" || x.status === filter);
  const total = HISTORY.reduce((sum, x) => sum + x.count, 0);
  return (
    <>
      <div className="j-destination-heading">
        <div>
          <span className="j-kicker">02 / {current.history}</span>
          <h1>
            {concept === "tempo"
              ? "Look at what you’ve done."
              : concept === "weave"
                ? "The work stays in the weave."
                : "Some chapters stay with you."}
          </h1>
          <p>
            Finished goals become evidence. Unfinished goals keep their honest
            story.
          </p>
        </div>
        <div className="j-earned">
          <strong>{total}</strong>
          <span>
            completions kept
            <br />2 goals achieved
          </span>
        </div>
      </div>
      <nav className="j-view-tabs" aria-label="History views">
        {VIEWS.map((v) => (
          <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>
            {v}
          </button>
        ))}
      </nav>
      <div className="j-history-layout">
        <section className="j-history-surface">
          <div className="j-between">
            <span className="j-kicker">
              {view === "Week"
                ? "September 7–13, 2026"
                : view === "Month"
                  ? "September 2026"
                  : view === "Day" || view === "Checklist"
                    ? "Thursday, September 10"
                    : "Your goal history"}
            </span>
            <span className="j-small">Sample history</span>
          </div>
          {view === "Day" || view === "Checklist" ? (
            <>
              <div className="j-active-row">
                <span className="j-open-mark" />
                <div>
                  <strong>Write a letter to a friend</strong>
                  <small>Relationships · still to do</small>
                </div>
                <span>Any time</span>
              </div>
              <button
                className="j-completed-toggle"
                aria-expanded={expanded}
                onClick={() => setExpanded(!expanded)}
              >
                <Seal status="Achieved" />
                <strong>
                  {concept === "script"
                    ? "Already part of your story"
                    : "Completed today"}
                </strong>
                <span>1 session · {expanded ? "Hide" : "Show"}</span>
              </button>
              {expanded && (
                <button
                  className="j-history-row"
                  onClick={() => inspect(HISTORY[0], "2026-09-10")}
                >
                  <Seal status="Achieved" />
                  <div>
                    <strong>Run a first 10K</strong>
                    <small>
                      Final session · completed Sep 10 · goal achieved
                    </small>
                  </div>
                  <ArrowUpRight size={16} />
                </button>
              )}
              <div className="j-quiet-message">
                <BookOpen size={22} />
                <p>
                  One finish line crossed today.
                  <br />
                  <span>Your next task can have the stage.</span>
                </p>
              </div>
            </>
          ) : view === "Week" ? (
            <div className={`j-week j-week-${concept}`}>
              <div className="j-week-head">
                <span>Goal / completed sessions</span>
                {["M 7", "T 8", "W 9", "T 10", "F 11", "S 12", "S 13"].map(
                  (x, i) => (
                    <span key={i}>{x}</span>
                  ),
                )}
              </div>
              {HISTORY.slice(0, 2).map((item) => (
                <div className="j-week-lane" key={item.id}>
                  <button onClick={() => inspect(item)}>
                    <strong>{item.title}</strong>
                    <small>
                      <Seal status={item.status} />
                      {item.status} · {item.count}/{item.target}
                    </small>
                  </button>
                  {Array.from({ length: 7 }, (_, i) => {
                    const complete =
                      item.id === "run" ? i === 0 || i === 3 : i === 1;
                    return (
                      <div key={i}>
                        {complete ? (
                          <button
                            aria-label={`${item.title}, completed September ${i + 7}`}
                            className="j-knot done"
                            onClick={() =>
                              inspect(
                                item,
                                `2026-09-${String(i + 7).padStart(2, "0")}`,
                              )
                            }
                          >
                            <Check size={14} />
                            <span>Done</span>
                          </button>
                        ) : (
                          <span className="j-empty-cell">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
              <div className="j-week-lane active">
                <div>
                  <strong>Strength habit</strong>
                  <small>Active · next up</small>
                </div>
                {Array.from({ length: 7 }, (_, i) => (
                  <div key={i}>
                    {i === 5 ? (
                      <span className="j-planned-pill">Planned</span>
                    ) : (
                      <span className="j-empty-cell">—</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="j-small">
                ✓ Filled marks are completed sessions. Outlines are planned. A
                goal’s final session earns the achieved seal.
              </p>
            </div>
          ) : view === "Month" ? (
            <>
              <div className="j-month-weekdays">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day) => (
                    <span key={day}>{day}</span>
                  ),
                )}
              </div>
              <div className="j-month-grid">
                <span />
                {Array.from({ length: 30 }, (_, i) => (
                  <div key={i}>
                    <span>{i + 1}</span>
                    {[7, 8, 10].includes(i + 1) && (
                      <button
                        onClick={() =>
                          inspect(
                            HISTORY[i + 1 === 8 ? 1 : 0],
                            `2026-09-${String(i + 1).padStart(2, "0")}`,
                          )
                        }
                        aria-label={`Inspect completed work September ${i + 1}`}
                      >
                        <Check size={14} />
                        <span>{i + 1 === 7 ? "Session" : "Achieved"}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="j-small">
                A completion mark stays legible at month scale. Open it for the
                name and exact record.
              </p>
            </>
          ) : (
            <>
              <div className="j-filter" aria-label="Goal status">
                {["All", "Achieved", "Ended", "Archived"].map((s) => (
                  <button
                    aria-pressed={filter === s}
                    key={s}
                    onClick={() => setFilter(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className={`j-archive-list j-archive-${concept}`}>
                {items.map((item, index) => (
                  <button
                    key={item.id}
                    className="j-history-row"
                    onClick={() => inspect(item)}
                  >
                    {concept === "script" ? (
                      <span className="j-chapter-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    ) : (
                      <Seal status={item.status} />
                    )}
                    <div>
                      <small>
                        {item.category} · {item.date}
                      </small>
                      <strong>{item.title}</strong>
                      {concept === "script" && <p>{item.detail}</p>}
                      <span className="j-status-label">
                        {item.status} · {item.count}/{item.target}{" "}
                        {item.id === "portfolio" ? "milestones" : "completions"}
                      </span>
                      {view === "Progress" && (
                        <span className="j-history-progress">
                          <i
                            style={{
                              width: `${(item.count / item.target) * 100}%`,
                            }}
                          />
                        </span>
                      )}
                    </div>
                    <ArrowUpRight size={17} />
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
        <aside className="j-history-note">
          <span className="j-kicker">A consistent language</span>
          <h3>
            {concept === "tempo"
              ? "Earned. Never crossed out."
              : concept === "weave"
                ? "A pattern with a past."
                : "Keep the chapter. Turn the page."}
          </h3>
          <div>
            <Seal status="Achieved" />
            <p>
              <strong>Achieved</strong>
              <span>
                The goal’s target was met. A seal celebrates the outcome.
              </span>
            </p>
          </div>
          <div>
            <Seal status="Ended" />
            <p>
              <strong>Ended</strong>
              <span>
                The end date passed. Show what was done, without implying
                completion.
              </span>
            </p>
          </div>
          <div>
            <Seal status="Archived" />
            <p>
              <strong>Archived</strong>
              <span>You put it aside. Its earned work remains visible.</span>
            </p>
          </div>
          <p className="j-small">
            Session completion and goal achievement are different. Past dates
            alone never earn a seal.
          </p>
        </aside>
      </div>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent
          className={`j-modal j-record-modal j-${concept}`}
          overlayClassName="j-overlay"
          showCloseButton={false}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            recordTrigger.current?.focus();
          }}
        >
          {selected && (
            <>
              <div className="j-between">
                <Seal status={selected.status} />
                <button
                  className="j-icon"
                  aria-label="Close record"
                  onClick={() => setSelected(null)}
                >
                  <X size={20} />
                </button>
              </div>
              <span className="j-kicker">
                {selected.status} · {selected.date}
              </span>
              <DialogTitle>{selected.title}</DialogTitle>
              <DialogDescription>
                {sessionDate && `Session completed ${sessionDate}. `}
                {selected.detail}
              </DialogDescription>
              <div className="j-record-total">
                {selected.count}
                <small>
                  of {selected.target}{" "}
                  {selected.id === "portfolio" ? "milestones" : "completions"}
                </small>
              </div>
              <p>
                Your recorded work remains earned as your current score changes.
              </p>
              <button className="j-primary" onClick={() => setSelected(null)}>
                Keep exploring <ArrowUpRight size={16} />
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
