import { type RefObject, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Plus, Sparkles, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { GoalFields, DraftReceipt } from "./fields";
import { GoalPreview } from "./goal-preview";
import {
  CONCEPTS,
  type Concept,
  type Draft,
  newDraft,
  draftErrors,
  rhythm,
} from "./model";

const STEPS = ["Approach", "Intention", "Shape", "Schedule", "Review"];
export function Creation({
  concept,
  open,
  onOpenChange,
  onCreated,
  returnFocusRef,
}: {
  concept: Concept;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (drafts: Draft[]) => void;
  returnFocusRef?: RefObject<HTMLButtonElement | null>;
}) {
  const [drafts, setDrafts] = useState<Draft[]>(() => [newDraft()]);
  const [active, setActive] = useState(0);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"single" | "assisted">("single");
  const [prompt, setPrompt] = useState(
    "Run a first half marathon\nBuild a strength habit",
  );
  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const d = drafts[active];
  const current = CONCEPTS.find((c) => c.id === concept)!;
  useEffect(() => {
    if (open) heading.current?.focus();
  }, [step, open, saved]);
  const update = (draft: Draft) =>
    setDrafts((previous) => previous.map((x, i) => (i === active ? draft : x)));
  const reset = () => {
    setDrafts([newDraft()]);
    setActive(0);
    setStep(0);
    setNotice("");
    setSaved(false);
  };
  const move = (next: number) => {
    setNotice("");
    setStep(next);
  };
  const submit = () => {
    if (step === 0) {
      if (mode === "assisted") {
        const names = prompt
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean);
        if (!names.length) {
          setNotice("Add at least one intention.");
          return;
        }
        setDrafts(names.map((title) => ({ ...newDraft(), title })));
        setActive(0);
      } else {
        setDrafts([d]);
        setActive(0);
      }
      move(1);
      return;
    }
    if (
      step === 1 &&
      (!d.title.trim() ||
        (d.category_selection === "custom" && !d.custom_category.trim()))
    ) {
      setNotice("Add a name and a category before continuing.");
      return;
    }
    if (
      step === 2 &&
      d.kind !== "planner_task" &&
      (!/^\d+$/.test(d.target_count) || Number(d.target_count) < 1)
    ) {
      setNotice("Choose a positive, whole-number target.");
      return;
    }
    if (step === 3 || step === 4) {
      const invalid = (step === 4 ? drafts : [d]).find(
        (x) => draftErrors(x).length,
      );
      if (invalid) {
        setNotice(
          `${invalid.title || "This goal"}: ${draftErrors(invalid)[0]}`,
        );
        return;
      }
    }
    if (step < 4) move(step + 1);
    else {
      onCreated(drafts);
      setSaved(true);
    }
  };
  const titles =
    concept === "script"
      ? [
          "Start with a thought.",
          "What would you like to change?",
          "How will you return to it?",
          "Give it a place in your life.",
          "This is what you’re committing to.",
        ]
      : concept === "weave"
        ? [
            "Choose your first thread.",
            "Give the thread a purpose.",
            "Find your repeatable rhythm.",
            "Where does it begin and end?",
            "Your pattern, ready to begin.",
          ]
        : [
            "A little intention goes a long way.",
            "What are we working toward?",
            "Make it something you can do.",
            "Give yourself a horizon.",
            "A clear commitment.",
          ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`j-modal j-${concept}`}
        overlayClassName="j-overlay"
        showCloseButton={false}
        onCloseAutoFocus={(event) => {
          if (returnFocusRef?.current) {
            event.preventDefault();
            returnFocusRef.current.focus();
          }
        }}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="j-modal-top">
          <span className="j-kicker">
            {current.creation} /{" "}
            {saved ? "Ready" : `${String(step + 1).padStart(2, "0")} of 05`}
          </span>
          <button
            className="j-icon"
            aria-label="Close and keep draft"
            onClick={() => onOpenChange(false)}
          >
            <X size={20} />
          </button>
        </div>
        <DialogDescription className="j-small">
          Interactive study · simulated creation · drafts stay until you reload.
        </DialogDescription>
        {saved ? (
          <div className="j-success">
            <span className="j-seal">
              <Check size={42} />
            </span>
            <DialogTitle ref={heading} tabIndex={-1}>
              {drafts.length === 1
                ? "A beginning worth making."
                : `${drafts.length} intentions, ready to go.`}
            </DialogTitle>
            <p>
              Your{" "}
              {drafts.some((x) => x.kind === "planner_task")
                ? "goals and tasks are"
                : drafts.length === 1
                  ? "goal is"
                  : "goals are"}{" "}
              in this study’s plan. Nothing has been added to your account.
            </p>
            {drafts.map((x) => (
              <div className="j-saved-row" key={x.id}>
                <Check size={16} />
                <strong>{x.title}</strong>
                <span>{rhythm(x)}</span>
              </div>
            ))}
            <button
              className="j-primary"
              onClick={() => {
                onOpenChange(false);
                reset();
              }}
            >
              See my study plan <ArrowRight size={17} />
            </button>
          </div>
        ) : (
          <>
            <nav className="j-stepper" aria-label="Creation steps">
              {STEPS.map((s, i) => (
                <button
                  key={s}
                  aria-current={step === i ? "step" : undefined}
                  disabled={i > step}
                  onClick={() => move(i)}
                >
                  <span>{i < step ? <Check size={13} /> : i + 1}</span>
                  {s}
                </button>
              ))}
            </nav>
            <div className="j-builder-layout">
              <div className="j-builder-main">
                <DialogTitle
                  ref={heading}
                  tabIndex={-1}
                  className="j-step-title"
                >
                  {titles[step]}
                </DialogTitle>
                {mode === "assisted" && step > 0 && (
                  <>
                    <p className="j-note">
                      Suggested defaults: Health · recurring · 3 days/week ·
                      starts today · no end date. Review every draft.
                    </p>
                    <div className="j-draft-tabs" aria-label="Drafts">
                      {drafts.map((x, i) => (
                        <button
                          key={x.id}
                          aria-pressed={i === active}
                          onClick={() => {
                            setActive(i);
                            setNotice("");
                          }}
                        >
                          {i + 1}. {x.title || "Untitled"}
                        </button>
                      ))}
                      <button
                        aria-label="Add draft"
                        onClick={() => {
                          setDrafts([...drafts, newDraft()]);
                          setActive(drafts.length);
                          move(1);
                        }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submit();
                  }}
                  id="j-create-form"
                  noValidate
                >
                  {step === 0 ? (
                    <div className="j-fields">
                      <div className="j-entry-choices">
                        <button
                          type="button"
                          aria-pressed={mode === "single"}
                          onClick={() => setMode("single")}
                        >
                          <Plus size={22} />
                          <strong>One goal, by hand</strong>
                          <span>A few small decisions. Entirely yours.</span>
                        </button>
                        <button
                          type="button"
                          aria-pressed={mode === "assisted"}
                          onClick={() => setMode("assisted")}
                        >
                          <Sparkles size={22} />
                          <strong>Shape it with AI</strong>
                          <span>
                            Start with your intentions. Refine together.
                          </span>
                        </button>
                      </div>
                      {mode === "assisted" && (
                        <label className="j-field">
                          <span>Your intentions</span>
                          <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={4}
                          />
                          <small>
                            AI journey preview: this demo turns each nonempty
                            line into an editable goal with disclosed defaults.
                            No LLM is called.
                          </small>
                        </label>
                      )}
                      <p className="j-small">
                        Recurring goals, milestones, and one-time tasks. You’ll
                        review everything before adding it.
                      </p>
                    </div>
                  ) : step < 4 ? (
                    <GoalFields draft={d} setDraft={update} step={step} />
                  ) : (
                    <div className="j-review-list">
                      {drafts.map((x, i) => (
                        <article key={x.id}>
                          <div className="j-between">
                            <h3>{x.title || "Untitled"}</h3>
                            <div>
                              <button
                                className="j-text"
                                type="button"
                                onClick={() => {
                                  setActive(i);
                                  move(1);
                                }}
                              >
                                Edit
                              </button>
                              {drafts.length > 1 && (
                                <button
                                  className="j-text"
                                  aria-label={`Remove ${x.title}`}
                                  type="button"
                                  onClick={() => {
                                    setDrafts(
                                      drafts.filter((_, index) => index !== i),
                                    );
                                    setActive(0);
                                  }}
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                          <DraftReceipt draft={x} />
                          {draftErrors(x).map((error) => (
                            <p className="j-error" key={error}>
                              {error}
                            </p>
                          ))}
                        </article>
                      ))}
                    </div>
                  )}
                  {notice && (
                    <p role="alert" className="j-error">
                      {notice}
                    </p>
                  )}
                </form>
              </div>
              <GoalPreview concept={concept} draft={d} />
            </div>
            <footer className="j-modal-footer">
              <button
                className="j-text"
                onClick={
                  step
                    ? () => move(step - 1)
                    : () => {
                        onOpenChange(false);
                        reset();
                      }
                }
              >
                {step ? (
                  <>
                    <ArrowLeft size={15} /> Back
                  </>
                ) : (
                  "Discard draft"
                )}
              </button>
              <span className="j-small">
                {step === 4
                  ? "Only added to this prototype"
                  : "You can refine this before saving"}
              </span>
              <button className="j-primary" type="submit" form="j-create-form">
                {step === 4
                  ? `Add ${drafts.length === 1 ? (d.kind === "planner_task" ? "task" : "goal") : `${drafts.length} goals`}`
                  : step === 0 && mode === "assisted"
                    ? "Preview suggestions"
                    : "Continue"}
                <ArrowRight size={16} />
              </button>
            </footer>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
