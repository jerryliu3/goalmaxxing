"use client";

import { Check, ChevronDown, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import styles from "@/features/ux-concepts/goal-card-concept.module.css";
import { cn } from "@/lib/utils";

const GOAL = {
  title: "Make running a habit",
  cadence: "3 sessions each week",
  progress: "2 of 3 sessions",
  next: "Tempo run · Friday",
  why: "Build energy for everyday life.",
  start: "September 14, 2026",
  visibility: "Only you",
} as const;

function GoalDetails() {
  return (
    <dl className="mt-5 divide-y text-sm">
      <div className="grid grid-cols-[6.25rem_1fr] gap-3 py-3">
        <dt className="text-muted-foreground">Cadence</dt>
        <dd>{GOAL.cadence}</dd>
      </div>
      <div className="grid grid-cols-[6.25rem_1fr] gap-3 py-3">
        <dt className="text-muted-foreground">Starts</dt>
        <dd>{GOAL.start}</dd>
      </div>
      <div className="grid grid-cols-[6.25rem_1fr] gap-3 py-3">
        <dt className="text-muted-foreground">Visibility</dt>
        <dd>{GOAL.visibility}</dd>
      </div>
      <div className="grid grid-cols-[6.25rem_1fr] gap-3 py-3">
        <dt className="text-muted-foreground">Why</dt>
        <dd>{GOAL.why}</dd>
      </div>
    </dl>
  );
}

function GoalOverview({
  completed,
  disabled = false,
  onComplete,
}: {
  completed: boolean;
  disabled?: boolean;
  onComplete: () => void;
}) {
  return (
    <>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
          Health · recurring
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{GOAL.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{GOAL.cadence}</p>
      </div>
      <div className="mt-8">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span>{GOAL.progress}</span>
          <span className="text-muted-foreground">This week</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-violet-100" aria-hidden="true">
          <div className="h-full w-2/3 rounded-full bg-violet-600" />
        </div>
        <p className="mt-4 text-sm">Next · {GOAL.next}</p>
      </div>
      <Button
        className="mt-6 w-full"
        disabled={disabled}
        variant={completed ? "secondary" : "outline"}
        onClick={onComplete}
      >
        <Check className="size-4" aria-hidden="true" />
        {completed ? "Session complete" : "Mark today’s session done"}
      </Button>
    </>
  );
}

export function GoalCardConcept() {
  const [flipped, setFlipped] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [flipCompleted, setFlipCompleted] = useState(false);
  const [expandCompleted, setExpandCompleted] = useState(false);

  return (
    <div className="min-h-dvh bg-slate-50">
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Exploratory · goal detail · not production
        </p>
        <h1 className="mt-2 max-w-2xl text-[2rem] font-semibold leading-[1.1] tracking-tight sm:text-4xl">
          A goal can be brief until you ask for its context.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground">
          Both studies keep the goal, cadence, progress, and next action at a glance.
          Details are explicit and secondary. Completion stays a separate action.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border bg-card p-5 ring-1 ring-foreground/10 sm:p-6" aria-labelledby="flip-heading">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">A · Flip</p>
            <h2 id="flip-heading" className="mt-1 text-xl font-semibold tracking-tight">A tangible goal object</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The reverse holds setup metadata. The card keeps its size so the surrounding plan does not move.
            </p>
            <div className={styles.stage}>
              <div className={cn(styles.rotor, flipped && styles.flipped)}>
                <section className={cn(styles.face, "rounded-xl border bg-background p-5")} aria-hidden={flipped}>
                  <GoalOverview
                    completed={flipCompleted}
                    disabled={flipped}
                    onComplete={() => setFlipCompleted((value) => !value)}
                  />
                </section>
                <section id="flip-card-details" className={cn(styles.face, styles.back, "rounded-xl border bg-background p-5")} aria-hidden={!flipped}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Goal setup</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight">{GOAL.title}</h3>
                  <GoalDetails />
                </section>
              </div>
            </div>
            <Button className="mt-5 w-full" variant="outline" onClick={() => setFlipped((value) => !value)} aria-expanded={flipped} aria-controls="flip-card-details">
              <RotateCcw className="size-4" aria-hidden="true" />
              {flipped ? "Overview" : "Details"}
            </Button>
            <p className="mt-3 text-sm text-muted-foreground">
              Visible label plus rotation gives the interaction a clear signifier; motion is nonessential.
            </p>
          </section>

          <section className="rounded-2xl border bg-card p-5 ring-1 ring-foreground/10 sm:p-6" aria-labelledby="expand-heading">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">B · Expand</p>
            <h2 id="expand-heading" className="mt-1 text-xl font-semibold tracking-tight">One continuous reading surface</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Details appear beneath the overview, which keeps progress visible while someone reads the setup.
            </p>
            <div className="mt-5 rounded-xl border bg-background p-5">
              <GoalOverview completed={expandCompleted} onComplete={() => setExpandCompleted((value) => !value)} />
              <div
                id="expand-card-details"
                className={cn(
                  "grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none",
                  expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <GoalDetails />
                </div>
              </div>
              <Button className="mt-5 w-full" variant="outline" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} aria-controls="expand-card-details">
                <ChevronDown className={cn("size-4 transition-transform motion-reduce:transition-none", expanded && "rotate-180")} aria-hidden="true" />
                {expanded ? "Less detail" : "Details"}
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Better when details are read often, compared, or used to make a next decision.
            </p>
          </section>
        </div>

        <section className="mt-8 rounded-2xl border bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Creation cue</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Use the flip for staged creation, not each field.</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Keep the form fixed. As a person moves from “What do you want?” to “Set your rhythm,” turn the adjacent preview to its setup side. The review step returns to the overview. This gives the motion a single, understandable meaning.
          </p>
        </section>
      </main>
    </div>
  );
}
