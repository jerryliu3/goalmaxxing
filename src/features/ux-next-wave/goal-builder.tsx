import { useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Layers3,
  LockKeyhole,
  Minus,
  Plus,
  Repeat2,
  Route,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { GoalCreationFields } from "@/features/goals/goal-creation-model";
import type { Concept } from "./model";
import "./styles/goal-builder.css";

type Draft = Pick<
  GoalCreationFields,
  | "title"
  | "frequency_type"
  | "recurrence_interval"
  | "target_count"
  | "target_basis"
  | "milestone_names"
  | "start_date"
  | "end_date"
  | "color"
  | "is_private"
>;
const fresh = (): Draft => ({
  title: "",
  frequency_type: "recurring",
  recurrence_interval: "weekly",
  target_count: "3",
  target_basis: "period",
  milestone_names: ["First step", "Build momentum", "Bring it together"],
  start_date: "2026-09-08",
  end_date: "",
  color: "#9bb89e",
  is_private: true,
});
const COLORS = ["#9bb89e", "#9aacdb", "#d3a0b8", "#d5b47e", "#baade0"];
const steps = ["Intention", "Shape", "Make it yours", "Review"];
function description(d: Draft) {
  return d.frequency_type === "fixed_milestones"
    ? `${d.milestone_names.length} milestones`
    : `${d.target_count} ${d.target_count === "1" ? "completion" : "completions"} ${d.target_basis === "lifetime" ? "in total" : `per ${d.recurrence_interval === "daily" ? "day" : d.recurrence_interval === "weekly" ? "week" : "month"}`}`;
}
function valid(d: Draft) {
  return (
    !!d.title.trim() &&
    !!d.start_date &&
    (!d.end_date || d.end_date >= d.start_date) &&
    Number(d.target_count) > 0 &&
    (d.frequency_type !== "fixed_milestones" ||
      d.milestone_names.every((x) => x.trim()))
  );
}

function GoalReview({
  draft,
  onChange,
  onRemove,
  index,
  onMove,
  isLast,
}: {
  draft: Draft;
  onChange: (d: Draft) => void;
  onRemove?: () => void;
  index: number;
  onMove?: (direction: "up" | "down") => void;
  isLast?: boolean;
}) {
  return (
    <article className="gb-review-card" style={{ borderTopColor: draft.color }}>
      <div className="gb-review-top">
        <span>GOAL {String(index + 1).padStart(2, "0")}</span>
        <div className="gb-review-actions">
          {onMove && (
            <>
              <button
                type="button"
                onClick={() => onMove("up")}
                disabled={index === 0}
                aria-label={`Move goal ${index + 1} up`}
              >
                <ArrowUp size={15} />
              </button>
              <button
                type="button"
                onClick={() => onMove("down")}
                disabled={isLast}
                aria-label={`Move goal ${index + 1} down`}
              >
                <ArrowDown size={15} />
              </button>
            </>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove goal ${index + 1}`}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      <label>
        Goal name
        <input
          value={draft.title}
          onChange={(e) => onChange({ ...draft, title: e.target.value })}
        />
      </label>
      <p>{description(draft)}</p>
      <details>
        <summary>
          Edit goal details <Plus size={15} />
        </summary>
        <label>
          Goal type
          <select
            value={draft.frequency_type}
            onChange={(e) =>
              onChange({
                ...draft,
                frequency_type: e.target.value as Draft["frequency_type"],
              })
            }
          >
            <option value="recurring">Recurring goal</option>
            <option value="fixed_milestones">Milestones</option>
          </select>
        </label>
        {draft.frequency_type === "recurring" ? (
          <>
            <label>
              Frequency
              <select
                value={draft.recurrence_interval}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    recurrence_interval: e.target
                      .value as Draft["recurrence_interval"],
                    target_count: "1",
                  })
                }
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <label>
              Target basis
              <select
                value={draft.target_basis}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    target_basis: e.target.value as Draft["target_basis"],
                    target_count: "1",
                  })
                }
              >
                <option value="period">Per period</option>
                <option value="lifetime">Lifetime total</option>
              </select>
            </label>
            <label>
              Target completions
              <input
                type="number"
                min="1"
                max={
                  draft.target_basis === "lifetime"
                    ? 999
                    : draft.recurrence_interval === "daily"
                      ? 1
                      : draft.recurrence_interval === "weekly"
                        ? 7
                        : 31
                }
                value={draft.target_count}
                onChange={(e) => {
                  const max =
                    draft.target_basis === "lifetime"
                      ? 999
                      : draft.recurrence_interval === "daily"
                        ? 1
                        : draft.recurrence_interval === "weekly"
                          ? 7
                          : 31;
                  onChange({
                    ...draft,
                    target_count: String(
                      Math.min(max, Math.max(1, Number(e.target.value) || 1)),
                    ),
                  });
                }}
              />
            </label>
          </>
        ) : (
          draft.milestone_names.map((name, i) => (
            <label key={i}>
              Milestone {i + 1}
              <input
                value={name}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    milestone_names: draft.milestone_names.map((x, j) =>
                      j === i ? e.target.value : x,
                    ),
                  })
                }
              />
            </label>
          ))
        )}
        <div className="gb-date-fields">
          <label>
            Starts
            <input
              type="date"
              value={draft.start_date}
              onChange={(e) =>
                onChange({ ...draft, start_date: e.target.value })
              }
            />
          </label>
          <label>
            Ends · optional
            <input
              type="date"
              min={draft.start_date}
              value={draft.end_date}
              onChange={(e) => onChange({ ...draft, end_date: e.target.value })}
            />
          </label>
        </div>
        <label className="gb-checkbox">
          <input
            type="checkbox"
            checked={draft.is_private}
            onChange={(e) =>
              onChange({ ...draft, is_private: e.target.checked })
            }
          />
          Private goal
        </label>
      </details>
      {!valid(draft) && (
        <p role="alert" className="gb-error">
          Add a name, name each milestone, and check your date range.
        </p>
      )}
    </article>
  );
}

export function GoalBuilder({
  concept,
  open,
  onOpenChange,
}: {
  concept: Concept;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [step, setStep] = useState(0),
    [draft, setDraft] = useState<Draft>(fresh),
    [queue, setQueue] = useState<Draft[]>([]),
    [batch, setBatch] = useState(false),
    [lines, setLines] = useState(""),
    [created, setCreated] = useState(0);
  const resetBuilder = () => {
    setStep(0);
    setDraft(fresh());
    setQueue([]);
    setBatch(false);
    setLines("");
    setCreated(0);
  };
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetBuilder();
    onOpenChange(nextOpen);
  };
  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));
  const moveMilestone = (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= draft.milestone_names.length) return;
    const names = [...draft.milestone_names];
    [names[index], names[nextIndex]] = [names[nextIndex], names[index]];
    patch({ milestone_names: names });
  };
  const moveQueuedGoal = (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= queue.length) return;
    setQueue((goals) => {
      const next = [...goals];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };
  const goReview = () => {
    setQueue((q) => [...q, { ...draft, title: draft.title.trim() }]);
    setStep(3);
  };
  const count = Number(draft.target_count);
  const max =
    draft.target_basis === "lifetime"
      ? 30
      : draft.recurrence_interval === "daily"
        ? 1
        : draft.recurrence_interval === "weekly"
          ? 7
          : 31;
  const title = created
    ? "A little intention.\nA new beginning."
    : [
        "What do you want\nto make happen?",
        "What does showing\nup look like?",
        "Give it a beginning.\nMake it yours.",
        queue.length > 1
          ? "Your next chapter,\nall together."
          : "Meet your\nnew goal.",
      ][step];
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={`nw-modal gb-dialog nw-${concept}`}
        overlayClassName="nw-overlay"
        showCloseButton={false}
      >
        <button
          className="modal-close"
          aria-label="Close goal builder"
          onClick={() => handleOpenChange(false)}
        >
          <X size={20} />
        </button>
        <div className="gb-header">
          <span className="eyebrow">GOALMAXXING / CREATE</span>
          <span className="gb-demo-label">
            Interactive study · Nothing saved to your account
          </span>
        </div>
        {!created && (
          <nav className="gb-steps" aria-label="Creation steps">
            {steps.map((name, i) => (
              <button
                key={name}
                type="button"
                disabled={i !== step && (i > step || step === 3)}
                aria-current={i === step ? "step" : undefined}
                onClick={() => setStep(i)}
              >
                <span>{i < step ? <Check size={13} /> : i + 1}</span>
                <b>{name}</b>
              </button>
            ))}
          </nav>
        )}
        <div className={`gb-layout ${step === 3 || created ? "gb-wide" : ""}`}>
          <section className="gb-work">
            <DialogTitle className="gb-title">
              {title.split("\n").map((t, i) => (
                <span key={t}>{i === 1 ? <em>{t}</em> : t}</span>
              ))}
            </DialogTitle>
            <DialogDescription className="gb-description">
              {created
                ? "Your goals have been created in this preview. They haven’t been scheduled or saved to the real app."
                : step === 0
                  ? "Start with something that matters to you."
                  : step === 1
                    ? "Count the times you do it, or the steps that get you there."
                    : step === 2
                      ? "Choose a starting point. You can adjust it later."
                      : "One last look. Everything here is still editable."}
            </DialogDescription>
            {created ? (
              <div className="gb-success">
                <div className="gb-success-mark">
                  <Check size={38} />
                </div>
                <h3>
                  {created} {created === 1 ? "goal" : "goals"} created in the
                  demo
                </h3>
                {queue.map((d, i) => (
                  <div key={i}>
                    <i style={{ background: d.color }} />
                    <span>{d.title}</span>
                    <small>{description(d)}</small>
                  </div>
                ))}
                <button
                  className="primary"
                  onClick={() => {
                    setCreated(0);
                    setQueue([]);
                    setDraft(fresh());
                    setStep(0);
                    setBatch(false);
                    setLines("");
                  }}
                >
                  Create another <Plus size={18} />
                </button>
              </div>
            ) : (
              <>
                {step === 0 && (
                  <div className="gb-intention">
                    <div className="gb-mode">
                      <button
                        aria-pressed={!batch}
                        onClick={() => setBatch(false)}
                      >
                        One goal
                      </button>
                      <button
                        aria-pressed={batch}
                        onClick={() => setBatch(true)}
                      >
                        <Layers3 size={15} />
                        Multiple goals
                      </button>
                    </div>
                    {batch ? (
                      <>
                        <label htmlFor="gb-batch">
                          One goal on each line
                          <textarea
                            id="gb-batch"
                            rows={5}
                            placeholder={
                              "Run regularly\nRead more books\nLaunch my portfolio"
                            }
                            value={lines}
                            onChange={(e) => setLines(e.target.value)}
                          />
                        </label>
                        <p className="gb-helper">
                          Names only. The shared review starts each goal at 3
                          completions per week; change each one there.
                        </p>
                      </>
                    ) : (
                      <>
                        <label htmlFor="gb-title">
                          I want to…
                          <input
                            id="gb-title"
                            placeholder="Run my first half marathon"
                            value={draft.title}
                            onChange={(e) => patch({ title: e.target.value })}
                            maxLength={120}
                          />
                        </label>
                        <div className="gb-inspirations">
                          <span>A starting point</span>
                          {[
                            "Run regularly",
                            "Read more books",
                            "Launch my portfolio",
                          ].map((t) => (
                            <button key={t} onClick={() => patch({ title: t })}>
                              {t}
                              <ArrowRight size={14} />
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
                {step === 1 && (
                  <div className="gb-shape">
                    <div className="gb-type-options">
                      <button
                        aria-pressed={draft.frequency_type === "recurring"}
                        onClick={() => patch({ frequency_type: "recurring" })}
                      >
                        <Repeat2 size={24} />
                        <strong>Build a rhythm</strong>
                        <span>Repeat an action over time.</span>
                      </button>
                      <button
                        aria-pressed={
                          draft.frequency_type === "fixed_milestones"
                        }
                        onClick={() =>
                          patch({ frequency_type: "fixed_milestones" })
                        }
                      >
                        <Route size={24} />
                        <strong>Reach milestones</strong>
                        <span>A few steps toward a bigger thing.</span>
                      </button>
                    </div>
                    {draft.frequency_type === "recurring" ? (
                      <>
                        <div className="gb-mode">
                          {(["daily", "weekly", "monthly"] as const).map(
                            (interval) => (
                              <button
                                key={interval}
                                aria-pressed={
                                  draft.recurrence_interval === interval
                                }
                                onClick={() =>
                                  patch({
                                    recurrence_interval: interval,
                                    target_count:
                                      interval === "daily" ? "1" : "3",
                                  })
                                }
                              >
                                {interval[0].toUpperCase() + interval.slice(1)}
                              </button>
                            ),
                          )}
                        </div>
                        <div className="gb-counter">
                          <button
                            aria-label="Fewer completions"
                            disabled={count <= 1}
                            onClick={() =>
                              patch({ target_count: String(count - 1) })
                            }
                          >
                            <Minus size={20} />
                          </button>
                          <div>
                            <strong>{count}</strong>
                            <span>
                              {draft.target_basis === "lifetime"
                                ? "completions in total"
                                : `per ${draft.recurrence_interval === "daily" ? "day" : draft.recurrence_interval === "weekly" ? "week" : "month"}`}
                            </span>
                          </div>
                          <button
                            aria-label="More completions"
                            disabled={count >= max}
                            onClick={() =>
                              patch({ target_count: String(count + 1) })
                            }
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                        <div
                          className="gb-completion-beads"
                          aria-label={`${count} target completions`}
                        >
                          {Array.from({ length: count }, (_, i) => (
                            <span
                              key={i}
                              style={{
                                animationDelay: `${i * 25}ms`,
                                background: draft.color,
                              }}
                            />
                          ))}
                        </div>
                        <label className="gb-checkbox">
                          <input
                            type="checkbox"
                            checked={draft.target_basis === "lifetime"}
                            onChange={(e) =>
                              patch({
                                target_basis: e.target.checked
                                  ? "lifetime"
                                  : "period",
                                target_count: "1",
                              })
                            }
                          />
                          Set a lifetime total instead
                        </label>
                        <p className="gb-helper">
                          A flexible completion target, not fixed days or time
                          spent.
                        </p>
                      </>
                    ) : (
                      <div className="gb-milestones">
                        {draft.milestone_names.map((name, i) => (
                          <label key={i}>
                            <span>{String(i + 1).padStart(2, "0")}</span>
                            <input
                              aria-label={`Milestone ${i + 1}`}
                              value={name}
                              onChange={(e) =>
                                patch({
                                  milestone_names: draft.milestone_names.map(
                                    (x, j) => (j === i ? e.target.value : x),
                                  ),
                                })
                              }
                            />
                            {draft.milestone_names.length > 1 && (
                              <div className="gb-milestone-actions">
                                <button
                                  aria-label={`Move milestone ${i + 1} up`}
                                  disabled={i === 0}
                                  onClick={() => moveMilestone(i, "up")}
                                >
                                  <ArrowUp size={15} />
                                </button>
                                <button
                                  aria-label={`Move milestone ${i + 1} down`}
                                  disabled={i === draft.milestone_names.length - 1}
                                  onClick={() => moveMilestone(i, "down")}
                                >
                                  <ArrowDown size={15} />
                                </button>
                                <button
                                  aria-label={`Remove milestone ${i + 1}`}
                                  onClick={() =>
                                    patch({
                                      milestone_names:
                                        draft.milestone_names.filter(
                                          (_, j) => i !== j,
                                        ),
                                    })
                                  }
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            )}
                          </label>
                        ))}
                        <button
                          className="text-button"
                          onClick={() =>
                            patch({
                              milestone_names: [...draft.milestone_names, ""],
                            })
                          }
                        >
                          <Plus size={16} />
                          Add a milestone
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {step === 2 && (
                  <div className="gb-personalize">
                    <div className="gb-date-fields">
                      <label>
                        Start date
                        <input
                          type="date"
                          value={draft.start_date}
                          onChange={(e) =>
                            patch({ start_date: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        End date · optional
                        <input
                          type="date"
                          min={draft.start_date}
                          value={draft.end_date}
                          onChange={(e) => patch({ end_date: e.target.value })}
                        />
                      </label>
                    </div>
                    <fieldset>
                      <legend>Give it a color</legend>
                      <div className="gb-colors">
                        {COLORS.map((c, i) => (
                          <button
                            key={c}
                            aria-label={`Color ${i + 1}`}
                            aria-pressed={draft.color === c}
                            style={{ background: c }}
                            onClick={() => patch({ color: c })}
                          >
                            {draft.color === c ? <Check size={19} /> : null}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                    <button
                      className="gb-privacy"
                      aria-pressed={draft.is_private}
                      onClick={() => patch({ is_private: !draft.is_private })}
                    >
                      <LockKeyhole size={20} />
                      <span>
                        <strong>
                          {draft.is_private
                            ? "Just for you"
                            : "Not a private goal"}
                        </strong>
                        <small>
                          {draft.is_private
                            ? "Keep this goal private."
                            : "Use the app’s non-private visibility setting."}
                        </small>
                      </span>
                      <span
                        className={`gb-switch ${draft.is_private ? "on" : ""}`}
                      >
                        <i />
                      </span>
                    </button>
                    {!valid(draft) && (
                      <p className="gb-error" role="alert">
                        Check the goal name, milestone names, and date range.
                      </p>
                    )}
                  </div>
                )}
                {step === 3 && (
                  <>
                    <div className="gb-review-grid">
                      {queue.map((d, i) => (
                        <GoalReview
                          key={i}
                          index={i}
                          draft={d}
                          onChange={(next) =>
                            setQueue((q) =>
                              q.map((x, j) => (j === i ? next : x)),
                            )
                          }
                          onRemove={
                            queue.length > 1
                              ? () =>
                                  setQueue((q) => q.filter((_, j) => j !== i))
                              : undefined
                          }
                          onMove={(direction) => moveQueuedGoal(i, direction)}
                          isLast={i === queue.length - 1}
                        />
                      ))}
                    </div>
                    <button
                      className="gb-add-another"
                      onClick={() => {
                        setDraft(fresh());
                        setStep(0);
                        setBatch(false);
                      }}
                    >
                      <Plus size={20} /> Add another goal
                    </button>
                    <p className="gb-helper">
                      This is the same review card for a single goal or a whole
                      collection.
                    </p>
                  </>
                )}
              </>
            )}
          </section>
          {step < 3 && !created && (
            <aside className="gb-preview">
              <span className="eyebrow">YOUR GOAL, TAKING SHAPE</span>
              <div
                className={`gb-object ${draft.frequency_type === "fixed_milestones" ? "milestone-object" : ""}`}
                style={{ "--goal-tint": draft.color } as React.CSSProperties}
              >
                <span className="gb-object-icon">
                  {draft.frequency_type === "recurring" ? (
                    <Repeat2 size={30} />
                  ) : (
                    <Route size={30} />
                  )}
                </span>
                <h3>
                  {batch
                    ? "A collection of possibilities"
                    : draft.title || "Something worth showing up for."}
                </h3>
                <div className="gb-object-rule" />
                <p>
                  {batch
                    ? `${lines.split("\n").filter((x) => x.trim()).length} goals to shape`
                    : description(draft)}
                </p>
                {draft.frequency_type === "fixed_milestones" && !batch ? (
                  <ol>
                    {draft.milestone_names.map((n, i) => (
                      <li key={i}>{n || "Your next milestone"}</li>
                    ))}
                  </ol>
                ) : (
                  <div className="gb-object-dots">
                    {Array.from({ length: Math.min(count, 14) }, (_, i) => (
                      <i key={i} />
                    ))}
                  </div>
                )}
                <span>
                  {draft.start_date
                    ? `From ${draft.start_date}`
                    : "Choose a beginning"}
                </span>
              </div>
              <p>
                One intention.
                <br />A shape you can come back to.
              </p>
            </aside>
          )}
        </div>
        {!created && (
          <footer className="gb-footer">
            <button
              className="text-button"
              onClick={() =>
                step === 0
                  ? handleOpenChange(false)
                  : step === 3
                    ? (setDraft(fresh()), setBatch(false), setStep(0))
                    : setStep(step - 1)
              }
            >
              <ArrowLeft size={16} />
              {step === 0
                ? "Close"
                : step === 3
                  ? "Add / build another"
                  : "Back"}
            </button>
            <span>
              {step === 3
                ? `${queue.length} ${queue.length === 1 ? "goal" : "goals"} ready to review`
                : `${step + 1} of 4`}
            </span>
            <button
              className="primary"
              disabled={
                step === 0
                  ? batch
                    ? !lines.split("\n").some((x) => x.trim())
                    : !draft.title.trim()
                  : step === 3
                    ? !queue.length || !queue.every(valid)
                    : !valid(draft)
              }
              onClick={() => {
                if (step === 3) {
                  setCreated(queue.length);
                } else if (step === 0 && batch) {
                  const names = lines
                    .split("\n")
                    .map((x) => x.trim())
                    .filter(Boolean);
                  setQueue((q) => [
                    ...q,
                    ...names.map((title) => ({ ...fresh(), title })),
                  ]);
                  setStep(3);
                } else if (step === 2) {
                  goReview();
                } else setStep(step + 1);
              }}
            >
              {step === 3
                ? `Create ${queue.length === 1 ? "goal" : `${queue.length} goals`} in demo`
                : step === 2 || batch
                  ? "Review goals"
                  : "Continue"}
              <ArrowRight size={18} />
            </button>
          </footer>
        )}
      </DialogContent>
    </Dialog>
  );
}
