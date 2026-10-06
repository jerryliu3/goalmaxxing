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
import { Input } from "@/components/ui/input";
import {
  DEFAULT_GOAL_CATEGORIES,
  type CategorySelection,
} from "@/lib/goals/category";
import { categoryChangePatch } from "@/lib/goals/card-colour";
import type {
  GoalCreationFieldControlsProps,
  GoalCreationLinkTargetProps,
} from "./goal-creation-fields";
import {
  clampPlaqueTarget,
  creationPlaqueTarget,
} from "./card-material/creation-plaque-target";
import { TempoGoalCard } from "./tempo-goal-card";
import { TempoGoalChoices as Choices } from "./tempo-goal-choices";
import { TempoGoalReward } from "./tempo-goal-reward";
import { TempoGoalRhythm } from "./tempo-goal-rhythm";
import { TempoGoalSchedule } from "./tempo-goal-schedule";
import { getGoalCreationPeriodLimitError } from "@/lib/goals/creation-model";

import { TempoStepNavigation } from "./tempo-step-navigation";
import { AnnotatedCard } from "./card-editor/annotated-card";
import { CardBack } from "./card-editor/card-back";
import type { CardEditorFields, CardEditorSession } from "./card-editor/card-editor-session";
import { type BackFact, DIFFICULTY_OPTIONS, type FaceFact } from "./card-editor/card-facts";
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

/** "a, b & c": what the back holds, named in the reward step. */
function listTopics(topics: string[]) {
  return topics.length > 1 ? `${topics.slice(0, -1).join(", ")} & ${topics.at(-1)}` : topics.join("");
}

/** Creation marks nothing as changed: every fact on a new card is the person's own. */
const NO_CHANGES = new Set<never>();

/** Wizard steps after Start (the step bar numbers them 02–06). Tasks skip the reward. */
const SCHEDULE = 2;
const REWARD = 3;
const REVIEW = 4;

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
  action: ReactNode;
  preview?: ReactNode | ((visibility: TempoCardVisibility) => ReactNode);
  prefilled?: boolean;
  error?: string | null;
  onReviewChange?: (ready: boolean) => void;
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
  const canVisit = [
    true,
    intentionValid,
    intentionValid && rhythmValid,
    !isPlannerTask && intentionValid && rhythmValid && scheduleValid,
    intentionValid && rhythmValid && scheduleValid,
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
    setStep(next);
    setFurthestStep((previous) => Math.max(previous, next));
    if (next === REVIEW && !isPlannerTask) {
      onPlaqueTargetChange?.(plaqueTarget);
    }
    onReviewChange?.(
      next === REVIEW && intentionValid && rhythmValid && scheduleValid,
    );
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

  // The back edits with the card editor's own rows. The plaque target is set on review and
  // milestone names in the rhythm step, so the back leaves those to them.
  const backSession: CardEditorSession = {
    fields: { ...fields, reward_text: reward ?? "", plaque_target: null },
    patch: onPatch,
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
    "plaque",
    "milestones",
    ...(reward === undefined ? (["reward"] as const) : []),
  ];
  const backTopics = listTopics([
    "Why it matters",
    "card colour",
    ...(backSession.link ? ["what it also counts toward"] : []),
  ]);
  // The reward step always shows the card's back: the reward is written there, beside the
  // advanced settings.
  const showBack = step === REWARD && !isPlannerTask;

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
      transition={{ type: "spring", stiffness: 180, damping: 26 }}
    >
      {/* Steps before review keep one scene, so the card doesn't remount as steps change. */}
      {isPlannerTask || step === REVIEW ? (
        cardFace
      ) : (
        <CardScene
          color={goalColor}
          flipped={showBack}
          front={cardFace}
          // Mounted on every step so it turns in with the card rather than appearing flat.
          back={<CardBack session={backSession} hidden={backHidden} heading="Advanced settings" unsetLabel="Optional" />}
        />
      )}
    </motion.div>
  );

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
        skip={isPlannerTask ? [REWARD] : undefined}
      />
      {step === REVIEW && !isPlannerTask ? (
        // The review labels each part of the plaque it is about to create (read-only).
        <div className="tempo-review-legend">
          <AnnotatedCard fields={fields} card={previewCard} labels={REVIEW_LABELS} hidden={unprintedFacts(fields)} labelsOnly />
        </div>
      ) : (
        previewCard
      )}
      {step < REVIEW && (
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
              {
                [
                  "What are you making room for?",
                  isPlannerTask
                    ? "Keep it beautifully simple."
                    : "Find your rhythm.",
                  "Give it a place in your life.",
                  reward === undefined
                    ? "A few more settings."
                    : "What’s waiting at the finish line?",
                ][step]
              }
            </h2>
            <fieldset className="tempo-fields" disabled={disabled}>
              {step === 0 && (
                <>
                  <label htmlFor={`${id}-title`}>
                    Name your {isPlannerTask ? "task" : "goal"}
                  </label>
                  <Input
                    id={`${id}-title`}
                    aria-label="Name"
                    className="tempo-title-input"
                    placeholder="Read a little, every week"
                    value={fields.title}
                    onChange={(e) => onPatch({ title: e.target.value })}
                  />
                  {!isPlannerTask && (
                    <>
                      <p className="tempo-label">Category</p>
                      <Choices
                        label="Category"
                        value={
                          chosen.category ? fields.category_selection : null
                        }
                        options={[
                          ...DEFAULT_GOAL_CATEGORIES.map((c) => ({
                            value: c.key as CategorySelection,
                            label: c.label,
                            color: c.color,
                          })),
                        ]}
                        onChange={(value) => {
                          choose({ category: true });
                          onPatch(categoryChangePatch(fields, value));
                        }}
                      />
                      {chosen.category && (
                        <>
                          <p className="tempo-label">Difficulty</p>
                          <Choices
                            label="Difficulty"
                            value={
                              chosen.difficulty ? fields.difficulty : null
                            }
                            options={DIFFICULTY_OPTIONS}
                            onChange={(difficulty) => {
                              choose({ difficulty: true });
                              onPatch({ difficulty });
                            }}
                          />
                        </>
                      )}
                    </>
                  )}
                </>
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
              {step === REWARD && (
                <TempoGoalReward
                  id={id}
                  reward={reward}
                  onReward={(reward_text) => onPatch({ reward_text })}
                  advancedTopics={backTopics}
                />
              )}
            </fieldset>
            {error && error !== "Title is required." && step > 0 && (
              <p className="tempo-error" role="status">
                {error}
              </p>
            )}
            <div className="tempo-footer">
              <Button
                type="button"
                disabled={disabled || !currentValid}
                onClick={() =>
                  go(isPlannerTask && step + 1 === REWARD ? REVIEW : step + 1)
                }
              >
                Continue →
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
      {step === REVIEW && (
        <div className="tempo-review-action">
          {!isPlannerTask && (
            <p className="tempo-plaque-copy">
              Your target before earning this achievement plaque will be{" "}
              <label className="tempo-plaque-input">
                <span className="sr-only">Plaque completion target</span>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  inputMode="numeric"
                  value={plaqueTarget}
                  disabled={disabled}
                  onChange={(event) => {
                    setPlaqueTouched(true);
                    const next = Number(event.target.value);
                    setPlaqueTarget(
                      event.target.value === ""
                        ? 1
                        : clampPlaqueTarget(next),
                    );
                    onPlaqueTargetChange?.(event.target.value === "" ? 1 : clampPlaqueTarget(next));
                  }}
                />
              </label>{" "}
              completions.
            </p>
          )}
          {action}
          {error && error !== "Title is required." && (
            <p className="tempo-error" role="status">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
