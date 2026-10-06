"use client";

import { RotateCcw } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { LoadingCard } from "@/components/ui/loading-card";
import { useCoachPageContext } from "@/features/coach/use-coach-page-context";
import type { GoalFormState } from "@/features/today/goal-form-model";
import { useGoalFormState } from "@/features/today/use-goal-form-state";
import { useGoalFormSubmit } from "@/features/today/use-goal-form-submit";
import { useAppRouter } from "@/lib/navigation/use-app-router";
import { GoalFormLinkTargetsErrorAlert, GoalFormRecoveryAlert } from "../goal-form-alerts";
import { TempoGoalCard } from "../tempo-goal-card";
import { AnnotatedCard } from "./annotated-card";
import { CardBack } from "./card-back";
import type { CardEditorSession } from "./card-editor-session";
import { changedCardFacts } from "./card-facts";
import { DirectCard } from "./direct-card";
import { useElementWidth } from "./use-card-regions";

/** Below this width the callouts can't sit beside the card, so the card itself becomes the control. */
const ANNOTATED_MIN_WIDTH = 860;
const FORM_ID = "goal-card-editor";

/**
 * Edit a goal on its card: the annotated card where there is room beside it, otherwise the
 * direct card, with
 * the quieter settings on the card's back. Saving, links, archive and delete reuse the
 * goal form's state and submit paths, so the server contract is unchanged.
 */
export function GoalCardEditor({ goalId, onExit, onDismiss }: { goalId: string; onExit: () => void; onDismiss: () => void }) {
  const router = useAppRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(editorRef, typeof window === "undefined" ? ANNOTATED_MIN_WIDTH : window.innerWidth);
  const direct = width < ANNOTATED_MIN_WIDTH;
  const [flipped, setFlipped] = useState(false);
  const [restoredGoalId, setRestoredGoalId] = useState<string | null>(null);
  const form = useGoalFormState(goalId);
  const { state, setState, selectedLinkTarget, setSelectedLinkTarget, loading, editingGoal } = form;
  useCoachPageContext({ surface: "goal", selectedGoalId: goalId }, 10);

  const submit = useGoalFormSubmit({
    goalId,
    state,
    selectedLinkTarget,
    isPlannerTask: false,
    linkTargetsReady: form.linkTargetsReady,
    linkTargetsError: form.linkTargetsError,
    validationError: form.validationError,
    supabase: form.supabase,
    completeAndExit: onExit,
    dismissWithoutRefresh: onDismiss,
    onExitRefresh: () => router.refresh(),
  });

  // The loaded goal is the baseline for "changed" marks and Discard.
  const [baseline, setBaseline] = useState<{ goalId: string; state: GoalFormState; link: string } | null>(null);
  if (!loading && editingGoal && baseline?.goalId !== editingGoal.id) {
    setBaseline({ goalId: editingGoal.id, state, link: selectedLinkTarget });
  }

  const busy = submit.saving || submit.recovery !== null;
  const patch = useCallback(
    (next: Partial<GoalFormState>) => {
      if (busy) return;
      setState((previous) => ({ ...previous, ...next }));
    },
    [busy, setState],
  );
  const changed = useMemo(
    () => (baseline ? changedCardFacts(baseline.state, state, baseline.link !== selectedLinkTarget) : new Set<never>()),
    [baseline, state, selectedLinkTarget],
  );

  if (loading || !editingGoal || !baseline) {
    return (
      <div ref={editorRef} className="card-editor-shell">
        <LoadingCard title="Loading goal…" description="Laying out your card." />
      </div>
    );
  }

  const session: CardEditorSession = {
    fields: state,
    patch,
    completed: form.completedCount,
    changed,
    canChangeVisibility: state.team_id === null,
    link:
      state.team_id === null
        ? {
            value: selectedLinkTarget,
            // A linked goal that's no longer a candidate (achieved, archived, or failed to load) is still linked.
            selectedTitle: selectedLinkTarget === "none" ? null : form.selectedLinkTargetGoal?.title ?? "Another goal",
            options: form.filteredLinkTargets,
            search: form.linkTargetSearch,
            onSearch: form.setLinkTargetSearch,
            onChange: (target) => !busy && setSelectedLinkTarget(target),
          }
        : null,
  };
  // The form loads the goal once, so a restore made here is reflected locally.
  const archived = Boolean(editingGoal.archived_at) && restoredGoalId !== editingGoal.id;
  const card = <TempoGoalCard fields={state} context="history" rotatable={false} />;
  const back = (
    <CardBack
      session={session}
      lifecycle={{
        archived,
        busy,
        onArchive: () => void submit.toggleArchive(false),
        onRestore: () => void submit.toggleArchive(true).then((restored) => restored && setRestoredGoalId(editingGoal.id)),
        onDelete: () => void submit.softDeleteGoal(),
      }}
    />
  );
  const dirty = changed.size > 0;

  return (
    <div ref={editorRef} className="card-editor-shell">
    <form id={FORM_ID} className="card-editor" data-layout={direct ? "direct" : "annotated"} onSubmit={(event) => void submit.onSubmit(event)}
      // Enter finishes the field being edited; only the Save button submits.
      onKeyDown={(event) => event.key === "Enter" && event.target instanceof HTMLInputElement && event.preventDefault()}
    >
      {submit.recovery ? (
        <GoalFormRecoveryAlert
          kind={submit.recovery.kind}
          saving={submit.saving}
          onRetry={() =>
            submit.recovery?.kind === "link"
              ? void submit.retryGoalLink()
              : (document.getElementById(FORM_ID) as HTMLFormElement | null)?.requestSubmit()
          }
        />
      ) : null}
      {form.linkTargetsError ? (
        <GoalFormLinkTargetsErrorAlert
          message={form.linkTargetsError}
          loading={loading}
          saving={submit.saving}
          hasRecovery={submit.recovery !== null}
          onRetry={() => form.setLinkLoadAttempt((attempt) => attempt + 1)}
        />
      ) : null}
      {archived ? <p className="card-editor-notice">Archived. It’s out of your plan; restore it from the back of the card.</p> : null}

      {direct ? (
        <DirectCard session={session} card={card} back={back} flipped={flipped} />
      ) : (
        <AnnotatedCard fields={state} card={card} session={session} back={back} flipped={flipped} />
      )}

      <div className="card-editor-controls">
        {direct && !flipped ? <p className="card-editor-hint">Tap anything on the card to change it.</p> : null}
        <button type="button" className="card-button" onClick={() => setFlipped((value) => !value)}>
          <RotateCcw size={14} aria-hidden="true" />
          {flipped ? "Back to the card" : "Turn over for more"}
        </button>
        <div className="card-savebar" data-dirty={dirty}>
          <p role="status" aria-live="polite">
            {form.validationError ?? (dirty ? `${changed.size} ${changed.size === 1 ? "change" : "changes"}` : "No changes")}
          </p>
          {dirty ? (
            <button
              type="button"
              className="card-button"
              disabled={busy}
              onClick={() => {
                setState(baseline.state);
                setSelectedLinkTarget(baseline.link);
              }}
            >
              Discard
            </button>
          ) : null}
          <button type="submit" className="card-button card-button-primary" disabled={!dirty || submit.submitDisabled}>
            {submit.saving ? "Saving…" : "Save changes"}
          </button>
        </div>
        {form.validationWarning ? <p className="card-editor-warning">{form.validationWarning}</p> : null}
      </div>
    </form>
    </div>
  );
}
