import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DAYS,
  type Item,
  type Concept,
  goalClass,
  dateLabel,
  minutesLabel,
} from "./model";
import type { Study } from "./use-study";

export function GoalMark({ goal }: { goal: Item["goal"] }) {
  return <span className={`goal-mark ${goalClass(goal)}`} aria-hidden="true" />;
}
export function DayRail({ s }: { s: Study }) {
  return (
    <div className="day-rail" aria-label="Select a day">
      {DAYS.map((d, i) => (
        <button key={d} aria-pressed={s.day === i} onClick={() => s.setDay(i)}>
          <span>{d}</span>
          <strong>{7 + i}</strong>
          <span className="day-dots">
            {s.items
              .filter((x) => x.day === i)
              .slice(0, 4)
              .map((x) => (
                <i key={x.id} className={goalClass(x.goal)} />
              ))}
          </span>
        </button>
      ))}
    </div>
  );
}
export function TaskRow({ item, s }: { item: Item; s: Study }) {
  return (
    <div className={`task-row ${item.done ? "is-done" : ""}`}>
      <button
        className="completion"
        aria-label={`${item.done ? "Reopen" : "Complete"} ${item.title}`}
        aria-pressed={item.done}
        onClick={() => s.toggle(item.id)}
        disabled={item.day === null}
      >
        {item.done ? <Check size={16} /> : <span />}
      </button>
      <button className="task-copy" onClick={() => s.setSelected(item.id)}>
        <strong>{item.title}</strong>
        <span>
          <GoalMark goal={item.goal} />
          {item.goal} · {minutesLabel(item.minutes)}
          {item.kind === "task" ? " · Task" : ""}
        </span>
      </button>
      <button
        className="task-time"
        aria-label={`Edit ${item.title}`}
        onClick={() => s.setSelected(item.id)}
      >
        {item.day === null ? <Plus size={18} /> : item.time}
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
export function Unplanned({ s }: { s: Study }) {
  return s.unplanned.length > 0 ? (
    <div className="unplanned">
      <div className="section-label">
        <span>Room for later</span>
        <span>{s.unplanned.length} unplanned</span>
      </div>
      {s.unplanned.map((x) => (
        <button key={x.id} onClick={() => s.setSelected(x.id)}>
          <GoalMark goal={x.goal} />
          <span>{x.title}</span>
          <Plus size={16} />
        </button>
      ))}
    </div>
  ) : null;
}
export function DaySummary({ s }: { s: Study }) {
  const done = s.today.filter((x) => x.done).length;
  return (
    <span>
      {done} of {s.today.length} complete ·{" "}
      {minutesLabel(
        s.today.filter((x) => !x.done).reduce((a, x) => a + x.minutes, 0),
      )}{" "}
      remaining
    </span>
  );
}
export function EmptyDay({ s }: { s: Study }) {
  return (
    <div className="empty-day">
      <p>A little breathing room.</p>
      <span>Place something from Room for later when you’re ready.</span>
      <button
        className="secondary"
        onClick={() => s.setSelected(s.unplanned[0]?.id ?? null)}
        disabled={!s.unplanned.length}
      >
        Plan a session <Plus size={16} />
      </button>
    </div>
  );
}
export function DetailDialogs({ s, concept }: { s: Study; concept: Concept }) {
  return (
    <>
      <Dialog
        open={!!s.active}
        onOpenChange={(open) => {
          if (!open) s.setSelected(null);
        }}
      >
        <DialogContent
          className={`nw-modal nw-${concept}`}
          overlayClassName="nw-overlay"
          showCloseButton={false}
        >
          {s.active && (
            <>
              <button
                className="modal-close"
                aria-label="Close session"
                onClick={() => s.setSelected(null)}
              >
                <X size={20} />
              </button>
              <span className="eyebrow">
                {s.active.kind === "task"
                  ? "One-time task"
                  : "Recurring goal session"}
              </span>
              <DialogTitle className="modal-title">
                {s.active.title}
              </DialogTitle>
              <DialogDescription className="modal-description">
                {s.active.goal} · {s.active.minutes} minutes ·{" "}
                {dateLabel(s.active.day)}
              </DialogDescription>
              <div className="session-detail">
                <GoalMark goal={s.active.goal} />
                <span>
                  {s.active.done
                    ? "Completed on this date"
                    : s.active.day === null
                      ? "Ready to find a place"
                      : "Scheduled"}
                </span>
                <strong>{s.active.time}</strong>
              </div>
              {s.active.day !== null && (
                <button
                  className="primary"
                  onClick={() => s.toggle(s.active!.id)}
                >
                  {s.active.done ? (
                    <RotateCcw size={18} />
                  ) : (
                    <Check size={18} />
                  )}{" "}
                  {s.active.done ? "Reopen session" : "Mark complete"}
                </button>
              )}
              {!s.active.done && (
                <>
                  <p className="field-label">
                    {s.active.day === null
                      ? "Place on a day"
                      : "Move this session"}
                  </p>
                  <div className="move-days">
                    {DAYS.map((d, i) => (
                      <button
                        key={d}
                        disabled={s.active?.day === i}
                        onClick={() => s.move(s.active!.id, i)}
                      >
                        {d}
                        <strong>{i + 7}</strong>
                      </button>
                    ))}
                  </div>
                  {s.active.day !== null && (
                    <button
                      className="text-button"
                      onClick={() => s.move(s.active!.id, null)}
                    >
                      Leave unplanned for now
                    </button>
                  )}
                </>
              )}
              {s.active.done && (
                <p className="modal-description">
                  This is recorded in Progress. Reopen the session to change its
                  planned date.
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!s.draft}
        onOpenChange={(open) => {
          if (!open) s.setDraft(null);
        }}
      >
        <DialogContent
          className={`nw-modal nw-${concept}`}
          overlayClassName="nw-overlay"
          showCloseButton={false}
        >
          <button
            className="modal-close"
            aria-label="Cancel plan changes"
            onClick={() => s.setDraft(null)}
          >
            <X size={20} />
          </button>
          <span className="eyebrow">Review your plan</span>
          <DialogTitle className="modal-title">
            {s.changes.length
              ? "A little more room."
              : "Nothing needs to change."}
          </DialogTitle>
          <DialogDescription className="modal-description">
            {s.changes.length
              ? `${s.changes.length} proposed ${s.changes.length === 1 ? "change" : "changes"}. Completed work stays in place.`
              : "The selected sessions are already placed there, completed, or within your time budget."}
          </DialogDescription>
          <div className="change-list">
            {s.changes.map((c) => (
              <div key={c.item.id}>
                <GoalMark goal={c.item.goal} />
                <span>
                  <strong>{c.item.title}</strong>
                  <small>
                    {dateLabel(c.from)} <ArrowUpRight size={13} />{" "}
                    {dateLabel(c.to)}
                  </small>
                </span>
                <b>{minutesLabel(c.item.minutes)}</b>
              </div>
            ))}
          </div>
          <button
            className="primary"
            onClick={s.changes.length ? s.save : () => s.setDraft(null)}
          >
            {s.changes.length ? "Save plan" : "Keep this plan"}
            <Check size={18} />
          </button>
          <button className="text-button" onClick={() => s.setDraft(null)}>
            Cancel
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
