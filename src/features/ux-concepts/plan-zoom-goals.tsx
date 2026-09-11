"use client";

import { useReducedMotion } from "motion/react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CONSTELLATION_LINKS,
  CONSTELLATION_POSITIONS,
  loggedDaysForGoal,
  STUDY_GOALS,
  STUDY_TODAY_DAY,
  toggleGoalDay,
  type StudyGoal,
} from "@/features/ux-concepts/plan-zoom-goals-data";
import { TONE_DOT } from "@/features/ux-concepts/concept-primitives";
import { cn } from "@/lib/utils";

export function PlanZoomGoals({
  experience,
}: {
  experience: "folio" | "constellation";
}) {
  const reduceMotion = useReducedMotion() === true;
  const [goals, setGoals] = useState<StudyGoal[]>(() =>
    STUDY_GOALS.map((goal) => ({ ...goal, days: [...goal.days] }))
  );
  const [focusId, setFocusId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const coverRects = useRef(new Map<string, DOMRect>());

  const focus = goals.find((goal) => goal.id === focusId) ?? null;

  const toggleToday = (id: string) => {
    const goal = goals.find((item) => item.id === id);
    if (!goal || goal.id === "move-regularly") {
      return;
    }
    const exists = goal.days.includes(STUDY_TODAY_DAY);
    setGoals(toggleGoalDay(goals, id, STUDY_TODAY_DAY));
    setMessage(
      `${exists ? "Removed" : "Logged"} September ${STUDY_TODAY_DAY} for ${goal.name}${
        goal.parentId ? "; linked Move regularly progress updated." : "."
      }`
    );
  };

  const openGoal = (id: string, rect?: DOMRect) => {
    if (rect) {
      coverRects.current.set("page", rect);
    }
    setFocusId(id);
    setMessage(`${goals.find((goal) => goal.id === id)?.name ?? "Goal"} selected`);
  };

  if (experience === "folio") {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto pb-8">
        {focus ? (
          <FolioPage
            goal={focus}
            goals={goals}
            reduceMotion={reduceMotion}
            origin={coverRects.current.get("page")}
            onBack={() => {
              setFocusId(null);
              setMessage("All goals");
            }}
            onToggleToday={() => toggleToday(focus.id)}
          />
        ) : (
          <FolioShelf
            goals={goals}
            onOpen={(id, rect) => openGoal(id, rect)}
          />
        )}
        <p className="mt-4 min-h-4 text-xs text-muted-foreground" aria-live="polite">
          {message}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto pb-8">
      <ConstellationMap
        goals={goals}
        focusId={focusId}
        onOpen={openGoal}
        onToggleToday={toggleToday}
      />
      <p className="mt-4 min-h-4 text-xs text-muted-foreground" aria-live="polite">
        {message}
      </p>
    </div>
  );
}

function FolioShelf({
  goals,
  onOpen,
}: {
  goals: readonly StudyGoal[];
  onOpen: (id: string, rect: DOMRect) => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold tracking-tight">
        Your ongoing stories
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Open a goal</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {goals.map((goal, index) => {
          const logged = loggedDaysForGoal(goals, goal.id);
          return (
            <button
              key={goal.id}
              type="button"
              className="flex min-h-[206px] flex-col items-start gap-3 rounded-r-xl border border-border border-l-8 border-l-primary bg-card px-3.5 py-4 text-left shadow-sm ring-1 ring-foreground/5 touch-manipulation"
              onClick={(event) =>
                onOpen(goal.id, event.currentTarget.getBoundingClientRect())
              }
            >
              <small className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Vol. 0{index + 1}
              </small>
              <strong className="font-display text-xl font-semibold leading-tight">
                {goal.name}
              </strong>
              <StampRow count={logged.length} target={goal.target} tone={goal.tone} />
              <small className="mt-auto text-xs text-muted-foreground">
                {logged.length} / {goal.target} sessions this month
              </small>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FolioPage({
  goal,
  goals,
  reduceMotion,
  origin,
  onBack,
  onToggleToday,
}: {
  goal: StudyGoal;
  goals: readonly StudyGoal[];
  reduceMotion: boolean;
  origin?: DOMRect;
  onBack: () => void;
  onToggleToday: () => void;
}) {
  const pageRef = useRef<HTMLElement | null>(null);
  const logged = loggedDaysForGoal(goals, goal.id);
  const volume = goals.findIndex((item) => item.id === goal.id) + 1;
  const hasToday = goal.days.includes(STUDY_TODAY_DAY);

  useLayoutEffect(() => {
    const node = pageRef.current;
    if (!node || reduceMotion || !origin) {
      return;
    }
    const last = node.getBoundingClientRect();
    node.animate(
      [
        {
          transform: `translate(${origin.x - last.x}px, ${origin.y - last.y}px) scale(${origin.width / last.width}, ${origin.height / last.height})`,
        },
        { transform: "none" },
      ],
      { duration: 380, easing: "cubic-bezier(.2,.8,.2,1)" }
    );
  }, [goal.id, origin, reduceMotion]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          ← All goals
        </Button>
        <small className="text-xs text-muted-foreground">Living folio · September</small>
      </div>
      <article
        ref={pageRef}
        className="mt-4 rounded-r-xl border border-border border-l-[7px] border-l-primary bg-card p-6 shadow-sm ring-1 ring-foreground/5"
      >
        <small className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Vol. 0{volume}
        </small>
        <h3 className="mt-2 font-display text-3xl font-semibold tracking-tight">
          {goal.name}
        </h3>
        <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
          {goal.why}
        </p>
        <div className="mt-4">
          <StampRow count={logged.length} target={goal.target} tone={goal.tone} />
          <p className="mt-2 text-sm">
            {logged.length} of {goal.target} sessions this month
          </p>
        </div>
        <hr className="my-5 border-border" />
        <small className="text-xs uppercase tracking-wide text-muted-foreground">
          Next milestone
        </small>
        <h4 className="mt-1 font-display text-lg font-semibold">{goal.next}</h4>
        <div className="mt-4 grid gap-1">
          {logged
            .slice(-3)
            .reverse()
            .map((day) => (
              <div
                key={day}
                className="flex items-center gap-4 border-b border-border/60 py-2.5 last:border-b-0"
              >
                <time className="w-12 shrink-0 text-sm text-muted-foreground">
                  Sep {day}
                </time>
                <span className="text-sm">A session added to your story</span>
              </div>
            ))}
        </div>
        {goal.id === "move-regularly" ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Includes sessions linked from Tempo run and Strength.
          </p>
        ) : (
          <Button type="button" className="mt-5" onClick={onToggleToday}>
            {hasToday ? "Undo today’s session" : "Log today’s session"}
          </Button>
        )}
      </article>
    </div>
  );
}

function ConstellationMap({
  goals,
  focusId,
  onOpen,
  onToggleToday,
}: {
  goals: readonly StudyGoal[];
  focusId: string | null;
  onOpen: (id: string) => void;
  onToggleToday: (id: string) => void;
}) {
  const focus = goals.find((goal) => goal.id === focusId) ?? null;
  const incoming = useMemo(
    () => goals.filter((goal) => goal.parentId === focus?.id),
    [focus, goals]
  );

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold tracking-tight">
        Effort that connects
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Illustrative links · Tempo run and Strength both contribute to Move regularly
      </p>
      <div className="relative mt-4 h-[370px]">
        <svg
          aria-hidden="true"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full"
        >
          {CONSTELLATION_LINKS.map((link) => {
            const from = CONSTELLATION_POSITIONS[link.from];
            const to = CONSTELLATION_POSITIONS[link.to];
            const active =
              focusId === link.from || focusId === link.to;
            return (
              <line
                key={`${link.from}-${link.to}`}
                x1={from.left}
                y1={from.top}
                x2={to.left}
                y2={to.top}
                className={active ? "stroke-primary" : "stroke-border"}
                strokeWidth={active ? 4 : 2}
              />
            );
          })}
        </svg>
        {goals.map((goal) => {
          const position = CONSTELLATION_POSITIONS[goal.id];
          const logged = loggedDaysForGoal(goals, goal.id);
          return (
            <button
              key={goal.id}
              type="button"
              aria-pressed={focusId === goal.id}
              onClick={() => onOpen(goal.id)}
              className={cn(
                "absolute grid min-h-[76px] w-[104px] -translate-x-1/2 -translate-y-1/2 gap-1 rounded-2xl border bg-card px-2 py-2 text-left shadow-md ring-1 ring-foreground/10 touch-manipulation sm:w-[128px] sm:px-2.5 sm:py-2.5",
                focusId === goal.id && "border-primary ring-primary/40"
              )}
              style={{ left: `${position.left}%`, top: `${position.top}%` }}
            >
              <span className="font-display text-[17px] leading-tight">{goal.name}</span>
              <small className="text-xs text-muted-foreground">
                {logged.length} / {goal.target}
              </small>
            </button>
          );
        })}
      </div>
      <div className="mt-4 border-t border-border pt-5">
        {focus ? (
          <>
            <h3 className="font-display text-lg font-semibold">{focus.name}</h3>
            <p className="mt-2 max-w-[46ch] text-sm text-muted-foreground">{focus.why}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {focus.parentId ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpen(focus.parentId!)}
                >
                  Follow link → Move regularly
                </Button>
              ) : incoming.length > 0 ? (
                incoming.map((child) => (
                  <Button
                    key={child.id}
                    type="button"
                    variant="outline"
                    onClick={() => onOpen(child.id)}
                  >
                    ← {child.name}
                  </Button>
                ))
              ) : (
                <small className="text-sm text-muted-foreground">
                  Independent goal · no linked goals
                </small>
              )}
              {focus.id !== "move-regularly" ? (
                <Button type="button" onClick={() => onToggleToday(focus.id)}>
                  {focus.days.includes(STUDY_TODAY_DAY)
                    ? "Undo today’s session"
                    : "Log today’s session"}
                </Button>
              ) : null}
            </div>
          </>
        ) : (
          <h3 className="font-display text-lg font-semibold">
            Select a goal to trace its connections
          </h3>
        )}
      </div>
    </div>
  );
}

function StampRow({
  count,
  target,
  tone,
}: {
  count: number;
  target: number;
  tone: StudyGoal["tone"];
}) {
  return (
    <div
      className="flex flex-wrap gap-1"
      aria-label={`${count} of ${target} sessions`}
    >
      {Array.from({ length: target }, (_, index) => (
        <span
          key={index}
          className={cn(
            "size-3 rounded-full bg-muted",
            index < count && TONE_DOT[tone]
          )}
        />
      ))}
    </div>
  );
}
