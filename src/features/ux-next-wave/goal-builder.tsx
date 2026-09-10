import { useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  CircleDot,
  Command,
  LockKeyhole,
  Minus,
  Orbit,
  Palette,
  Plus,
  Repeat2,
  Route,
  Sparkles,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Concept } from "./model";
import "./styles/goal-builder.css";

type Cadence = "daily" | "weekly" | "monthly" | "milestones";
type Draft = {
  title: string;
  cadence: Cadence;
  target: number;
  color: string;
  private: boolean;
  milestones: string[];
};

const colors = ["#89b59b", "#87a6dc", "#d88cab", "#d9b26e", "#af9ad5"];
const fresh = (): Draft => ({
  title: "",
  cadence: "weekly",
  target: 3,
  color: colors[0],
  private: true,
  milestones: ["Begin", "Build", "Finish"],
});
const cadenceLabel = (draft: Draft) =>
  draft.cadence === "milestones"
    ? `${draft.milestones.filter(Boolean).length} milestones`
    : `${draft.target} completion${draft.target === 1 ? "" : "s"} per ${draft.cadence === "daily" ? "day" : draft.cadence === "weekly" ? "week" : "month"}`;

function Close({ close }: { close: () => void }) {
  return (
    <button
      className="goal-close"
      onClick={close}
      aria-label="Close goal builder"
    >
      <X size={19} />
    </button>
  );
}
function GoalName({
  draft,
  setDraft,
  autoFocus = false,
}: {
  draft: Draft;
  setDraft: (next: Draft) => void;
  autoFocus?: boolean;
}) {
  return (
    <label className="goal-name-field">
      Name your goal
      <input
        autoFocus={autoFocus}
        value={draft.title}
        placeholder="Read more books"
        onChange={(event) => setDraft({ ...draft, title: event.target.value })}
      />
    </label>
  );
}
function Finish({ draft, onCreate }: { draft: Draft; onCreate: () => void }) {
  return (
    <button
      className="goal-primary"
      disabled={!draft.title.trim()}
      onClick={onCreate}
    >
      Create in demo <ChevronRight size={18} />
    </button>
  );
}
function Success({ draft, reset }: { draft: Draft; reset: () => void }) {
  return (
    <section className="goal-success">
      <span>
        <Check size={30} />
      </span>
      <p>Preview created</p>
      <h2>{draft.title}</h2>
      <small>{cadenceLabel(draft)} · Nothing was saved to your account.</small>
      <button className="goal-primary" onClick={reset}>
        Create another <Plus size={17} />
      </button>
    </section>
  );
}

function Prism({
  draft,
  setDraft,
  finish,
}: {
  draft: Draft;
  setDraft: (next: Draft) => void;
  finish: () => void;
}) {
  const rings = ["daily", "weekly", "monthly"] as const;
  return (
    <div className="goal-prism">
      <div className="prism-copy">
        <p className="goal-kicker">
          <Sparkles size={14} /> A seed for the future
        </p>
        <DialogTitle>Give your next chapter a center.</DialogTitle>
        <DialogDescription>
          Set the intention, then choose the rhythm that will orbit it.
        </DialogDescription>
        <GoalName draft={draft} setDraft={setDraft} autoFocus />
        <div className="prism-rings" aria-label="Choose a rhythm">
          {rings.map((cadence, index) => (
            <button
              key={cadence}
              aria-pressed={draft.cadence === cadence}
              onClick={() =>
                setDraft({
                  ...draft,
                  cadence,
                  target: cadence === "daily" ? 1 : 3,
                })
              }
            >
              <i style={{ "--ring": index } as React.CSSProperties} />
              <strong>{cadence}</strong>
              <span>
                {cadence === "daily"
                  ? "A little every day"
                  : cadence === "weekly"
                    ? "A rhythm to return to"
                    : "A monthly reset"}
              </span>
            </button>
          ))}
        </div>
        <Finish draft={draft} onCreate={finish} />
      </div>
      <div
        className="prism-world"
        style={{ "--goal": draft.color } as React.CSSProperties}
      >
        <div className="prism-glow" />
        <div className="prism-orbit orbit-a" />
        <div className="prism-orbit orbit-b" />
        <div className="prism-orbit orbit-c" />
        <div className="prism-core">
          <span>
            <Orbit size={28} />
          </span>
          <strong>{draft.title || "Your intention"}</strong>
          <small>{cadenceLabel(draft)}</small>
        </div>
        <p>Tap a ring to change the pull of this goal.</p>
      </div>
    </div>
  );
}

function Tempo({
  draft,
  setDraft,
  finish,
}: {
  draft: Draft;
  setDraft: (next: Draft) => void;
  finish: () => void;
}) {
  const steps = [1, 2, 3, 4, 5, 6, 7];
  return (
    <div className="goal-tempo">
      <header>
        <p className="goal-kicker">BUILD A RHYTHM</p>
        <DialogTitle>How often feels true?</DialogTitle>
        <DialogDescription>
          This is a completion target, never a measure of hours.
        </DialogDescription>
      </header>
      <GoalName draft={draft} setDraft={setDraft} autoFocus />
      <div className="tempo-beats" aria-label="Choose weekly completion target">
        {steps.map((beat) => (
          <button
            key={beat}
            aria-pressed={draft.target === beat && draft.cadence === "weekly"}
            onClick={() =>
              setDraft({ ...draft, cadence: "weekly", target: beat })
            }
          >
            <span>
              {beat <= draft.target && draft.cadence === "weekly" ? (
                <Check size={16} />
              ) : (
                beat
              )}
            </span>
            <small>{beat === 1 ? "once" : `${beat}×`}</small>
          </button>
        ))}
      </div>
      <div className="tempo-summary">
        <div>
          <Repeat2 size={20} />
          <strong>{draft.target}</strong>
          <span>times each week</span>
        </div>
        <button
          onClick={() =>
            setDraft({ ...draft, target: Math.max(1, draft.target - 1) })
          }
          aria-label="Fewer weekly completions"
        >
          <Minus size={17} />
        </button>
        <button
          onClick={() =>
            setDraft({ ...draft, target: Math.min(7, draft.target + 1) })
          }
          aria-label="More weekly completions"
        >
          <Plus size={17} />
        </button>
      </div>
      <footer>
        <button
          className="goal-text"
          onClick={() => setDraft({ ...draft, cadence: "milestones" })}
        >
          <Route size={16} /> I need milestones instead
        </button>
        <Finish draft={draft} onCreate={finish} />
      </footer>
    </div>
  );
}

function Weave({
  draft,
  setDraft,
  finish,
}: {
  draft: Draft;
  setDraft: (next: Draft) => void;
  finish: () => void;
}) {
  const active = draft.cadence === "milestones";
  const updateMilestone = (index: number, value: string) =>
    setDraft({
      ...draft,
      milestones: draft.milestones.map((entry, position) =>
        position === index ? value : entry,
      ),
    });
  return (
    <div className="goal-weave">
      <aside>
        <p className="goal-kicker">GOAL THREAD</p>
        <GoalName draft={draft} setDraft={setDraft} autoFocus />
        <p>
          Build a visible path from the first step to the moment it becomes
          real.
        </p>
        <button
          className="weave-kind"
          aria-pressed={!active}
          onClick={() => setDraft({ ...draft, cadence: "weekly" })}
        >
          <Repeat2 size={18} /> A repeating thread
        </button>
        <button
          className="weave-kind"
          aria-pressed={active}
          onClick={() => setDraft({ ...draft, cadence: "milestones" })}
        >
          <Route size={18} /> A thread with milestones
        </button>
        <Finish draft={draft} onCreate={finish} />
      </aside>
      <section className="weave-canvas">
        <span className="weave-label">
          {active ? "Name the knots in your thread" : "A repeatable pattern"}
        </span>
        {active ? (
          <div className="weave-steps">
            {draft.milestones.map((milestone, index) => (
              <label key={index}>
                <b>{String(index + 1).padStart(2, "0")}</b>
                <input
                  aria-label={`Milestone ${index + 1}`}
                  value={milestone}
                  onChange={(event) =>
                    updateMilestone(index, event.target.value)
                  }
                  placeholder="Name this step"
                />
                {index < draft.milestones.length - 1 && <i />}
              </label>
            ))}
            <button
              className="weave-add"
              onClick={() =>
                setDraft({
                  ...draft,
                  milestones: [...draft.milestones, ""],
                })
              }
            >
              <Plus size={16} /> Add a knot
            </button>
          </div>
        ) : (
          <div className="weave-pattern">
            {Array.from({ length: 12 }, (_, index) => (
              <button
                key={index}
                aria-pressed={index < draft.target}
                onClick={() =>
                  setDraft({
                    ...draft,
                    cadence: "weekly",
                    target: index + 1,
                  })
                }
              >
                <i />
              </button>
            ))}
            <p>
              Choose the number of times you want to return to this goal each
              week.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function Mosaic({
  draft,
  setDraft,
  finish,
}: {
  draft: Draft;
  setDraft: (next: Draft) => void;
  finish: () => void;
}) {
  return (
    <div className="goal-mosaic">
      <header>
        <p className="goal-kicker">
          <Palette size={14} /> MAKE A PIECE OF YOUR WEEK
        </p>
        <DialogTitle>A goal should feel like it belongs to you.</DialogTitle>
      </header>
      <div className="mosaic-board">
        <section
          className="mosaic-tile large"
          style={{ background: draft.color }}
        >
          <span>
            {draft.cadence === "milestones" ? (
              <Route size={30} />
            ) : (
              <CircleDot size={30} />
            )}
          </span>
          <strong>{draft.title || "A new piece"}</strong>
          <small>{cadenceLabel(draft)}</small>
        </section>
        <section className="mosaic-controls">
          <GoalName draft={draft} setDraft={setDraft} autoFocus />
          <p>Choose its color</p>
          <div className="mosaic-colors">
            {colors.map((color, index) => (
              <button
                key={color}
                style={{ background: color }}
                aria-label={`Color ${index + 1}`}
                aria-pressed={draft.color === color}
                onClick={() => setDraft({ ...draft, color })}
              >
                {draft.color === color && <Check size={16} />}
              </button>
            ))}
          </div>
          <button
            className="mosaic-privacy"
            aria-pressed={draft.private}
            onClick={() => setDraft({ ...draft, private: !draft.private })}
          >
            <LockKeyhole size={18} />
            <span>
              <strong>
                {draft.private
                  ? "Kept with you"
                  : "Visible outside your private space"}
              </strong>
              <small>Toggle the goal’s visibility setting.</small>
            </span>
            <i>{draft.private ? <Check size={15} /> : null}</i>
          </button>
          <Finish draft={draft} onCreate={finish} />
        </section>
        <div className="mosaic-tile mini one" />
        <div className="mosaic-tile mini two" />
        <div className="mosaic-tile mini three" />
      </div>
    </div>
  );
}

function Script({
  draft,
  setDraft,
  finish,
}: {
  draft: Draft;
  setDraft: (next: Draft) => void;
  finish: () => void;
}) {
  const [text, setText] = useState("");
  const apply = (title: string, target = 3) => {
    setText(`I want to ${title.toLowerCase()}, ${target} times each week`);
    setDraft({ ...draft, title, cadence: "weekly", target });
  };
  const parsed = draft.title.trim();
  return (
    <div className="goal-script">
      <header>
        <span>
          <Command size={18} />
        </span>
        <div>
          <p className="goal-kicker">WRITE THE INTENTION</p>
          <DialogTitle>Say what you mean.</DialogTitle>
        </div>
      </header>
      <label className="script-input">
        I want to
        <input
          autoFocus
          aria-label="Describe your goal"
          value={text}
          placeholder="Read more books, 3 times each week"
          onChange={(event) => {
            setText(event.target.value);
            const words = event.target.value
              .replace(/^I want to\s*/i, "")
              .split(/,|\d+\s+times?/i)[0]
              .trim();
            setDraft({
              ...draft,
              title: words ? words[0].toUpperCase() + words.slice(1) : "",
            });
          }}
        />
      </label>
      <div className="script-suggestions">
        <span>Try one</span>
        <button onClick={() => apply("Read more books")}>
          Read more books
        </button>
        <button onClick={() => apply("Run regularly", 2)}>
          Run regularly, twice a week
        </button>
        <button
          onClick={() => {
            setText("Launch my portfolio in milestones");
            setDraft({
              ...draft,
              title: "Launch my portfolio",
              cadence: "milestones",
            });
          }}
        >
          Launch my portfolio in milestones
        </button>
      </div>
      <section className="script-reading">
        <p>The plan says</p>
        {parsed ? (
          <>
            <strong>{draft.title}</strong>
            <span>
              {draft.cadence === "milestones"
                ? "will unfold through milestones."
                : `will be completed ${draft.target} times each week.`}
            </span>
            <button
              className="goal-text"
              onClick={() =>
                setDraft({
                  ...draft,
                  target: draft.target === 3 ? 2 : 3,
                })
              }
            >
              Change to {draft.target === 3 ? "2" : "3"} times a week
            </button>
          </>
        ) : (
          <em>Your goal will become a clear, editable sentence here.</em>
        )}
      </section>
      <footer>
        <small>
          Plain language is a starting point. You can always edit the result.
        </small>
        <Finish draft={draft} onCreate={finish} />
      </footer>
    </div>
  );
}

const builders = {
  prism: Prism,
  tempo: Tempo,
  weave: Weave,
  mosaic: Mosaic,
  script: Script,
};

export function GoalBuilder({
  concept,
  open,
  onOpenChange,
}: {
  concept: Concept;
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const [draft, setDraft] = useState<Draft>(fresh);
  const [created, setCreated] = useState(false);
  const Builder = builders[concept];
  const close = () => {
    setDraft(fresh());
    setCreated(false);
    onOpenChange(false);
  };
  const reset = () => {
    setDraft(fresh());
    setCreated(false);
  };
  const dialogueTitle = useMemo(
    () => `Create a goal with ${concept}`,
    [concept],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : close())}
    >
      <DialogContent
        className={`nw-modal goal-dialog goal-${concept}`}
        overlayClassName="nw-overlay"
        showCloseButton={false}
      >
        <Close close={close} />
        {created ? (
          <>
            <DialogTitle className="sr-only">Goal preview created</DialogTitle>
            <Success draft={draft} reset={reset} />
          </>
        ) : (
          <>
            <DialogTitle className="sr-only">{dialogueTitle}</DialogTitle>
            <Builder
              draft={draft}
              setDraft={setDraft}
              finish={() => setCreated(true)}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
