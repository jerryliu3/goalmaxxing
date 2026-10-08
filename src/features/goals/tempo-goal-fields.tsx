"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import type {
  GoalCreationFieldControlsProps,
  GoalCreationLinkTargetProps,
} from "./goal-creation-fields";
import { creationPlaqueTarget } from "./card-material/creation-plaque-target";
import { TempoGoalCard } from "./tempo-goal-card";
import { TempoGoalCheckpoint } from "./tempo-goal-checkpoint";
import { TempoGoalIntention } from "./tempo-goal-intention";
import { TempoGoalReward } from "./tempo-goal-reward";
import { TempoGoalRhythm } from "./tempo-goal-rhythm";
import { TempoGoalSchedule, TempoGoalTimeOfDay } from "./tempo-goal-schedule";
import { getGoalCreationPeriodLimitError } from "@/lib/goals/creation-model";

import { TempoStepNavigation } from "./tempo-step-navigation";
import { AnnotatedCard } from "./card-editor/annotated-card";
import { CardBack } from "./card-editor/card-back";
import type { CardEditorFields, CardEditorSession } from "./card-editor/card-editor-session";
import { type BackFact, type FaceFact, hasPlaqueTarget } from "./card-editor/card-facts";
import { CardScene } from "./card-editor/card-scene";
import type {
  TempoChoicesMade,
  TempoCardVisibility,
} from "./tempo-creation-progress";

const REVIEW_LABELS: Partial<Record<FaceFact, string>> = {
  cadence: "Your target",
  name: "Your goal",
  start: "Start date",
  time: "Time of day",
};

/**
 * Facts the review leaves out: ones the card doesn't print yet (no line should point at an
 * empty spot) and visibility, which the creation card's opening line doesn't state.
 */
function unprintedFacts(fields: GoalCreationFieldControlsProps["fields"]): FaceFact[] {
  return ["visibility", ...(fields.end_date ? [] : ["deadline" as const]), ...(fields.default_local_time ? [] : ["time" as const])];
}

/** "a, b & c": what the back holds, named in the details step. */
function listTopics(topics: string[]) {
  return topics.length > 1 ? `${topics.slice(0, -1).join(", ")} & ${topics.at(-1)}` : topics.join("");
}

/** Creation marks nothing as changed: every fact on a new card is the person's own. */
const NO_CHANGES = new Set<never>();

/**
 * Wizard steps after Start. Intention through Review are what a goal needs (the step bar
 * numbers them 02–05); More details is optional and comes after Review. Tasks have no details.
 */
const SCHEDULE = 2;
const REVIEW = 3;
const DETAILS = 4;
const PREVIEW_SPRING = { type: "spring", stiffness: 180, damping: 26 } as const;
// Matches the .card-side turn in card-editor.css, so the glide into or out of review and the flip are one motion.
const REVIEW_ARRIVAL = { duration: 0.7, ease: [0.65, 0, 0.35, 1] } as const;

export function TempoGoalFields({
  fields,
  onFieldChange,
  onPatch,
  createKind,
  onCreateKindChange,
  includePlannerTask,
  isPlannerTask,
  linkTarget,
  disabled,
  teamId,
  extraGridSlot,
  action,
  preview,
  error: suppliedError,
  onReviewChange,
  onPlaqueTargetChange,
  taskSchedule,
  reward,
  prefilled = false,
}: Omit<GoalCreationFieldControlsProps, "onPatch" | "linkTarget"> & {
  onPatch: (patch: Partial<CardEditorFields>) => void;
  /** Search and pick for the back's "Also counts toward" row (the back has its own picker). */
  linkTarget: Omit<GoalCreationLinkTargetProps, "open" | "onOpenChange">;
  /** The reward line, where the caller saves one (bulk drafts don't); without it the back leaves it out. */
  reward?: string;
  /** Creates the goal: on review, and at the foot of the details. */
  action: ReactNode;
  preview?: ReactNode | ((visibility: TempoCardVisibility) => ReactNode);
  prefilled?: boolean;
  error?: string | null;
  /** Whether the goal can be created now: review or details is open and every needed step is valid. */
  onReviewChange?: (ready: boolean) => void;
  /** Where the caller saves the plaque target; without it the target is shown but not editable. */
  onPlaqueTargetChange?: (target: number) => void;
  taskSchedule?: { date: string; time: string };
}) {
  const [step, setStep] = useState(0);
  const error = getGoalCreationPeriodLimitError(fields) || suppliedError;
  const heading = useRef<HTMLHeadingElement>(null);
  const id = useId();
  const milestones = fields.frequency_type === "fixed_milestones";
  const reducedMotion = useReducedMotion();
  const previewRef = useRef<HTMLDivElement>(null);
  const [chosen, setChosen] = useState<TempoChoicesMade>({
    category: prefilled,
    kind: prefilled,
    interval: prefilled,
    basis: prefilled,
    count: prefilled,
    difficulty: prefilled,
  });
  const [furthestStep, setFurthestStep] = useState(0);
  const [plaqueTarget, setPlaqueTarget] = useState(() =>
    creationPlaqueTarget(fields),
  );
  const [plaqueTouched, setPlaqueTouched] = useState(false);
  const [reviewTurn, setReviewTurn] = useState(false);
  const choose = (patch: Partial<TempoChoicesMade>) =>
    setChosen((previous) => ({ ...previous, ...patch }));
  // Category first: chromatic foil and effort bars borrow the category color.
  const intentionValid =
    fields.title.trim().length > 0 &&
    (isPlannerTask || (chosen.category && chosen.difficulty));
  const rhythmValid =
    chosen.kind &&
    (isPlannerTask ||
      (chosen.count &&
        !getGoalCreationPeriodLimitError(fields) &&
        Number.isInteger(Number(fields.target_count)) &&
        Number(fields.target_count) > 0 &&
        (milestones
          ? Number(fields.target_count) <= 999
          : chosen.interval && chosen.basis)));
  const scheduleValid = !error;
  const essentialsValid = Boolean(intentionValid && rhythmValid && scheduleValid);
  const canVisit = [
    true,
    intentionValid,
    intentionValid && rhythmValid,
    essentialsValid,
    !isPlannerTask && essentialsValid,
  ];
  const currentValid =
    step === 0 ? intentionValid : step === 1 ? rhythmValid : step === SCHEDULE ? scheduleValid : true;
  const visibility: TempoCardVisibility = {
    review: step === REVIEW,
    category: chosen.category,
    rhythm: chosen.kind && furthestStep >= 1,
    interval: chosen.interval,
    count: chosen.count,
    schedule: furthestStep >= 2,
    difficulty: chosen.difficulty,
    plaqueTarget: step === REVIEW ? plaqueTarget : undefined,
  };
  const go = (next: number) => {
    // Leaving the details for review, the turned-over card turns on round to its face.
    setReviewTurn(step === DETAILS && next === REVIEW);
    setStep(next);
    setFurthestStep((previous) => Math.max(previous, next));
    if (next === REVIEW && !isPlannerTask) {
      onPlaqueTargetChange?.(plaqueTarget);
    }
    onReviewChange?.((next === REVIEW || next === DETAILS) && essentialsValid);
    requestAnimationFrame(() =>
      (next === REVIEW ? previewRef.current : heading.current)?.focus(),
    );
  };

  useEffect(() => {
    if (plaqueTouched || isPlannerTask) {
      return;
    }
    setPlaqueTarget(creationPlaqueTarget(fields));
  }, [
    fields.frequency_type,
    fields.recurrence_interval,
    fields.target_basis,
    fields.target_count,
    fields.start_date,
    fields.end_date,
    plaqueTouched,
    isPlannerTask,
  ]);

  const reviewAssembly =
    step === REVIEW && !isPlannerTask
      ? { completed: 0, target: plaqueTarget, preview: true }
      : undefined;
  const goalColor = chosen.category ? fields.color : "#b99060";

  // The back edits with the card editor's own rows. Milestone names are set in the rhythm
  // step, so the back leaves those to it; the plaque target edits here when the caller saves it.
  const editsPlaque = Boolean(onPlaqueTargetChange) && hasPlaqueTarget(fields);
  const backSession: CardEditorSession = {
    fields: { ...fields, reward_text: reward ?? "", plaque_target: plaqueTarget },
    patch: ({ plaque_target, ...rest }) => {
      if (plaque_target != null) {
        setPlaqueTouched(true);
        setPlaqueTarget(plaque_target);
        onPlaqueTargetChange?.(plaque_target);
      }
      if (Object.keys(rest).length > 0) onPatch(rest);
    },
    completed: 0,
    changed: NO_CHANGES,
    pastEnd: false,
    canChangeVisibility: !teamId,
    link:
      teamId || linkTarget.disabled
        ? null
        : {
            value: linkTarget.value,
            selectedTitle:
              linkTarget.value === "none"
                ? null
                : (linkTarget.selectedTargetGoal?.title ?? "Another goal"),
            options: linkTarget.filteredLinkTargets,
            search: linkTarget.searchQuery,
            onSearch: linkTarget.onSearchQueryChange,
            onChange: linkTarget.onValueChange,
          },
  };
  const backHidden: BackFact[] = [
    "milestones",
    ...(editsPlaque ? [] : (["plaque"] as const)),
    ...(reward === undefined ? (["reward"] as const) : []),
  ];
  const backTopics = listTopics([
    "Why it matters",
    ...(editsPlaque ? ["your plaque target"] : []),
    "card colour",
    ...(backSession.link ? ["what it also counts toward"] : []),
  ]);
  const back = <CardBack session={backSession} hidden={backHidden} heading="Advanced settings" unsetLabel="Optional" />;
  // The details always show the card's back: the reward and advanced settings are written there.
  const showBack = step === DETAILS;

  const cardFace = (typeof preview === "function"
    ? preview(visibility)
    : preview) ?? (
    <TempoGoalCard
      fields={fields}
      visibility={visibility}
      isTask={isPlannerTask}
      taskSchedule={taskSchedule}
      assembly={reviewAssembly}
    />
  );
  const previewCard = (
    <motion.div
      ref={previewRef}
      tabIndex={-1}
      className="tempo-preview"
      data-back={showBack}
      layout={!reducedMotion}
      // Review moves the card into the legend (a new parent); the shared id glides it there.
      layoutId="tempo-preview-card"
      transition={step === REVIEW || step === DETAILS ? REVIEW_ARRIVAL : PREVIEW_SPRING}
    >
      {/* Steps outside review keep one scene, so the card doesn't remount as steps change. */}
      {isPlannerTask ? (
        cardFace
      ) : step === REVIEW ? (
        reviewTurn ? (
          <TurningScene color={goalColor} from flipped={false} forward front={cardFace} back={back} />
        ) : (
          cardFace
        )
      ) : (
        // Mounted face up, so arriving at the details from review still turns the card over.
        <TurningScene
          color={goalColor}
          from={false}
          flipped={showBack}
          front={cardFace}
          back={back}
        />
      )}
    </motion.div>
  );

  const showWorkspace = step < REVIEW || step === DETAILS;
  return (
    <div
      className={`tempo-creation${step === REVIEW ? " tempo-creation-review" : ""}`}
      style={{ "--goal-color": goalColor } as CSSProperties}
    >
      <TempoStepNavigation
        step={step + 1}
        onStep={go}
        canVisit={canVisit}
        disabled={disabled}
        skip={isPlannerTask ? [DETAILS] : undefined}
      />
      {step === REVIEW && !isPlannerTask ? (
        // The review labels each part of the plaque it is about to create (read-only).
        <div className="tempo-review-legend">
          <AnnotatedCard fields={fields} card={previewCard} labels={REVIEW_LABELS} hidden={unprintedFacts(fields)} labelsOnly />
        </div>
      ) : (
        previewCard
      )}
      {showWorkspace && (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            className="tempo-workspace"
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <h2 ref={heading} tabIndex={-1} className="tempo-heading">
              {step === DETAILS
                ? reward === undefined
                  ? "A few more settings."
                  : "What’s waiting at the finish line?"
                : [
                    "What are you making room for?",
                    isPlannerTask
                      ? "Keep it beautifully simple."
                      : "Find your rhythm.",
                    "Give it a place in your life.",
                  ][step]}
            </h2>
            <fieldset className="tempo-fields" disabled={disabled}>
              {step === 0 && (
                <TempoGoalIntention
                  id={id}
                  fields={fields}
                  onPatch={onPatch}
                  isPlannerTask={isPlannerTask}
                  chosen={chosen}
                  onChosen={choose}
                />
              )}
              {step === 1 && (
                <TempoGoalRhythm
                  fields={fields}
                  onFieldChange={onFieldChange}
                  createKind={createKind}
                  onCreateKindChange={onCreateKindChange}
                  includePlannerTask={includePlannerTask}
                  isPlannerTask={isPlannerTask}
                  chosen={chosen}
                  onChosen={choose}
                />
              )}
              {step === SCHEDULE &&
                (isPlannerTask ? (
                  extraGridSlot
                ) : (
                  <TempoGoalSchedule
                    id={id}
                    fields={fields}
                    onPatch={onPatch}
                    showVisibility={!teamId}
                  />
                ))}
              {step === DETAILS && (
                <>
                  <TempoGoalReward
                    id={id}
                    reward={reward}
                    onReward={(reward_text) => onPatch({ reward_text })}
                    advancedTopics={backTopics}
                  />
                  <TempoGoalTimeOfDay id={id} fields={fields} onPatch={onPatch} />
                </>
              )}
            </fieldset>
            {error && error !== "Title is required." && step > 0 && (
              <p className="tempo-error" role="status">
                {error}
              </p>
            )}
            <div className="tempo-footer">
              {step === DETAILS ? (
                action
              ) : (
                <Button
                  type="button"
                  disabled={disabled || !currentValid}
                  onClick={() => go(step + 1)}
                >
                  Continue →
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
      {step === REVIEW && (
        <TempoGoalCheckpoint
          plaqueTarget={isPlannerTask ? undefined : plaqueTarget}
          disabled={disabled}
          action={action}
          onDetails={isPlannerTask ? undefined : () => go(DETAILS)}
          error={error}
        />
      )}
    </div>
  );
}

/**
 * A card scene that mounts showing `from`, then turns to `flipped`. Arriving from another
 * layout (into or out of review), the card still reads as one continuous turn.
 */
function TurningScene({
  color,
  front,
  back,
  from,
  flipped,
  forward,
}: {
  color: string;
  front: ReactNode;
  back: ReactNode;
  from: boolean;
  flipped: boolean;
  forward?: boolean;
}) {
  const [arrived, setArrived] = useState(from === flipped);
  useEffect(() => {
    if (arrived) return;
    // Two frames: the starting side must paint before the turn starts, or there is nothing to animate.
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setArrived(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [arrived]);
  return <CardScene color={color} flipped={arrived ? flipped : from} forward={forward} front={front} back={back} />;
}
