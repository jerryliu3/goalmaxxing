"use client";

import { Infinity as InfinityIcon } from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { useReducedMotion } from "motion/react";
import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import { goalCardFields } from "@/features/goals/goal-card-fields";
import { goalCardProgress } from "@/features/goals/goal-card-progress";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import type { Goal } from "@/lib/goals/types";
import { dateLabel } from "./goal-view-model";
import { useGoalCardVisibility } from "./use-goal-card-visibility";

const renderFlatLettering = (text: ReactNode) => text;

/** The production material goal card with its progress line and end date. */
export const GoalViewCard = memo(function GoalViewCard({
  goal,
  progress,
  fullRender = false,
  moving = false,
}: {
  goal: Goal;
  progress: ProgressContextSummary | undefined;
  fullRender?: boolean;
  moving?: boolean;
}) {
  const { ref, nearViewport } = useGoalCardVisibility();
  const reducedMotion = useReducedMotion();
  const [engaged, setEngaged] = useState(false);
  const held = useRef(false);
  const hovered = useRef(false);
  useEffect(() => {
    if (!nearViewport || moving) {
      held.current = false;
      setEngaged(false);
    }
  }, [nearViewport, moving]);
  const interactive = nearViewport && !moving && (fullRender || engaged) && !reducedMotion;
  const fields = useMemo(() => goalCardFields(goal), [goal]);
  const model = useMemo(() => progress ? goalCardProgress(goal, progress) : null, [goal, progress]);
  const statusLabel = !model
    ? null
    : model.achieved
      ? "Goal accomplished"
      : progress?.lifecycle === "upcoming"
        ? `Starts soon · ${model.label}`
        : model.label;
  return (
    <div ref={ref} className="mx-auto w-full max-w-[244px]" data-goal-view-card={goal.id}
      tabIndex={interactive ? undefined : 0}
      onFocus={event => {
        if (moving) return;
        if (event.target === event.currentTarget) {
          flushSync(() => setEngaged(true));
          event.currentTarget.querySelector<HTMLElement>('[data-card-object][tabindex="0"]')?.focus({ preventScroll: true });
        } else setEngaged(true);
      }}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setEngaged(false); }}
      onPointerEnter={event => {
        hovered.current = event.pointerType !== "touch";
        if (hovered.current && !moving) setEngaged(true);
      }}
      onPointerLeave={() => { hovered.current = false; if (!held.current) setEngaged(false); }}
      onPointerDownCapture={event => {
        if (moving || event.button !== 0 || event.isPrimary === false ||
          !(event.target instanceof Element) || !event.target.closest("[data-card-object]")) return;
        held.current = true;
        if (!interactive) flushSync(() => setEngaged(true));
      }}
      onPointerUp={event => {
        held.current = false;
        if (event.pointerType !== "mouse" || !hovered.current) setEngaged(false);
      }}
      onPointerCancel={() => { held.current = false; setEngaged(false); }}
      onLostPointerCapture={() => { held.current = false; if (!hovered.current) setEngaged(false); }}
    >
      <TempoGoalCard
        fields={fields}
        context="history"
        achieved={model?.achieved ?? false}
        assembly={model?.assembly}
        flat={Boolean(model?.assembly) && !interactive}
        rotatable={interactive}
        // Each shard repeats the face. Keep readable type, without multiplying
        // sixteen decorative glyph walls across every fragment during a tilt.
        renderLettering={renderFlatLettering}
      />
      <div className="mt-3 space-y-1 text-center text-xs text-muted-foreground">
        {statusLabel ? (
          <p className="font-mono" role="status">
            {statusLabel}
          </p>
        ) : null}
        <p className="flex items-center justify-center gap-1">
          {goal.end_date ? (
            <>Ends {dateLabel(goal.end_date, "MMM d, yyyy")}</>
          ) : (
            <>
              <InfinityIcon size={14} aria-hidden />
              Ongoing · no end date
            </>
          )}
        </p>
      </div>
    </div>
  );
});
