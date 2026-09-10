import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { defaultDraft, draftError, type GoalDraft } from "./model";
import {
  GoalDetailFields,
  GoalDraftPreview,
  GoalIntentionFields,
  GoalShapeFields,
} from "./goal-fields";
import type { Lab } from "./use-lab";

export function GoalBuilder({ s }: { s: Lab }) {
  if (!s.creating) return null;
  if (s.concept === "glide")
    return (
      <Dialog
        open
        onOpenChange={(v) => {
          if (!v) s.setCreating(false);
        }}
      >
        <DialogContent
          className="il-dialog il-builder-dialog il-theme-glide"
          overlayClassName="il-overlay"
          showCloseButton={false}
        >
          <div className="il-section-heading">
            <DialogTitle>A new beginning</DialogTitle>
            <DialogClose className="il-icon" aria-label="Close goal creation">
              <X size={19} />
            </DialogClose>
          </div>
          <DialogDescription>
            Make a goal that fits your life. Review everything before adding it.
          </DialogDescription>
          <BuilderForm s={s} />
        </DialogContent>
      </Dialog>
    );
  const blueprint = s.concept === "index" || s.concept === "lens";
  return (
    <section
      className={`il-builder il-theme-${s.concept} ${blueprint ? "il-builder-blueprint" : ""}`}
      aria-label="Create a goal"
    >
      <div className="il-section-heading">
        <div>
          <span className="il-eyebrow">
            {blueprint
              ? "Shape the goal. See it take form."
              : s.concept === "fold"
                ? "Build it right here"
                : "New goal / setup"}
          </span>
          <h2>{blueprint ? "Your goal blueprint" : "A new beginning"}</h2>
        </div>
        <button
          className="il-icon"
          aria-label="Close goal creation"
          onClick={() => s.setCreating(false)}
        >
          <X size={19} />
        </button>
      </div>
      <BuilderForm s={s} blueprint={blueprint} />
    </section>
  );
}
function BuilderForm({
  s,
  blueprint = false,
}: {
  s: Lab;
  blueprint?: boolean;
}) {
  const [draft, setDraft] = useState<GoalDraft>(() => defaultDraft(s.date));
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const patch = (p: Partial<GoalDraft>) => {
    setDraft((old) => ({ ...old, ...p }));
    setError(null);
  };
  const fields = { draft, patch, goals: s.data.goals };
  const steps = ["Intention", "Shape", "Details", "Review"];
  const advance = () => {
    if (step === 0 && !draft.title.trim()) {
      setError("Give it a name to continue.");
      return;
    }
    if ((step === 2 || blueprint) && draftError(draft)) {
      setError(draftError(draft));
      return;
    }
    setStep(blueprint ? 3 : step + 1);
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (step < 3) advance();
        else {
          const issue = draftError(draft);
          if (issue) setError(issue);
          else s.create(draft);
        }
      }}
    >
      {!blueprint && (
        <nav className="il-builder-steps" aria-label="Goal creation steps">
          {steps.map((name, i) => (
            <button
              key={name}
              type="button"
              aria-current={i === step ? "step" : undefined}
              disabled={i > step}
              onClick={() => setStep(i)}
            >
              <span>{i < step ? <Check size={12} /> : i + 1}</span>
              {name}
            </button>
          ))}
        </nav>
      )}
      <div className={blueprint && step < 3 ? "il-blueprint-layout" : ""}>
        <div className="il-builder-body" key={step}>
          {step < 3 && blueprint ? (
            <>
              <GoalIntentionFields {...fields} />
              <GoalShapeFields {...fields} />
              <GoalDetailFields {...fields} />
            </>
          ) : step === 0 ? (
            <GoalIntentionFields {...fields} />
          ) : step === 1 ? (
            <GoalShapeFields {...fields} />
          ) : step === 2 ? (
            <GoalDetailFields {...fields} />
          ) : (
            <>
              <h3>Looks like a good beginning.</h3>
              <GoalDraftPreview draft={draft} goals={s.data.goals} />
              <p>
                The first occurrence or milestones go into Unplanned. Nothing is
                scheduled automatically in this study.
              </p>
              <button
                className="il-text-button"
                type="button"
                onClick={() => setStep(0)}
              >
                Edit this goal
              </button>
            </>
          )}
        </div>
        {blueprint && step < 3 && (
          <aside className="il-blueprint-preview">
            <GoalDraftPreview draft={draft} goals={s.data.goals} live />
          </aside>
        )}
      </div>
      {error && (
        <p role="alert" className="il-form-error">
          {error}
        </p>
      )}
      <div className="il-actions">
        <button
          type="button"
          className="il-secondary"
          onClick={() =>
            step ? setStep(blueprint ? 0 : step - 1) : s.setCreating(false)
          }
        >
          <ArrowLeft size={15} />
          {step ? "Back" : "Cancel"}
        </button>
        <button className="il-primary" type="submit">
          {step === 3
            ? "Create in demo"
            : blueprint
              ? "Review goal"
              : "Continue"}
          {step === 3 ? <Check size={16} /> : <ArrowRight size={16} />}
        </button>
      </div>
    </form>
  );
}
