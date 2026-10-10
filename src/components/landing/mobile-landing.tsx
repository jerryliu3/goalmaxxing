"use client";

import type { ReactNode } from "react";
import { useMobileLandingExample } from "./use-mobile-landing-example";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ArrowDown, ArrowRight, Check, Undo2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { CompletionToggle } from "@/components/ui/completion-toggle";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import { LandingReveal } from "./landing-reveal";
import { MobileLandingSupport } from "./mobile-landing-support";
import { MobileLandingMonth } from "./mobile-landing-month";
import {
  canRecordLandingSession,
  LANDING_EXAMPLE_TODAY,
} from "./mobile-landing-model";
import styles from "./mobile-landing.module.css";

function Chapter({
  number,
  title,
  copy,
  children,
}: {
  number: string;
  title: string;
  copy: string;
  children: ReactNode;
}) {
  return (
    <LandingReveal>
      <section className={styles.chapter}>
        <p className="type-eyebrow text-xs text-primary">{number}</p>
        <h2 className="mt-3 type-hero text-[2rem] leading-[1.1]">{title}</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">{copy}</p>
        <div className="mt-6">{children}</div>
      </section>
    </LandingReveal>
  );
}

export function MobileLanding() {
  const reducedMotion = Boolean(useReducedMotion());
  const {
    target,
    setTarget,
    move,
    setMove,
    selectedDay,
    setSelectedDay,
    completed,
    sessions,
    fields,
    recordedCount,
    recordSessions,
    changeSession,
    canMove,
    toggleCompletion,
    proposeMove,
    undoMove,
    reset,
  } = useMobileLandingExample();
  return (
    <div className={styles.mobile} data-testid="mobile-landing">
      <section className={styles.hero}>
        <p className="type-eyebrow text-xs text-primary">
          Make room for what matters
        </p>
        <h1 className="mt-4 type-hero text-[2.75rem] leading-[1.04] tracking-tight">
          A goal you care about.
          <br />A plan you can change.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          Turn an intention into placed work. See your progress, and adjust when
          life moves around.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button asChild size="lg">
            <Link href="/signup">
              Get started <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/demo" target="_blank" rel="noopener noreferrer">
              Try demo
            </Link>
          </Button>
        </div>
        <div className={styles.goalProof}>
          <TempoGoalCard fields={fields} context="creation" rotatable={false} />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          An illustrated plan · October 2026. Today in this example is Thursday
          8. Changes stay on this page.
        </p>
        <a
          className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm text-primary underline underline-offset-4"
          href="#mobile-shape"
        >
          Explore one goal <ArrowDown className="size-4" />
        </a>
      </section>

      <div id="mobile-shape" className={styles.anchor}>
        <Chapter
          number="01 · Shape"
          title="Give your intention a shape."
          copy="Choose a monthly rhythm that fits. Other goals can use daily or weekly rhythms, total targets, or milestones with a deadline."
        >
          <fieldset>
            <legend className="type-item text-base">
              How many running days this month?
            </legend>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {([8, 12] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={styles.targetChoice}
                  aria-pressed={target === value}
                  onClick={() => setTarget(value)}
                >
                  <strong className="type-stat text-2xl">{value} days</strong>
                  <span className="mt-1 block text-sm">
                    About {value === 8 ? "two" : "three"} a week
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
          <p className="mt-4 text-sm text-muted-foreground" role="status">
            {target} placed sessions in this example month. The goal card and
            calendar use the same target.
          </p>
        </Chapter>
      </div>
      <Chapter
        number="02 · Plan"
        title="Keep the whole month in view."
        copy="See the horizon, then pick a date for the details. A quiet day is room in your plan."
      >
        <MobileLandingMonth
          sessions={sessions}
          selectedDay={selectedDay}
          completed={completed}
          onSelect={setSelectedDay}
        />
      </Chapter>
      <Chapter
        number="03 · Adapt"
        title="Thursday changed. The goal stayed."
        copy="Move a session, review its new date, and save when the change works for you."
      >
        <motion.div
          layout={!reducedMotion}
          transition={{ duration: 0.28 }}
          className={styles.moveProof}
          data-example-move={move}
        >
          <div className="flex items-center gap-4">
            <span className={styles.sessionDate}>
              {format(parseISO(changeSession.date), "EEE")}
              <strong className="type-stat text-2xl">
                {Number(changeSession.date.slice(-2))}
              </strong>
            </span>
            <div className="min-w-0">
              <p className="type-item text-base">{changeSession.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {move === "draft"
                  ? "Unsaved move · Thursday → Friday"
                  : move === "saved"
                    ? "Saved move · Thursday → Friday"
                    : "Thursday · placed work"}
              </p>
            </div>
          </div>
          {move === "original" ? (
            <>
              <Button
                variant="outline"
                className="mt-5 h-auto min-h-11 w-full whitespace-normal py-3"
                onClick={proposeMove}
                disabled={!canMove}
              >
                Move Thursday’s session to Friday{" "}
                <ArrowRight className="size-4 shrink-0" />
              </Button>
              {!canMove && (
                <p className="mt-3 text-sm text-muted-foreground">
                  This session is recorded. Undo its completion below before
                  moving it.
                </p>
              )}
            </>
          ) : move === "draft" ? (
            <div className="mt-5">
              <p className="type-heading text-sm">One change to review</p>
              <div className="mt-3 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={undoMove}>
                  <Undo2 className="size-4" />
                  Undo
                </Button>
                <Button className="flex-1" onClick={() => setMove("saved")}>
                  Save example
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-5 flex items-center gap-2 text-sm" role="status">
              <Check className="size-4 text-primary" />
              Example plan saved. Friday is ready.
            </p>
          )}
        </motion.div>
      </Chapter>
      <Chapter
        number="04 · Record"
        title="See the work you actually did."
        copy="Hold a completion control to record or undo a past or present session. Future sessions stay planned."
      >
        <div className={styles.recordProof}>
          <ul className="divide-y divide-border">
            {recordSessions
              .filter((session) => session.date <= "2026-10-12")
              .map((session) => {
                const allowed = canRecordLandingSession(
                  session.date,
                  session.changed && move === "draft",
                );
                return (
                  <li key={session.id} className="flex items-center gap-3 py-4">
                    <span className={styles.sessionDate}>
                      {format(parseISO(session.date), "EEE")}
                      <strong className="type-figure text-lg">
                        {Number(session.date.slice(-2))}
                      </strong>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="type-item text-base">{session.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {completed.has(session.id)
                          ? "Recorded"
                          : session.changed && move === "draft"
                            ? "Unsaved move"
                            : session.date > LANDING_EXAMPLE_TODAY
                              ? "Planned · future date"
                              : "Placed session"}
                      </p>
                    </div>
                    <CompletionToggle
                      completed={completed.has(session.id)}
                      size="lg"
                      disabled={!allowed}
                      aria-label={`${completed.has(session.id) ? "Undo" : "Record"} running session on ${format(parseISO(session.date), "MMMM d")}`}
                      title={
                        allowed
                          ? "Hold to change completion"
                          : "Future or unsaved sessions stay planned"
                      }
                      onClick={() => toggleCompletion(session.id)}
                    />
                  </li>
                );
              })}
          </ul>
          <div className="mt-4 border-t border-border pt-5" aria-live="polite">
            <p className="type-stat text-2xl">
              {recordedCount} / {target} days this month
            </p>
            <progress
              className={styles.progress}
              value={recordedCount}
              max={target}
              aria-label="Example monthly completion"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              Recorded work counts toward the target. Moving a session does not
              add a completion.
            </p>
          </div>
          <Button variant="ghost" className="mt-4" onClick={reset}>
            Reset example
          </Button>
        </div>
      </Chapter>

      <MobileLandingSupport
        canProposeMove={canMove && move === "original"}
        onProposeMove={proposeMove}
      />
    </div>
  );
}
